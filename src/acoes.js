// Ações do jogador sobre o estado da fazenda. Cada função muda o estado e devolve
// { ok, msg } para a interface mostrar o resultado.
import { CULTURAS, ITENS, CONSTRUCOES, LOTES, LOCAIS_MANDALA, nivelDe, nomeItem, precoVenda, BALDE_COZINHA } from "./dados.js";
import * as E from "./estado.js";
import { prontaParaColher, estacao, massaPilha, cnPilha, CICLO_PEIXE } from "./simulacao.js";

const L_POR_CARGA = 10;

export function conta(e, chave, n = 1) {
  e.missoes.passos[chave] = (e.missoes.passos[chave] || 0) + n;
}

export function ganharXp(e, n) {
  const antes = nivelDe(e.xp);
  e.xp += n;
  const depois = nivelDe(e.xp);
  return depois > antes ? depois : 0;
}

export function diaDeFeira(e) {
  return E.dia(e) % 7 === 0;
}
export function precoAtual(e, id) {
  return Math.round(precoVenda(id) * (diaDeFeira(e) ? 1.4 : 1));
}

// ------------------------------------------------------------ Ferramentas no mapa
export function usarFerramenta(e, ferr, x, y, op = {}) {
  const t = E.tile(e, x, y);
  const constr = E.construcaoEm(e, x, y);
  if (constr) return { ok: true, abrir: { tipo: "construcao", c: constr } };
  const fixo = E.fixoEm(x, y);
  if (fixo) return { ok: true, abrir: { tipo: fixo } };
  const arv = E.arvoreEm(x, y);
  if (arv) return coletarArvore(e, arv);
  if (!t) return { ok: false, msg: "Aqui não dá para mexer." };
  if (!E.tileLiberado(e, x, y)) {
    const lote = LOTES.find((l) => l.id === E.loteDe(x, y));
    return { ok: false, msg: lote ? `Terreno à venda: ${lote.nome}. Compre no menu Terras.` : "Terreno bloqueado.", abrir: lote ? { tipo: "terras" } : null };
  }
  if (t.mandala && t.parte && t.parte !== "canteiro" && ferr !== "mao") return { ok: false, msg: t.parte === "caminho" ? "Este é um caminho da mandala." : "Este é o reservatório central." };
  switch (ferr) {
    case "mao": return usarMao(e, t, x, y);
    case "enxada": return usarEnxada(e, t);
    case "semente": return plantar(e, t, op.cultura);
    case "regador": return regar(e, t);
    case "adubo": return adubar(e, t, op.insumo || "composto");
    case "palha": return cobrir(e, t);
    case "gotejo": return instalarGotejo(e, t);
  }
  return { ok: false };
}

function coletarArvore(e, a) {
  const k = `${a.x},${a.y}`;
  const ultima = e.arvoresColeta[k] ?? -999;
  if (e.horas - ultima < 12) return { ok: false, msg: "Esta árvore já foi aproveitada hoje. Volte mais tarde." };
  e.arvoresColeta[k] = e.horas;
  E.dar(e, "folhas", 2);
  E.dar(e, "galhos", 2);
  conta(e, "galhos", 2);
  return { ok: true, msg: "+2 folhas secas e +2 galhos (catados do chão, sem cortar a árvore).", efeito: "pegar", xp: 1 };
}

function usarMao(e, t) {
  if (t.morta) return limparSeca(e, t);
  if (prontaParaColher(t)) return colher(e, t);
  return { ok: true, info: t };
}

function limparSeca(e, t) {
  t.morta = false;
  t.c = null;
  t.h = 0;
  t.sec = 0;
  E.dar(e, "palha", 1);
  return { ok: true, msg: "Planta seca retirada: virou palha para a composteira.", efeito: "enxada" };
}

function usarEnxada(e, t) {
  if (t.morta) return limparSeca(e, t);
  if (t.t === "mato") {
    if (t.pedra) {
      t.pedra = false;
      return { ok: true, msg: "Pedra retirada. Mais uma enxadada para limpar o mato.", efeito: "enxada" };
    }
    t.t = "terra";
    E.dar(e, "palha", 1);
    conta(e, "limpar");
    if (t.mandala) conta(e, "mandalaLimpo");
    return { ok: true, msg: "Mato limpo: +1 palha.", efeito: "enxada", xp: 1 };
  }
  if (t.t === "terra") {
    t.t = "preparada";
    conta(e, "preparar");
    return { ok: true, efeito: "enxada", xp: 1 };
  }
  if (t.c) return { ok: false, msg: "Já tem planta aqui. Use a mão para colher." };
  return { ok: false, msg: "Este canteiro já está preparado. Escolha uma semente." };
}

export function plantar(e, t, cultura) {
  if (!cultura) return { ok: false, msg: "Escolha uma semente primeiro.", abrir: { tipo: "sementes" } };
  const c = CULTURAS[cultura];
  if (t.mandala && e.mandala.etapa < 5) return { ok: false, msg: "Termine de montar a mandala antes de plantar nela." };
  if (t.t !== "preparada") return { ok: false, msg: t.t === "mato" ? "Limpe o mato com a enxada antes." : "Prepare a terra com a enxada antes de plantar." };
  if (t.c) return { ok: false, msg: "Este canteiro já está plantado." };
  if (!E.tirar(e, "sem_" + cultura)) return { ok: false, msg: `Sem sementes de ${c.nome.toLowerCase()}. Compre na loja.`, abrir: { tipo: "loja" } };
  t.rot = t.ult === cultura;
  if (t.ult && t.ult !== cultura && cultura === "feijao") conta(e, "rotacao");
  t.c = cultura;
  t.h = 0;
  t.sec = 0;
  t.col = 0;
  t.murcha = false;
  conta(e, "plantar");
  conta(e, "plantar_" + cultura);
  if (t.mandala) conta(e, "plantarMandala");
  return { ok: true, efeito: "plantar", xp: 1, msg: t.rot ? `Mesma cultura de antes neste canteiro: vai crescer mais devagar. Experimente fazer rotação.` : null };
}

function regar(e, t) {
  if (e.regador.carga <= 0) return { ok: false, msg: "O regador está vazio. Toque na cisterna para encher.", alvoCisterna: true };
  e.regador.carga--;
  t.u = 100;
  if (t.murcha) t.sec = Math.min(t.sec, 1);
  let msg = null;
  if (e.regador.tanque > 0) {
    e.regador.tanque--;
    t.f = Math.min(100, t.f + 3);
    conta(e, "aguaTanqueHorta");
    msg = "Regado com água do tanque de peixes: ela leva nutrientes para a planta.";
  }
  conta(e, "regar");
  return { ok: true, efeito: "regar", msg };
}

function adubar(e, t, insumo) {
  if (t.t === "mato") return { ok: false, msg: "Limpe o mato antes de adubar." };
  if (!E.tirar(e, insumo)) return { ok: false, msg: `Você não tem ${nomeItem(insumo).toLowerCase()}.`, abrir: insumo === "adubo" ? { tipo: "loja" } : null };
  const ganho = { composto: 25, humus: 35, adubo: 20 }[insumo];
  t.f = Math.min(100, t.f + ganho);
  if (insumo !== "adubo") {
    conta(e, "compostoAplicado");
    if (t.mandala && !t.adub) { t.adub = true; conta(e, "mandalaAdubado"); }
  }
  return { ok: true, efeito: "plantar", msg: `Fertilidade do canteiro: ${Math.round(t.f)}.`, xp: insumo === "adubo" ? 0 : 2 };
}

function cobrir(e, t) {
  if (t.pal) return { ok: false, msg: "Este canteiro já tem cobertura de palha." };
  if (t.t === "mato") return { ok: false, msg: "Limpe o mato antes." };
  if (!E.tirar(e, "palha")) return { ok: false, msg: "Sem palha. Limpe mato ou retire plantas secas para conseguir." };
  t.pal = true;
  conta(e, "cobrir");
  return { ok: true, efeito: "plantar", msg: "Cobertura de palha: o solo perde menos água para o sol.", xp: 1 };
}

function instalarGotejo(e, t) {
  if (t.got) return { ok: false, msg: "Já tem gotejamento aqui." };
  if (t.t === "mato") return { ok: false, msg: "Limpe o mato antes." };
  if (!E.tirar(e, "kitGotejo")) return { ok: false, msg: "Você precisa de um kit de gotejamento (loja).", abrir: { tipo: "loja" } };
  t.got = true;
  conta(e, "gotejo");
  return { ok: true, efeito: "instalar", msg: "Gotejamento instalado: rega sozinho usando a água da cisterna.", xp: 2 };
}

export function colher(e, t) {
  const c = CULTURAS[t.c];
  const n = c.rend + (t.f >= 65 ? 1 : 0) - (t.f < 20 ? 1 : 0);
  E.dar(e, t.c, Math.max(1, n));
  if (c.familia === "graminea" || c.familia === "leguminosa") E.dar(e, "palha", 1);
  else E.dar(e, "restos", 1);
  if (t.c === "feijao") t.f = Math.min(100, t.f + 8);
  else t.f = Math.max(5, t.f - 6);
  e.stats.colheitas++;
  e.stats.colhidas[t.c] = (e.stats.colhidas[t.c] || 0) + 1;
  conta(e, "colher");
  conta(e, "colher_" + t.c);
  if (t.mandala) conta(e, "colheitaMandala");
  const nome = c.nome;
  t.col++;
  if (c.rebrota && (c.perene || t.col < c.colheitas)) {
    t.h = c.cresce - c.rebrota;
  } else {
    t.ult = t.c;
    t.c = null;
    t.h = 0;
    t.rot = false;
  }
  return { ok: true, efeito: "colher", msg: `+${Math.max(1, n)} ${nome.toLowerCase()}`, xp: c.xp, produto: true };
}

// ------------------------------------------------------------ Água
export function encherRegador(e) {
  const falta = e.regador.max - e.regador.carga;
  if (falta <= 0) return { ok: false, msg: "O regador já está cheio." };
  const podem = Math.min(falta, Math.floor(e.cisterna.agua / L_POR_CARGA));
  if (podem <= 0) return { ok: false, msg: "A cisterna está vazia! Espere a chuva ou economize água." };
  e.cisterna.agua -= podem * L_POR_CARGA;
  e.stats.aguaUsada += podem * L_POR_CARGA;
  e.regador.carga += podem;
  return { ok: true, efeito: "regar", msg: `Regador cheio (${e.regador.carga}/${e.regador.max}). Cisterna: ${Math.round(e.cisterna.agua)} L.` };
}

// ------------------------------------------------------------ Comércio
export function vender(e, id, n) {
  n = Math.min(n, E.qtd(e, id));
  if (n <= 0) return { ok: false };
  const preco = precoAtual(e, id) * n;
  E.tirar(e, id, n);
  e.moedas += preco;
  e.stats.vendas += n;
  e.stats.moedasGanhas += preco;
  conta(e, "vender", n);
  if (diaDeFeira(e)) conta(e, "vendaFeira", n);
  return { ok: true, efeito: "moeda", msg: `Vendeu ${n} × ${nomeItem(id).toLowerCase()} por ${preco} moedas.`, xp: Math.ceil(n / 2) };
}

export function precoCompra(id) {
  if (id.startsWith("sem_")) return CULTURAS[id.slice(4)].semente;
  return ITENS[id]?.compra || 0;
}
export function comprar(e, id, n = 1) {
  const p = precoCompra(id) * n;
  if (e.moedas < p) return { ok: false, msg: "Moedas insuficientes." };
  e.moedas -= p;
  E.dar(e, id, n);
  return { ok: true, efeito: "moeda", msg: `Comprou ${n} × ${nomeItem(id).toLowerCase()}.` };
}

export function comprarLote(e, id) {
  const l = LOTES.find((x) => x.id === id);
  if (!l || e.lotes.includes(id)) return { ok: false };
  if (E.nivel(e) < l.nivel) return { ok: false, msg: `Disponível no nível ${l.nivel}.` };
  if (e.moedas < l.preco) return { ok: false, msg: "Moedas insuficientes." };
  e.moedas -= l.preco;
  e.lotes.push(id);
  return { ok: true, efeito: "instalar", msg: `Agora o ${l.nome.toLowerCase()} é seu!`, xp: 10 };
}

// Pedidos da comunidade
const CLIENTES = ["Dona Rita", "Seu Raimundo", "Escola municipal", "Mercadinho do Zé", "Cozinha comunitária", "Associação de moradores"];
export function gerarPedidos(e, rnd = Math.random) {
  const liberadas = E.culturasLiberadas(e).filter((c) => !CULTURAS[c].forragem);
  const temOvo = e.construcoes.some((c) => c.tipo === "galinheiro");
  while (e.pedidos.length < 3) {
    const itens = {};
    const k = 1 + Math.floor(rnd() * Math.min(3, liberadas.length));
    for (let i = 0; i < k; i++) {
      const id = temOvo && rnd() < 0.2 ? "ovo" : liberadas[Math.floor(rnd() * liberadas.length)];
      itens[id] = (itens[id] || 0) + 1 + Math.floor(rnd() * 4);
    }
    const valor = Object.entries(itens).reduce((s, [id, q]) => s + precoVenda(id) * q, 0);
    e.pedidos.push({ id: e.proxId++, cliente: CLIENTES[Math.floor(rnd() * CLIENTES.length)], itens, moedas: Math.round(valor * 1.6 + 5), xp: Math.round(valor * 0.5 + 4) });
  }
}
export function podeEntregar(e, p) {
  return Object.entries(p.itens).every(([id, q]) => E.qtd(e, id) >= q);
}
export function entregar(e, p) {
  if (!podeEntregar(e, p)) return { ok: false, msg: "Faltam produtos para este pedido." };
  for (const [id, q] of Object.entries(p.itens)) E.tirar(e, id, q);
  e.moedas += p.moedas;
  e.stats.moedasGanhas += p.moedas;
  e.pedidos = e.pedidos.filter((x) => x !== p);
  conta(e, "pedidos");
  return { ok: true, efeito: "moeda", msg: `${p.cliente} agradece! +${p.moedas} moedas.`, xp: p.xp };
}

// ------------------------------------------------------------ Construção
export function podeConstruir(e, tipo, x, y) {
  const d = CONSTRUCOES[tipo];
  for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
    const tx = x + i, ty = y + j;
    if (E.arvoreEm(tx, ty)) return { ok: false, msg: "Tem uma árvore aqui: escolha um lugar ao lado dela." };
    if (E.fixoEm(tx, ty)) return { ok: false, msg: "Já tem uma construção aqui." };
    const t = E.tile(e, tx, ty);
    if (!t || t.mandala || !E.tileLiberado(e, tx, ty)) return { ok: false, msg: "Construa dentro das suas terras." };
    if (t.c) return { ok: false, msg: "Tem plantação no caminho." };
    if (E.construcaoEm(e, tx, ty)) return { ok: false, msg: "Já tem uma construção aqui." };
  }
  return { ok: true };
}
export function construir(e, tipo, x, y) {
  const d = CONSTRUCOES[tipo];
  if (E.nivel(e) < d.nivel) return { ok: false, msg: `Disponível no nível ${d.nivel}.` };
  if (d.unica && e.construcoes.some((c) => c.tipo === tipo)) return { ok: false, msg: "Você já tem esta construção." };
  if (e.moedas < d.custo) return { ok: false, msg: "Moedas insuficientes." };
  if (d.galhos && E.qtd(e, "galhos") < d.galhos) return { ok: false, msg: `Precisa de ${d.galhos} galhos (cate perto das árvores).` };
  const v = podeConstruir(e, tipo, x, y);
  if (!v.ok) return v;
  e.moedas -= d.custo;
  if (d.galhos) E.tirar(e, "galhos", d.galhos);
  for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
    const t = E.tile(e, x + i, y + j);
    Object.assign(t, { t: "terra", c: null, pal: false, got: false, pedra: false });
  }
  const c = { id: e.proxId++, tipo, x, y };
  if (tipo === "composteira") c.pilha = novaPilha();
  if (tipo === "galinheiro") Object.assign(c, { animais: 3, comida: 0, agua: 0, estoque: 0, esterco: 0 });
  if (tipo === "cercado") Object.assign(c, { animais: 2, comida: 0, agua: 0, estoque: 0, esterco: 0 });
  if (tipo === "tanque") Object.assign(c, { nivelAgua: 0, peixes: 0, ciclo: 0, comida: 0, qualidade: 100, lodo: 0 });
  if (tipo === "minhocario") Object.assign(c, { carga: 0, humus: 0, horas: 0 });
  if (tipo === "cisterna2") e.cisterna.cap += 300;
  e.construcoes.push(c);
  conta(e, "construir_" + tipo);
  return { ok: true, efeito: "instalar", msg: `${d.nome} construída!`, xp: 8, c };
}
export function demolir(e, c) {
  e.construcoes = e.construcoes.filter((x) => x !== c);
  if (c.tipo === "cisterna2") { e.cisterna.cap -= 300; e.cisterna.agua = Math.min(e.cisterna.agua, e.cisterna.cap); }
  return { ok: true, msg: "Construção retirada." };
}

// ------------------------------------------------------------ Composteira
export function novaPilha() {
  return { mat: {}, u: 45, aer: 100, prog: 0, temp: 28, pronto: false };
}
export function adicionarPilha(e, c, id, n = 1) {
  const p = c.pilha;
  if (p.pronto) return { ok: false, msg: "Colete o composto pronto antes de montar outra pilha." };
  if (p.prog >= 40) return { ok: false, msg: "A pilha já está em decomposição. Deixe maturar; comece outra depois." };
  if (!ITENS[id]?.cn) return { ok: false, msg: "Este material não vai para a composteira." };
  if (!E.tirar(e, id, n)) return { ok: false, msg: `Você não tem ${nomeItem(id).toLowerCase()}.` };
  const antes = massaPilha(p);
  p.mat[id] = (p.mat[id] || 0) + n;
  if (antes > 0) p.prog *= antes / (antes + n); // material novo "dilui" o processo
  if (id === "esterco") conta(e, "estercoComposto", n);
  conta(e, "pilhaMaterial", n);
  return { ok: true, efeito: "plantar" };
}
export function regarPilha(e, c) {
  if (e.cisterna.agua < 5) return { ok: false, msg: "Sem água na cisterna." };
  e.cisterna.agua -= 5;
  c.pilha.u = Math.min(100, c.pilha.u + 15);
  conta(e, "regarPilha");
  return { ok: true, efeito: "regar" };
}
export function revirarPilha(e, c) {
  c.pilha.aer = 100;
  c.pilha.u = Math.max(0, c.pilha.u - 4);
  conta(e, "revirar");
  return { ok: true, efeito: "enxada", msg: "Pilha revirada: entrou ar e o calor voltou a subir." };
}
export function coletarComposto(e, c) {
  const p = c.pilha;
  if (!p.pronto) return { ok: false };
  E.dar(e, "composto", p.saida);
  e.stats.compostoFeito += p.saida;
  conta(e, "compostoColetado", p.saida);
  const caprichado = (p.horasBoas || 0) > 50;
  if (caprichado && !e.conquistas.includes("compostoCaprichado")) e.conquistas.push("compostoCaprichado");
  c.pilha = novaPilha();
  return { ok: true, efeito: "colher", msg: `+${p.saida} composto orgânico. Use o adubo nos canteiros.`, xp: 20 };
}
// Separar o lixo da cozinha: devolve o que foi aceito.
export function separarBalde(e, escolhidos) {
  let certos = 0;
  for (const id of escolhidos) {
    const it = BALDE_COZINHA.find((b) => b.id === id);
    if (it?.ok) { E.dar(e, it.vira, 1); certos++; }
  }
  conta(e, "balde");
  return certos;
}

// ------------------------------------------------------------ Animais
export function alimentarAnimais(e, c, item) {
  const n = c.animais;
  if (E.qtd(e, item) < n) return { ok: false, msg: `Precisa de ${n} × ${nomeItem(item).toLowerCase()}.` };
  if (c.tipo === "cercado" && item !== "palma" && item !== "milho") return { ok: false, msg: "Cabras comem forragem, como palma forrageira ou milho." };
  E.tirar(e, item, n);
  c.comida = Math.min(48, (c.comida || 0) + 24);
  if (c.tipo === "cercado" && item === "palma") conta(e, "palmaCabras");
  conta(e, "alimentar");
  return { ok: true, efeito: "plantar", msg: "Comedouro abastecido por um dia." };
}
export function darAgua(e, c) {
  const l = c.animais * 4;
  if (e.cisterna.agua < l) return { ok: false, msg: "Sem água na cisterna." };
  e.cisterna.agua -= l;
  e.stats.aguaUsada += l;
  c.agua = Math.min(48, (c.agua || 0) + 24);
  return { ok: true, efeito: "regar", msg: `Bebedouro cheio (${l} L).` };
}
export function coletarProducao(e, c) {
  const n = Math.floor(c.estoque || 0);
  if (n <= 0) return { ok: false, msg: "Ainda não há nada para coletar." };
  const id = c.tipo === "galinheiro" ? "ovo" : "leite";
  E.dar(e, id, n);
  c.estoque = 0;
  e.stats[id === "ovo" ? "ovos" : "leite"] += n;
  conta(e, id === "ovo" ? "ovosColetados" : "leiteColetado", n);
  return { ok: true, efeito: "colher", msg: `+${n} ${nomeItem(id).toLowerCase()}${n > 1 ? "s" : ""}`, xp: n * 2 };
}
export function coletarEsterco(e, c) {
  const n = Math.floor(c.esterco || 0);
  if (n <= 0) return { ok: false, msg: "Pouco esterco por enquanto." };
  E.dar(e, "esterco", n);
  c.esterco -= n;
  return { ok: true, efeito: "pegar", msg: `+${n} esterco para a composteira.` };
}

// ------------------------------------------------------------ Tanque de peixes (Sisteminha)
export function encherTanque(e, c) {
  const falta = 100 - c.nivelAgua;
  const l = Math.ceil(falta * 2);
  if (falta <= 0) return { ok: false, msg: "O tanque já está cheio." };
  if (e.cisterna.agua < l) return { ok: false, msg: `Precisa de ${l} L na cisterna.` };
  e.cisterna.agua -= l;
  e.stats.aguaUsada += l;
  c.nivelAgua = 100;
  conta(e, "encherTanque");
  return { ok: true, efeito: "regar", msg: `Tanque cheio (${l} L da cisterna).` };
}
export function soltarAlevinos(e, c) {
  if (c.nivelAgua < 90) return { ok: false, msg: "Encha o tanque antes." };
  if (c.peixes) return { ok: false, msg: "Já há peixes no tanque." };
  if (!E.tirar(e, "alevinos")) return { ok: false, msg: "Compre alevinos na loja.", abrir: { tipo: "loja" } };
  c.peixes = 20;
  c.ciclo = 0;
  c.qualidade = 100;
  conta(e, "alevinos");
  return { ok: true, efeito: "regar", msg: "20 alevinos de tilápia no tanque." };
}
export function alimentarPeixes(e, c) {
  if (!c.peixes) return { ok: false, msg: "Não há peixes no tanque." };
  if (!E.tirar(e, "racao")) return { ok: false, msg: "Sem ração. Compre na loja.", abrir: { tipo: "loja" } };
  c.comida = Math.min(36, (c.comida || 0) + 24);
  conta(e, "alimentarPeixes");
  return { ok: true, efeito: "plantar", msg: "Peixes alimentados por um dia." };
}
// Troca parcial da água: a água que sai, rica em nutrientes, vai para o regador e a horta.
export function renovarAgua(e, c) {
  if (!c.peixes) return { ok: false, msg: "Ainda não há peixes." };
  if (e.cisterna.agua < 40) return { ok: false, msg: "Precisa de 40 L na cisterna para repor a água." };
  e.cisterna.agua -= 40;
  e.stats.aguaUsada += 40;
  c.qualidade = Math.min(100, c.qualidade + 45);
  e.regador.tanque = e.regador.max;
  e.regador.carga = e.regador.max;
  conta(e, "renovarAgua");
  return { ok: true, efeito: "regar", msg: "Água renovada. O regador saiu cheio com a água do tanque: use na horta!" };
}
export function despescar(e, c) {
  if (!c.peixes || c.ciclo < CICLO_PEIXE) return { ok: false, msg: "Os peixes ainda estão crescendo." };
  const n = Math.round(6 + (c.qualidade / 100) * 4);
  E.dar(e, "peixe", n);
  e.stats.peixes += n;
  Object.assign(c, { peixes: 0, ciclo: 0, comida: 0, nivelAgua: 30, qualidade: 100 });
  conta(e, "despesca");
  return { ok: true, efeito: "colher", msg: `Despesca: +${n} tilápias! Limpe e encha o tanque para o próximo ciclo.`, xp: 40 };
}
export function coletarLodo(e, c) {
  const n = Math.floor(c.lodo || 0);
  if (n <= 0) return { ok: false, msg: "Pouco sedimento no fundo por enquanto." };
  E.dar(e, "esterco", n);
  c.lodo -= n;
  conta(e, "lodo", n);
  return { ok: true, efeito: "pegar", msg: `+${n} de sedimento (rico em nitrogênio) para a composteira ou minhocário.` };
}
export function abastecerMinhocario(e, c, item) {
  if (!E.tirar(e, item)) return { ok: false, msg: `Você não tem ${nomeItem(item).toLowerCase()}.` };
  c.carga = (c.carga || 0) + 1;
  if (item === "esterco") conta(e, "estercoComposto");
  conta(e, "minhocario");
  return { ok: true, efeito: "plantar", msg: "As minhocas vão transformar isso em húmus em cerca de um dia." };
}
export function coletarHumus(e, c) {
  const n = c.humus || 0;
  if (n <= 0) return { ok: false, msg: "Ainda não há húmus pronto." };
  E.dar(e, "humus", n);
  c.humus = 0;
  conta(e, "humusColetado", n);
  return { ok: true, efeito: "colher", msg: `+${n} húmus de minhoca.`, xp: n * 2 };
}

// ------------------------------------------------------------ Melhorias
export function instalarCalha(e) {
  if (e.calha) return { ok: false };
  if (E.nivel(e) < 3) return { ok: false, msg: "Disponível no nível 3." };
  if (e.moedas < 90) return { ok: false, msg: "Moedas insuficientes (90)." };
  e.moedas -= 90;
  e.calha = true;
  conta(e, "calha");
  return { ok: true, efeito: "instalar", msg: "Calhas no telhado: a cisterna capta o dobro de água da chuva.", xp: 10 };
}
export function melhorarRegador(e) {
  if (e.regador.max >= 12) return { ok: false, msg: "O regador já está no máximo." };
  if (e.moedas < 80) return { ok: false, msg: "Moedas insuficientes (80)." };
  e.moedas -= 80;
  e.regador.max = 12;
  return { ok: true, efeito: "instalar", msg: "Regador grande: agora carrega 12 regas.", xp: 5 };
}

// ------------------------------------------------------------ Mandala
export function escolherLocalMandala(e, local) {
  const L = LOCAIS_MANDALA[local];
  if (!L || e.mandala.etapa !== 0) return { ok: false };
  e.mandala.local = local;
  e.mandala.etapa = 1;
  let mato = 0;
  for (let y = Math.floor(L.cy - 6); y <= L.cy + 6; y++) for (let x = Math.floor(L.cx - 6); x <= L.cx + 6; x++) {
    if (!E.naMandala(x, y, local)) continue;
    if (E.construcaoEm(e, x, y) || E.arvoreEm(x, y)) continue;
    const k = E.chave(x, y);
    const velho = e.tiles[k];
    const ehMato = !velho || velho.t === "mato" || ((x * 3 + y) % 4 === 0);
    e.tiles[k] = { t: ehMato ? "mato" : "terra", u: 30, f: 40, c: null, h: 0, sec: 0, col: 0, pal: false, got: false, ult: null, morta: false, pedra: false, mandala: true };
    if (ehMato) mato++;
  }
  e.mandala.matoInicial = mato;
  return { ok: true, efeito: "instalar", msg: `Local escolhido: ${L.nome.toLowerCase()}. Agora limpe o mato do círculo com a enxada.` };
}
export function matoNaMandala(e) {
  return Object.values(e.tiles).filter((t) => t.mandala && t.t === "mato").length;
}
export function definirFormato(e, aneis, caminhos) {
  if (e.mandala.etapa !== 2) return { ok: false };
  e.mandala.aneis = aneis;
  e.mandala.caminhos = caminhos;
  aplicarPartesMandala(e);
  e.mandala.etapa = 3;
  return { ok: true, efeito: "instalar", msg: `${aneis} anéis de canteiros e ${caminhos} caminhos marcados no chão.`, xp: 10 };
}
export function aplicarPartesMandala(e) {
  const L = LOCAIS_MANDALA[e.mandala.local];
  for (const [k, t] of Object.entries(e.tiles)) {
    if (!t.mandala) continue;
    const [x, y] = k.split(",").map(Number);
    const n = E.naMandala(x, y, e.mandala.local);
    const p = E.partesMandala(e.mandala, n.d, n.ang);
    t.parte = p.tipo;
    t.anel = p.anel;
    if (p.tipo !== "canteiro") { t.c = null; t.t = "terra"; }
    void L;
  }
}
export function construirReservatorio(e) {
  if (e.mandala.etapa !== 3) return { ok: false };
  const custo = 150 + Math.round(150 * (LOCAIS_MANDALA[e.mandala.local].perda * 2));
  if (e.moedas < custo) return { ok: false, msg: `Precisa de ${custo} moedas (reservatório e cano até a cisterna).` };
  e.moedas -= custo;
  e.mandala.etapa = 4;
  return { ok: true, efeito: "instalar", msg: "Reservatório central pronto e ligado à cisterna por um cano.", xp: 15 };
}
export const IRRIGACOES = {
  gotejo: { nome: "Gotejamento nos canteiros", custo: 120, desc: "Rega sozinho, gota a gota na raiz. Gasta pouca água, mas custa mais para instalar." },
  aspersao: { nome: "Aspersão (chuveirinho)", custo: 50, desc: "Rega sozinho, mas parte da água evapora ou cai fora do canteiro." },
  manual: { nome: "Regador e mangueira", custo: 0, desc: "Sem custo, mas você rega cada canteiro com a mão." },
};
export function planejarIrrigacao(e, tipo) {
  if (e.mandala.etapa !== 4) return { ok: false };
  const ir = IRRIGACOES[tipo];
  if (e.moedas < ir.custo) return { ok: false, msg: "Moedas insuficientes." };
  e.moedas -= ir.custo;
  e.mandala.irrig = tipo;
  e.mandala.etapa = 5;
  return { ok: true, efeito: "instalar", msg: `${ir.nome} instalada. Agora adube os canteiros com composto e plante.`, xp: 10 };
}
export function abastecerMandala(e) {
  const falta = e.mandala.cap - e.mandala.agua;
  const l = Math.min(falta, e.cisterna.agua, 100); // de 100 em 100 L, para não secar a cisterna sem querer
  if (l <= 0) return { ok: false, msg: falta <= 0 ? "Reservatório cheio." : "Cisterna vazia." };
  e.cisterna.agua -= l;
  e.mandala.agua += l * (1 - LOCAIS_MANDALA[e.mandala.local].perda);
  return { ok: true, efeito: "regar", msg: `${Math.round(l)} L levados ao reservatório da mandala.` };
}
export function diversidadeMandala(e) {
  const s = new Set();
  for (const t of Object.values(e.tiles)) if (t.mandala && t.c) s.add(t.c);
  return s.size;
}
export function adubadosMandala(e) {
  return Object.values(e.tiles).filter((t) => t.mandala && t.adub).length;
}

// ------------------------------------------------------------ Seca
export function avaliarPreparo(e) {
  const plantados = Object.values(e.tiles).filter((t) => t.c && !t.morta);
  return {
    calha: e.calha,
    cisterna: e.cisterna.agua / e.cisterna.cap,
    cobertura: plantados.filter((t) => t.pal).length,
    gotejo: plantados.filter((t) => t.got).length,
    adaptadas: new Set(plantados.filter((t) => CULTURAS[t.c].adaptada).map((t) => t.c)).size,
    plantados: plantados.length,
  };
}
export { estacao };
