// Interface do Raízes do Sertão: HUD, barra de ferramentas, painéis, diálogos e missões.
import { CULTURAS, ITENS, CONSTRUCOES, LOTES, LOCAIS_MANDALA, CORES_CASA, GUIA, FONTES, BALDE_COZINHA, XP_NIVEL, nomeItem } from "./dados.js";
import * as E from "./estado.js";
import * as S from "./simulacao.js";
import * as Ac from "./acoes.js";
import * as M from "./missoes.js";
import * as A from "./arte.js";
import { folhaDeSprites, normalizar, APARENCIA_INICIAL } from "./personagem.js";
import { $, aviso, vibrar } from "./ui.js";

// ---------------------------------------------------------------- Helpers de DOM
function el(tag, props = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "onclick") n.addEventListener("click", v);
    else if (k === "style") n.style.cssText = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) n.append(f instanceof Node ? f : String(f));
  return n;
}
function ic(id, cls = "ic") {
  const c = document.createElement("canvas");
  c.width = 12;
  c.height = 12;
  c.className = cls;
  c.getContext("2d").drawImage(A.icone(id), 0, 0);
  return c;
}
function barra(valor, rotulo, classe = "") {
  const v = Math.max(0, Math.min(100, valor));
  return el("div", { class: "medida " + classe, role: "meter", "aria-valuenow": Math.round(v), "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": rotulo },
    el("span", { class: "medida-rotulo" }, rotulo),
    el("div", { class: "medida-barra" }, el("i", { style: `width:${v}%` })),
  );
}
const fmtH = (h) => (h >= 24 ? `${Math.floor(h / 24)} d ${Math.round(h % 24)} h` : `${Math.max(0, Math.round(h))} h`);
const nivelAgua = (c) => (c.agua < 4 ? "baixa" : c.agua < 6 ? "média" : "alta");

const FERRAMENTAS = [
  { id: "mao", nome: "Mão", icone: "mao", desc: "Colher, catar galhos, ver informações" },
  { id: "enxada", nome: "Enxada", icone: "enxada", desc: "Limpar o mato e preparar a terra" },
  { id: "semente", nome: "Plantar", icone: "semente", desc: "Plantar a semente escolhida" },
  { id: "regador", nome: "Regar", icone: "regador", desc: "Regar (encha na cisterna)" },
  { id: "adubo", nome: "Adubar", icone: "composto", desc: "Composto, húmus ou adubo", nivel: 2 },
  { id: "palha", nome: "Cobrir", icone: "palha", desc: "Cobrir o solo com palha", nivel: 2 },
  { id: "gotejo", nome: "Gotejo", icone: "gotejo", desc: "Instalar gotejamento", nivel: 3 },
];

export class UI {
  constructor({ audio, aoEditar, aoTitulo, aoOpcoes, aoSalvar }) {
    this.audio = audio;
    this.aoEditar = aoEditar;
    this.aoTitulo = aoTitulo;
    this.aoOpcoes = aoOpcoes;
    this.aoSalvar = aoSalvar;
    this.folhaAtual = null;
    this.dialogo = null;
    this.ultimoHud = 0;
    $("btn-menu").addEventListener("click", () => this.abrir({ tipo: "menu" }));
    $("btn-loja").addEventListener("click", () => this.abrir({ tipo: "loja" }));
    $("btn-construir").addEventListener("click", () => this.abrir({ tipo: "construir" }));
    $("btn-mochila").addEventListener("click", () => this.abrir({ tipo: "mochila" }));
    $("hud-missao").addEventListener("click", () => this.abrir({ tipo: "missoes" }));
    $("folha-fechar").addEventListener("click", () => this.fecharFolha());
    $("folha").addEventListener("click", (ev) => { if (ev.target.id === "folha") this.fecharFolha(); });
    $("col-ok").addEventListener("click", () => this.faz.confirmarColocacao());
    $("col-cancelar").addEventListener("click", () => this.faz.cancelarColocacao());
    $("dialogo").addEventListener("click", () => this.avancarDialogo());
    $("chip-semente").addEventListener("click", () => this.abrir({ tipo: this.faz.ferramenta === "adubo" ? "insumos" : "sementes" }));
  }

  ligar(faz) {
    this.faz = faz;
    this.e = faz.e;
    this.montarFerramentas();
    this.atualizarHud(true);
  }

  get aberto() {
    return !!this.folhaAtual || !!this.dialogo || !$("nivel-up").hidden;
  }

  // ------------------------------------------------------------ HUD
  atualizarHud(forcar) {
    const agora = performance.now();
    if (!forcar && agora - this.ultimoHud < 250) return;
    this.ultimoHud = agora;
    const e = this.e;
    const n = E.nivel(e);
    const ini = XP_NIVEL[n - 1], fim = XP_NIVEL[n] ?? XP_NIVEL[n - 1] + 1000;
    $("hud-moedas").textContent = e.moedas;
    $("hud-nivel").textContent = n;
    $("hud-xp").style.width = `${Math.min(100, ((e.xp - ini) / (fim - ini)) * 100)}%`;
    const pct = Math.round((e.cisterna.agua / e.cisterna.cap) * 100);
    $("hud-agua").textContent = `${Math.round(e.cisterna.agua)} L`;
    $("hud-agua-barra").style.width = `${pct}%`;
    $("hud-agua-box").classList.toggle("alerta", pct < 20);
    const h = E.horaDoDia(e);
    const hh = String(Math.floor(h)).padStart(2, "0"), mm = String(Math.floor((h % 1) * 60 / 10) * 10).padStart(2, "0");
    const est = S.estacao(e);
    const chove = S.chovendo(e);
    $("hud-dia").textContent = `Dia ${E.dia(e)} · ${hh}:${mm}`;
    let clima = est === "chuva" ? (chove ? "Chovendo" : "Época de chuvas") : "Estiagem";
    const ate = S.diasAteEstiagem(e);
    if (est === "chuva" && ate <= 2) clima += ` · seca em ${ate} d`;
    if (est === "seca") clima += ` · chuvas em ${S.diasAteChuvas(e)} d`;
    if (Ac.diaDeFeira(e)) clima += " · Feira!";
    $("hud-clima").textContent = clima;
    $("hud-clima").dataset.estacao = est;
    $("regador-carga").textContent = `${e.regador.carga}/${e.regador.max}`;
    // ferramenta escolhida e semente
    const f = this.faz.ferramenta;
    const chip = $("chip-semente");
    if (f === "semente") {
      chip.hidden = false;
      chip.replaceChildren(ic("sem_" + this.faz.cultura), el("span", {}, `${CULTURAS[this.faz.cultura].nome} (${E.qtd(e, "sem_" + this.faz.cultura)})`), el("b", {}, "trocar"));
    } else if (f === "adubo") {
      chip.hidden = false;
      chip.replaceChildren(ic(this.faz.insumo), el("span", {}, `${nomeItem(this.faz.insumo)} (${E.qtd(e, this.faz.insumo)})`), el("b", {}, "trocar"));
    } else if (f === "regador") {
      chip.hidden = false;
      chip.replaceChildren(ic("regador"), el("span", {}, `Regador ${e.regador.carga}/${e.regador.max}${e.regador.tanque ? " · água do tanque" : ""}`));
    } else chip.hidden = true;
    for (const b of document.querySelectorAll(".ferr")) {
      const def = FERRAMENTAS.find((x) => x.id === b.dataset.f);
      b.hidden = def.nivel && n < def.nivel && !(def.id === "gotejo" && E.qtd(e, "kitGotejo"));
    }
    // número de atalho (teclas 1 a 9 no computador)
    [...document.querySelectorAll(".ferr")].filter((b) => !b.hidden).forEach((b, i) => { b.dataset.num = i + 1; });
    this.atualizarDica();
  }

  montarFerramentas() {
    const barraF = $("ferramentas");
    barraF.replaceChildren();
    for (const f of FERRAMENTAS) {
      const b = el("button", { class: "ferr", "data-f": f.id, "aria-label": `${f.nome}: ${f.desc}`, "aria-pressed": String(this.faz.ferramenta === f.id) }, ic(f.icone, "ic grande"), el("span", {}, f.nome));
      if (f.id === "regador") b.append(el("small", { id: "regador-carga", class: "selo" }, ""));
      b.addEventListener("click", () => this.escolherFerramenta(f.id));
      barraF.append(b);
    }
  }
  escolherFerramenta(id) {
    const ja = this.faz.ferramenta === id;
    this.faz.ferramenta = id;
    this.audio.efeito("selecao");
    vibrar(6);
    for (const b of document.querySelectorAll(".ferr")) b.setAttribute("aria-pressed", String(b.dataset.f === id));
    if (id === "semente" && (ja || !E.qtd(this.e, "sem_" + this.faz.cultura))) this.abrir({ tipo: "sementes" });
    if (id === "adubo" && (ja || !E.qtd(this.e, this.faz.insumo))) this.abrir({ tipo: "insumos" });
    this.atualizarHud(true);
  }

  // Dica da missão em foco: texto, ferramenta pulsando e destaque no mapa.
  missaoEmFoco() {
    const e = this.e;
    const ordem = ["primeirosPassos", ...e.missoes.ativas.filter((x) => x !== "primeirosPassos")];
    for (const id of ordem) {
      if (!e.missoes.ativas.includes(id)) continue;
      const m = M.missao(id);
      const i = M.passoAtual(e, m);
      if (i >= 0) return { m, i, p: m.passos[i] };
    }
    return null;
  }
  atualizarDica() {
    const foco = this.missaoEmFoco();
    const chip = $("hud-missao");
    for (const b of document.querySelectorAll(".dica-pulsa")) b.classList.remove("dica-pulsa");
    this.faz.destaque = null;
    if (!foco) {
      const disp = M.disponiveis(this.e)[0];
      const txt = disp ? `Fale com ${M.PESSOAS[disp.pessoa].nome} (!)` : "Cultive à vontade: veja pedidos no quadro";
      if (chip.dataset.t !== txt) { chip.dataset.t = txt; chip.replaceChildren(el("b", {}, "Agora: "), txt); }
      return;
    }
    const txt = foco.p.txt;
    if (chip.dataset.t !== txt) {
      chip.dataset.t = txt;
      chip.replaceChildren(el("b", {}, `${foco.m.titulo}: `), txt);
    }
    if (foco.p.ferr) {
      const b = document.querySelector(`.ferr[data-f="${foco.p.ferr}"]`);
      if (b && this.faz.ferramenta !== foco.p.ferr) b.classList.add("dica-pulsa");
    }
    const alvo = foco.p.alvo;
    if (alvo === "construir") $("btn-construir").classList.add("dica-pulsa");
    if (alvo === "mandala" || alvo === "sisteminha") $("btn-menu").classList.add("dica-pulsa");
    const fx = { banca: E.FIXOS.banca, quadro: E.FIXOS.quadro, cisterna: E.FIXOS.cisterna }[alvo];
    if (fx) this.faz.destaque = { ponto: { x: (fx.x + fx.w / 2) * E.T, y: fx.y * E.T - 18 } };
    const c = this.e.construcoes.find((x) => x.tipo === alvo);
    if (c) this.faz.destaque = { ponto: { x: (c.x + CONSTRUCOES[c.tipo].w / 2) * E.T, y: c.y * E.T - 22 } };
    // tutorial: destaca canteiros
    if (foco.m.id === "primeirosPassos") {
      const tiles = [];
      for (const [k, t] of Object.entries(this.e.tiles)) {
        const [x, y] = k.split(",").map(Number);
        const ok = [
          () => t.t === "terra" && E.loteDe(x, y) === 0,
          () => t.t === "preparada" && !t.c,
          () => t.c && t.u < 60,
          () => t.c && S.prontaParaColher(t),
        ][foco.i];
        if (ok && ok() && tiles.length < 6) tiles.push([x, y]);
      }
      this.faz.destaque = { ...(this.faz.destaque || {}), tiles };
      if (foco.i === 2 && this.e.regador.carga === 0) {
        const fonte = this.e.cisterna.agua >= 5 ? E.FIXOS.cisterna : E.FIXOS.cacimba;
        this.faz.destaque.ponto = { x: (fonte.x + fonte.w / 2) * E.T, y: fonte.y * E.T - 20 };
      }
    }
    if (foco.p.alvoMandala && this.e.mandala.local) {
      const L = LOCAIS_MANDALA[this.e.mandala.local];
      this.faz.destaque = { ponto: { x: L.cx * E.T, y: (L.cy - 5.5) * E.T } };
    }
  }

  temNovidade(id) {
    if (!this.e) return false;
    return M.disponiveis(this.e).some((m) => m.pessoa === id);
  }

  // ------------------------------------------------------------ Resultado de ações
  resultado(r, wx, wy) {
    if (!r) return;
    if (!r.ok) {
      if (r.msg) { aviso(r.msg, { dur: 2600 }); this.audio.efeito("errado"); }
      if (r.abrir) this.abrir(r.abrir);
      return;
    }
    if (r.msg) {
      if (r.produto && wx !== undefined) this.faz.textoFlutuante(r.msg, wx, wy, "#fff3a0");
      else aviso(r.msg, { dur: 2800 });
    }
    if (r.xp) this.xp(r.xp, wx, wy);
    if (r.abrir) this.abrir(r.abrir);
    this.depoisDeMudar();
  }
  xp(n, wx, wy) {
    const sobe = Ac.ganharXp(this.e, n);
    if (wx !== undefined && n >= 2) this.faz.textoFlutuante(`+${n} xp`, wx, wy - 8, "#a6dc7e");
    if (sobe) this.subiuNivel(sobe);
  }
  depoisDeMudar() {
    this.verificarMissoes();
    this.atualizarHud(true);
    if (this.folhaAtual?.render) this.folhaAtual.render();
    this.aoSalvar();
  }

  subiuNivel(n) {
    this.audio.efeito("missao");
    vibrar([30, 40, 30]);
    const novos = [];
    for (const [id, c] of Object.entries(CULTURAS)) if (c.nivel === n) novos.push(`Semente: ${c.nome}`);
    for (const [, c] of Object.entries(CONSTRUCOES)) if (c.nivel === n) novos.push(`Construção: ${c.nome}`);
    for (const m of M.MISSOES) if (m.nivel === n) novos.push(`Missão: ${m.titulo} (fale com ${M.PESSOAS[m.pessoa].nome})`);
    for (const l of LOTES) if (l.nivel === n && l.preco) novos.push(`Terreno à venda: ${l.nome}`);
    if (n === 2) novos.push("Ferramentas: adubar e cobrir o solo");
    if (n === 3) novos.push("Ferramenta: gotejamento · calhas na cisterna");
    $("nivel-num").textContent = n;
    $("nivel-lista").replaceChildren(...novos.map((t) => el("li", {}, t)));
    $("nivel-up").hidden = false;
    $("nivel-ok").onclick = () => { $("nivel-up").hidden = true; this.audio.efeito("toque"); };
    this.montarFerramentas();
  }

  verificarMissoes() {
    const prontas = M.verificar(this.e);
    for (const m of prontas) {
      this.e.missoes.ativas = this.e.missoes.ativas.filter((x) => x !== m.id);
      this.e.missoes.feitas.push(m.id);
      this.e.moedas += m.premio.moedas || 0;
      for (const [id, q] of Object.entries(m.premio.itens || {})) E.dar(this.e, id, q);
      this.audio.efeito("missao");
      const premio = [`+${m.premio.moedas} moedas`, `+${m.premio.xp} xp`, ...Object.entries(m.premio.itens || {}).map(([id, q]) => `${q} × ${nomeItem(id).toLowerCase()}`)].join(", ");
      this.falar([...m.fim.map((t) => ({ quem: m.pessoa, texto: t })), { quem: "sistema", texto: `Missão concluída: ${m.titulo}! Recompensa: ${premio}.` }], () => this.xp(m.premio.xp));
      this.conquista(`missao_${m.id}`);
    }
    // conquistas
    const st = this.e.stats;
    if (st.colheitas >= 1) this.conquista("primeiraColheita");
    if (st.colheitas >= 50) this.conquista("maoNaTerra");
    if (Object.keys(st.colhidas).length >= 8) this.conquista("diversidade");
    if (Object.values(this.e.tiles).filter((t) => t.got).length >= 10) this.conquista("gotaAGota");
    if ((this.e.missoes.passos.rotacao || 0) >= 1) this.conquista("rotacao");
    if ((this.e.missoes.passos.vendaFeira || 0) >= 1) this.conquista("feirante");
  }
  conquista(id) {
    if (this.e.conquistas.includes(id)) return;
    this.e.conquistas.push(id);
    const c = CONQUISTAS[id];
    if (c) setTimeout(() => aviso(`Conquista: ${c.nome}!`, { dur: 3000 }), 400);
  }

  // Eventos da simulação (chuva, seca, composto pronto...)
  eventos(lista) {
    if (!lista || !lista.length) return;
    const e = this.e;
    const so = new Set(lista);
    if (so.has("novoDia")) {
      if (e.pedidos.length < 3) Ac.gerarPedidos(e);
      if (e.cisterna.agua < 40) aviso("A cisterna está quase vazia. Use a cacimba perto da estrada, cubra o solo com palha e plante culturas que pedem pouca água.", { dur: 5000 });
      else if (Ac.diaDeFeira(e)) aviso("Hoje é dia de feira! Os produtos vendem 40% mais caro na banca.", { dur: 4000 });
      const ate = S.diasAteEstiagem(e);
      if (S.estacao(e) === "chuva" && ate === 2) aviso("Previsão: a estiagem começa em 2 dias. Guarde água e cubra o solo!", { dur: 4500 });
      this.aoSalvar();
    }
    if (so.has("comecouSeca")) { M.inicioSeca(e); aviso("Começou a estiagem: sem chuva e o solo seca mais rápido.", { dur: 4500 }); }
    if (so.has("comecouChuva")) {
      const r = M.fimSeca(e);
      aviso(r === null ? "Voltou a época de chuvas!" : `Voltaram as chuvas! ${Math.round(r * 100)}% das plantas atravessaram a estiagem.`, { dur: 4500 });
      if (r !== null && r >= 0.8) this.conquista("sertaoResistente");
    }
    if (so.has("comecouChuva_dia")) aviso("Chuva! A cisterna vai encher e a cacimba já tem água de novo.", { dur: 3000 });
    if (so.has("compostoPronto")) { aviso("O composto está maduro! Colete na composteira.", { dur: 3500 }); this.audio.efeito("certo"); }
    if (so.has("murchou") && performance.now() - (this.ultMurcha || 0) > 20000) { this.ultMurcha = performance.now(); aviso("Uma planta murchou de sede. Regue logo!", { dur: 3000 }); }
    if (so.has("secou")) aviso("Uma planta secou. Retire com a mão ou a enxada: vira palha.", { dur: 3500 });
    if (so.has("peixesProntos")) aviso("Os peixes completaram o ciclo: hora da despesca!", { dur: 3500 });
    this.verificarMissoes();
  }

  // ------------------------------------------------------------ Diálogos
  falar(linhas, aoFim) {
    if (this.dialogo) { this.dialogo.linhas.push(...linhas); const f = this.dialogo.aoFim; this.dialogo.aoFim = () => { f?.(); aoFim?.(); }; return; }
    this.dialogo = { linhas, i: 0, aoFim };
    $("dialogo").hidden = false;
    this.mostrarLinha();
  }
  mostrarLinha() {
    const d = this.dialogo;
    const l = d.linhas[d.i];
    const p = M.PESSOAS[l.quem];
    $("dialogo-nome").textContent = p ? p.nome : l.quem === "sistema" ? "Raízes do Sertão" : this.faz.ap.nome || "Você";
    $("dialogo-texto").textContent = l.texto.replaceAll("{nome}", this.faz.ap.nome || "minha gente");
    const cv = $("dialogo-retrato");
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 20, 20);
    const folha = p ? folhaDeSprites(normalizar({ ...APARENCIA_INICIAL, ...p.ap })) : l.quem === "sistema" ? null : this.faz.folha;
    cv.style.visibility = folha ? "visible" : "hidden";
    if (folha) ctx.drawImage(folha, 2, 0, 20, 20, 0, 0, 20, 20);
    this.audio.efeito("dialogo");
  }
  avancarDialogo() {
    const d = this.dialogo;
    if (!d) return;
    d.i++;
    if (d.i >= d.linhas.length) {
      this.dialogo = null;
      $("dialogo").hidden = true;
      d.aoFim?.();
      return;
    }
    this.mostrarLinha();
  }

  falarCom(id) {
    const e = this.e;
    const disp = M.disponiveis(e).find((m) => m.pessoa === id);
    if (disp) {
      this.falar(disp.intro.map((t) => ({ quem: id, texto: t })), () => {
        e.missoes.ativas.push(disp.id);
        if (disp.id === "feira" && e.pedidos.length < 3) Ac.gerarPedidos(e);
        aviso(`Nova missão: ${disp.titulo}`, { dur: 3000 });
        this.audio.efeito("certo");
        this.depoisDeMudar();
      });
      return;
    }
    const ativa = e.missoes.ativas.map(M.missao).find((m) => m && m.pessoa === id);
    if (ativa) {
      const i = M.passoAtual(e, ativa);
      this.falar([{ quem: id, texto: i >= 0 ? `Próximo passo: ${ativa.passos[i].txt.toLowerCase()}.` : "Muito bem!" }, { quem: id, texto: ativa.aprende }]);
      return;
    }
    const papo = CONVERSAS[id] || ["Bom dia!"];
    const k = (this.papoI = ((this.papoI || 0) + 1)) % papo.length;
    this.falar([{ quem: id, texto: papo[k] }]);
  }

  // ------------------------------------------------------------ Folhas (painéis)
  abrir(o) {
    if (!o) return;
    const mapa = {
      menu: () => this.folhaMenu(), loja: () => this.folhaLoja("sementes"), sementes: () => this.folhaSementes(), insumos: () => this.folhaInsumos(),
      mochila: () => this.folhaMochila(), missoes: () => this.folhaMissoes(), guia: () => this.folhaGuia(), construir: () => this.folhaConstruir(),
      terras: () => this.abrirTerras(), mandala: () => this.abrirMandala(), sisteminha: () => this.folhaSisteminha(), conquistas: () => this.folhaConquistas(),
      construcao: () => this.abrirConstrucao(o.c), banca: () => this.abrirFixo("banca"), quadro: () => this.abrirFixo("quadro"), cisterna: () => this.abrirFixo("cisterna"),
    };
    mapa[o.tipo]?.();
  }
  folha(titulo, render, classe = "") {
    this.audio.efeito("abrir");
    const corpo = $("folha-corpo");
    $("folha-titulo").textContent = titulo;
    $("folha").className = "folha " + classe;
    $("folha").hidden = false;
    const r = () => {
      const rol = corpo.scrollTop;
      corpo.replaceChildren(...[render()].flat());
      corpo.scrollTop = rol;
      this.atualizarHud(true);
    };
    this.folhaAtual = { render: r };
    corpo.scrollTop = 0;
    r();
    this.faz.pausado = true;
    this.faz.entrada.soltar();
  }
  fecharFolha() {
    if (!this.folhaAtual) return;
    $("folha").hidden = true;
    this.folhaAtual = null;
    this.audio.efeito("toque");
    this.faz.pausado = false;
  }
  acao(r) {
    this.resultado(r);
  }
  btn(txt, fn, { classe = "", desativado = false, icone = null, rotulo = null } = {}) {
    return el("button", { class: "btn " + classe, disabled: desativado, "aria-label": rotulo, onclick: () => { fn(); } }, icone ? ic(icone) : null, txt);
  }

  folhaMenu() {
    const n = E.nivel(this.e);
    const item = (txt, icone, fn, trava) => el("button", { class: "menu-item", disabled: !!trava, onclick: () => { this.fecharFolha(); fn(); } }, ic(icone, "ic grande"), el("span", {}, txt), trava ? el("small", {}, trava) : null);
    this.folha("Menu", () => el("div", { class: "menu-grade" },
      item("Missões", "xp", () => this.abrir({ tipo: "missoes" })),
      item("Mochila", "mochila", () => this.abrir({ tipo: "mochila" })),
      item("Loja", "moeda", () => this.abrir({ tipo: "loja" })),
      item("Construir", "construir", () => this.abrir({ tipo: "construir" })),
      item("Terras", "enxada", () => this.abrirTerras()),
      item("Mandala", "agua", () => this.abrirMandala(), n < 4 ? "nível 4" : null),
      item("Sisteminha", "peixe", () => this.folhaSisteminha(), n < 6 ? "nível 6" : null),
      item("Guia e fontes", "folhas", () => this.folhaGuia()),
      item("Conquistas", "ovo", () => this.folhaConquistas()),
      item("Aparência", "mao", () => this.aoEditar()),
      item("Opções", "galhos", () => this.aoOpcoes()),
      item("Tela inicial", "palha", () => this.aoTitulo()),
    ));
  }

  // ----- Loja
  folhaLoja(aba) {
    this.abaLoja = aba || this.abaLoja || "sementes";
    this.folha("Loja da cooperativa", () => {
      const e = this.e;
      const n = E.nivel(e);
      const abas = el("div", { class: "segmentado" },
        el("button", { "aria-pressed": String(this.abaLoja === "sementes"), onclick: () => { this.abaLoja = "sementes"; this.folhaAtual.render(); } }, "Sementes"),
        el("button", { "aria-pressed": String(this.abaLoja === "insumos"), onclick: () => { this.abaLoja = "insumos"; this.folhaAtual.render(); } }, "Insumos"));
      const lista = el("div", { class: "lista" });
      if (this.abaLoja === "sementes") {
        for (const [id, c] of Object.entries(CULTURAS)) {
          const trava = c.nivel > n;
          lista.append(el("div", { class: "linha" + (trava ? " travada" : "") },
            ic("sem_" + id, "ic grande"),
            el("div", { class: "linha-txt" }, el("b", {}, c.nome), el("small", {}, trava ? `Nível ${c.nivel}` : `Colhe em ${fmtH(c.cresce)} · água ${nivelAgua(c)}${c.adaptada ? " · aguenta seca" : ""}${c.rebrota ? " · rebrota" : ""} · você tem ${E.qtd(e, "sem_" + id)}`)),
            el("div", { class: "linha-acoes" },
              this.btn(`${c.semente}`, () => this.acao(Ac.comprar(e, "sem_" + id, 1)), { icone: "moeda", desativado: trava || e.moedas < c.semente, rotulo: `Comprar 1 por ${c.semente} moedas` }),
              this.btn(`×5`, () => this.acao(Ac.comprar(e, "sem_" + id, 5)), { desativado: trava || e.moedas < c.semente * 5, rotulo: `Comprar 5 por ${c.semente * 5} moedas` }))));
        }
      } else {
        const ins = [["adubo", 1], ["racao", 2], ["kitGotejo", 3], ["alevinos", 6]];
        for (const [id, nv] of ins) {
          const it = ITENS[id];
          const trava = nv > n;
          lista.append(el("div", { class: "linha" + (trava ? " travada" : "") }, ic(id, "ic grande"),
            el("div", { class: "linha-txt" }, el("b", {}, it.nome), el("small", {}, trava ? `Nível ${nv}` : `${it.info} Você tem ${E.qtd(e, id)}.`)),
            el("div", { class: "linha-acoes" }, this.btn(`${it.compra}`, () => this.acao(Ac.comprar(e, id, 1)), { icone: "moeda", desativado: trava || e.moedas < it.compra }))));
        }
      }
      return [el("p", { class: "saldo" }, ic("moeda"), ` ${e.moedas} moedas`), abas, lista];
    });
  }

  folhaSementes() {
    this.folha("Escolher semente", () => {
      const e = this.e;
      const lista = el("div", { class: "lista" });
      for (const id of E.culturasLiberadas(e)) {
        const c = CULTURAS[id];
        const q = E.qtd(e, "sem_" + id);
        lista.append(el("button", { class: "linha escolha" + (this.faz.cultura === id ? " sel" : ""), "aria-pressed": String(this.faz.cultura === id), onclick: () => { this.faz.cultura = id; this.faz.ferramenta = "semente"; for (const b of document.querySelectorAll(".ferr")) b.setAttribute("aria-pressed", String(b.dataset.f === "semente")); if (q > 0) this.fecharFolha(); else this.folhaLoja("sementes"); } },
          ic("sem_" + id, "ic grande"),
          el("div", { class: "linha-txt" }, el("b", {}, `${c.nome} (${q})`), el("small", {}, `${fmtH(c.cresce)} · água ${nivelAgua(c)}${c.adaptada ? " · adaptada à seca" : ""}`))));
      }
      return [el("p", { class: "nota" }, "Dica: perto da estiagem, prefira culturas adaptadas e de pouca água."), lista, this.btn("Comprar sementes", () => this.folhaLoja("sementes"), { icone: "moeda" })];
    });
  }

  folhaInsumos() {
    this.folha("Adubar com…", () => {
      const e = this.e;
      const lista = el("div", { class: "lista" });
      for (const id of ["composto", "humus", "adubo"]) {
        lista.append(el("button", { class: "linha escolha" + (this.faz.insumo === id ? " sel" : ""), onclick: () => { this.faz.insumo = id; this.faz.ferramenta = "adubo"; for (const b of document.querySelectorAll(".ferr")) b.setAttribute("aria-pressed", String(b.dataset.f === "adubo")); this.fecharFolha(); } },
          ic(id, "ic grande"), el("div", { class: "linha-txt" }, el("b", {}, `${nomeItem(id)} (${E.qtd(e, id)})`), el("small", {}, ITENS[id].info))));
      }
      return [lista, el("p", { class: "nota" }, "Composto e húmus vêm da sua própria fazenda. O adubo comprado custa moedas.")];
    });
  }

  folhaMochila() {
    this.folha("Mochila", () => {
      const e = this.e;
      const grupos = { Produtos: [], Sementes: [], Insumos: [], Materiais: [] };
      for (const [id, q] of Object.entries(e.inv)) {
        if (q <= 0) continue;
        const g = id.startsWith("sem_") ? "Sementes" : CULTURAS[id] || ITENS[id]?.cat === "produto" ? "Produtos" : ITENS[id]?.cat === "material" ? "Materiais" : "Insumos";
        grupos[g].push([id, q]);
      }
      const out = [];
      for (const [g, l] of Object.entries(grupos)) {
        out.push(el("h3", {}, g));
        if (!l.length) out.push(el("p", { class: "vazio" }, "Nada por enquanto."));
        else out.push(el("div", { class: "itens" }, l.map(([id, q]) => el("div", { class: "item", title: ITENS[id]?.info || "" }, ic(id, "ic grande"), el("span", {}, nomeItem(id)), el("b", {}, q)))));
      }
      out.push(el("p", { class: "nota" }, `Regador: ${e.regador.carga}/${e.regador.max} regas. Cisterna: ${Math.round(e.cisterna.agua)} de ${e.cisterna.cap} L.`));
      return out;
    });
  }

  // ----- Fixos da propriedade
  abrirFixo(f) {
    const e = this.e;
    if (f === "cacimba") {
      this.folha("Cacimba comunitária", () => {
        const usos = e.cacimba?.dia === E.dia(e) ? e.cacimba.usos : 0;
        return [
          el("p", {}, "Água de graça para a vizinhança, mas é pouca: dá para encher o regador 3 vezes por dia."),
          el("p", { class: "nota" }, `Hoje: ${Ac.USOS_CACIMBA - usos} de ${Ac.USOS_CACIMBA} enchidas restantes. Regador: ${e.regador.carga}/${e.regador.max}.`),
          this.btn("Encher o regador aqui", () => this.acao(Ac.encherNaCacimba(e)), { classe: "btn-principal", icone: "regador", desativado: usos >= Ac.USOS_CACIMBA }),
          el("p", { class: "nota" }, "Para regar muito, guarde água da chuva na cisterna e use gotejamento e palha para gastar menos."),
        ];
      });
    } else if (f === "cisterna") {
      this.folha("Cisterna", () => [
        barra((e.cisterna.agua / e.cisterna.cap) * 100, `Água guardada: ${Math.round(e.cisterna.agua)} de ${e.cisterna.cap} L`, "agua"),
        el("p", {}, `Regador: ${e.regador.carga}/${e.regador.max}. Cada rega usa 5 L (encher o regador todo: ${e.regador.max * 5} L).`),
        this.btn("Encher o regador", () => this.acao(Ac.encherRegador(e)), { classe: "btn-principal", icone: "regador" }),
        e.calha ? el("p", { class: "nota ok" }, "Calhas instaladas: a cisterna enche duas vezes mais rápido quando chove.") :
          this.btn("Instalar calhas no telhado (90)", () => this.acao(Ac.instalarCalha(e)), { icone: "agua", desativado: E.nivel(e) < 3, rotulo: "Instalar calhas por 90 moedas" }),
        E.nivel(e) < 3 && !e.calha ? el("small", {}, "Calhas: disponíveis no nível 3.") : null,
        el("p", { class: "nota" }, `Água da chuva captada até agora: ${Math.round(e.stats.aguaChuva)} L. Água usada: ${Math.round(e.stats.aguaUsada)} L.`),
        el("p", { class: "nota" }, "Cada chuva enche a cisterna e a cacimba. Na estiagem não chove: guarde a água e gaste com cuidado."),
        el("h3", {}, "Ficou sem água?"),
        el("p", {}, "A cacimba perto da estrada enche o regador de graça 3 vezes por dia. Em emergência, chame o carro-pipa."),
        this.btn("Chamar carro-pipa: +100 L (30 moedas)", () => this.acao(Ac.chamarCarroPipa(e)), { icone: "moeda", desativado: e.moedas < 30 || e.cisterna.agua >= e.cisterna.cap }),
      ]);
    } else if (f === "banca") {
      this.folha("Banca de venda", () => {
        const feira = Ac.diaDeFeira(e);
        const lista = el("div", { class: "lista" });
        const vendaveis = Object.entries(e.inv).filter(([id, q]) => q > 0 && (CULTURAS[id] || ["ovo", "leite", "peixe", "composto", "humus"].includes(id)));
        if (!vendaveis.length) lista.append(el("p", { class: "vazio" }, "Nada para vender ainda. Colha e volte aqui!"));
        for (const [id, q] of vendaveis) {
          const p = Ac.precoAtual(e, id);
          lista.append(el("div", { class: "linha" }, ic(id, "ic grande"),
            el("div", { class: "linha-txt" }, el("b", {}, `${nomeItem(id)} (${q})`), el("small", {}, `${p} moedas cada${feira ? " (preço de feira)" : ""}`)),
            el("div", { class: "linha-acoes" }, this.btn("1", () => this.acao(Ac.vender(e, id, 1)), { rotulo: `Vender 1 ${nomeItem(id)}` }), this.btn("Tudo", () => this.acao(Ac.vender(e, id, q)), { rotulo: `Vender todos` }))));
        }
        const prox = 7 - (E.dia(e) % 7);
        return [el("p", { class: "nota" + (feira ? " ok" : "") }, feira ? "Hoje é dia de feira: preços 40% maiores!" : `Próxima feira em ${prox} dia${prox > 1 ? "s" : ""}.`), lista, el("p", { class: "nota" }, "Guarde um pouco para os pedidos do quadro: eles pagam melhor.")];
      });
    } else if (f === "quadro") {
      this.folha("Pedidos da comunidade", () => {
        if (e.pedidos.length < 3) Ac.gerarPedidos(e);
        return e.pedidos.map((p) => {
          const pode = Ac.podeEntregar(e, p);
          return el("div", { class: "pedido" },
            el("b", {}, p.cliente),
            el("div", { class: "pedido-itens" }, Object.entries(p.itens).map(([id, q]) => el("span", { class: E.qtd(e, id) >= q ? "tem" : "falta" }, ic(id), `${E.qtd(e, id)}/${q} ${nomeItem(id).toLowerCase()}`))),
            el("div", { class: "pedido-pe" }, el("span", {}, ic("moeda"), ` ${p.moedas}  `, ic("xp"), ` ${p.xp}`),
              this.btn(pode ? "Entregar" : "Faltam itens", () => this.acao(Ac.entregar(e, p)), { classe: pode ? "btn-principal" : "", desativado: !pode })));
        });
      });
    } else if (f === "casa") {
      this.folha("Casa", () => [
        el("h3", {}, "Pintar a casa"),
        el("div", { class: "cores" }, CORES_CASA.map((c) => el("button", { class: "cor", style: `background:${c}`, "aria-label": "Cor da casa", "aria-pressed": String(e.casaCor === c), onclick: () => { e.casaCor = c; this.depoisDeMudar(); } }))),
        el("h3", {}, "Descansar"),
        el("p", {}, "Dormir até amanhã cedo. As plantas continuam crescendo e bebendo água durante a noite."),
        this.btn("Dormir até as 6h", () => this.dormir(), { classe: "btn-principal" }),
        this.btn("Mudar minha aparência", () => { this.fecharFolha(); this.aoEditar(); }, { icone: "mao" }),
      ]);
    }
  }
  dormir() {
    const e = this.e;
    const h = E.horaDoDia(e);
    const faltam = h < 6 ? 6 - h : 30 - h;
    const ev = S.avancar(e, faltam, { temSombra: (c) => this.faz.temSombra(c.x + 1, c.y + 1) });
    this.fecharFolha();
    aviso(`Bom dia! Dia ${E.dia(e)}.`, { dur: 2500 });
    this.eventos(ev);
    this.depoisDeMudar();
  }

  // ----- Terras
  abrirTerras(destaque) {
    this.folha("Terras", () => {
      const e = this.e;
      const n = E.nivel(e);
      return [el("p", { class: "nota" }, "Compre terrenos vizinhos para expandir a fazenda."), el("div", { class: "lista" }, LOTES.filter((l) => l.preco > 0).map((l) => {
        const tem = e.lotes.includes(l.id);
        return el("div", { class: "linha" + (l.id === destaque ? " sel" : "") }, ic("enxada", "ic grande"),
          el("div", { class: "linha-txt" }, el("b", {}, l.nome), el("small", {}, tem ? "Já é seu." : n < l.nivel ? `Disponível no nível ${l.nivel}` : `${(l.x1 - l.x0 + 1) * (l.y1 - l.y0 + 1)} canteiros de terra (com mato)`)),
          tem ? el("span", { class: "ok-txt" }, "Seu") : this.btn(`${l.preco}`, () => this.acao(Ac.comprarLote(e, l.id)), { icone: "moeda", desativado: n < l.nivel || e.moedas < l.preco }));
      }))];
    });
  }

  // ----- Construir
  folhaConstruir() {
    this.folha("Construir", () => {
      const e = this.e;
      const n = E.nivel(e);
      return el("div", { class: "lista" }, Object.entries(CONSTRUCOES).map(([id, d]) => {
        const trava = d.nivel > n;
        const ja = d.unica && e.construcoes.some((c) => c.tipo === id);
        const falta = e.moedas < d.custo || (d.galhos && E.qtd(e, "galhos") < d.galhos);
        return el("div", { class: "linha" + (trava ? " travada" : "") }, ic(ICONE_CONSTR[id] || "construir", "ic grande"),
          el("div", { class: "linha-txt" }, el("b", {}, d.nome), el("small", {}, trava ? `Nível ${d.nivel}` : `${d.desc} Custo: ${d.custo} moedas${d.galhos ? ` + ${d.galhos} galhos (você tem ${E.qtd(e, "galhos")})` : ""}.`)),
          this.btn(ja ? "Feito" : "Colocar", () => { this.fecharFolha(); this.faz.comecarColocacao(id); }, { classe: "btn-principal", desativado: trava || ja || falta }));
      }));
    });
  }
  atualizarColocacao(c) {
    const d = CONSTRUCOES[c.tipo];
    $("colocacao").hidden = false;
    $("ferramentas").hidden = true;
    $("col-titulo").textContent = `${d.nome}: toque no mapa para escolher o lugar`;
    $("col-dicas").replaceChildren(...[c.valido ? null : el("li", { class: "ruim" }, c.msg), ...(c.dicas || []).map((t) => el("li", {}, t))].filter(Boolean));
    $("col-ok").disabled = !c.valido;
  }
  fimColocacao(c) {
    $("colocacao").hidden = true;
    $("ferramentas").hidden = false;
    if (c) this.depoisDeMudar();
  }

  // ----- Construções
  abrirConstrucao(c) {
    const e = this.e;
    const d = CONSTRUCOES[c.tipo];
    const retirar = () => this.btn("Retirar construção", () => { if (confirm(`Retirar ${d.nome.toLowerCase()}? O custo não volta.`)) { Ac.demolir(e, c); this.fecharFolha(); this.depoisDeMudar(); } }, { classe: "btn-perigo btn-pequeno" });
    switch (c.tipo) {
      case "composteira": return this.folhaComposteira(c);
      case "galinheiro": case "cercado": return this.folhaAnimais(c);
      case "tanque": return this.folhaTanque(c);
      case "minhocario": return this.folha("Minhocário", () => [
        el("p", {}, "As minhocas comem composto e esterco e devolvem húmus, um adubo muito rico."),
        el("p", {}, `Na caixa: ${c.carga || 0} porção(ões). Húmus pronto: ${c.humus || 0}.`),
        this.btn(`Dar composto (${E.qtd(e, "composto")})`, () => this.acao(Ac.abastecerMinhocario(e, c, "composto")), { icone: "composto" }),
        this.btn(`Dar esterco ou sedimento (${E.qtd(e, "esterco")})`, () => this.acao(Ac.abastecerMinhocario(e, c, "esterco")), { icone: "esterco" }),
        this.btn("Coletar húmus", () => this.acao(Ac.coletarHumus(e, c)), { classe: "btn-principal", icone: "humus", desativado: !c.humus }),
        retirar(),
      ]);
      case "oficina": return this.folha("Oficina", () => [
        el("p", {}, `Regador atual: ${e.regador.max} regas por viagem à cisterna.`),
        this.btn("Regador grande: 12 regas (80)", () => this.acao(Ac.melhorarRegador(e)), { classe: "btn-principal", icone: "regador", desativado: e.regador.max >= 12 }),
        retirar(),
      ]);
      default: return this.folha(d.nome, () => [el("p", {}, d.desc), retirar()]);
    }
  }

  folhaComposteira(c) {
    const e = this.e;
    this.folha("Composteira", () => {
      const p = c.pilha;
      const massa = S.massaPilha(p);
      const cn = S.cnPilha(p);
      const f = S.fatoresPilha(p);
      const probs = S.problemasPilha(p);
      const sombra = this.faz.temSombra(c.x + 1, c.y + 1);
      const fase = p.pronto ? "Pronto! Escuro, solto e com cheiro de terra." : massa === 0 ? "Vazia. Monte a pilha com material seco e verde." : massa < 6 ? "Juntando material…" : p.prog < 65 ? `Fase quente: os microrganismos estão trabalhando (${Math.round(p.temp)} °C).` : "Maturação: a pilha esfria e o composto vai ficando pronto.";
      const out = [];
      const vis = el("canvas", { class: "comp-vis", width: 34, height: 32, "aria-hidden": "true" });
      vis.getContext("2d").drawImage(A.composteiraSprite(p), 0, 0);
      out.push(el("div", { class: "comp-topo" }, vis, el("p", {}, fase)));
      out.push(barra(p.prog, `Maturação: ${Math.round(p.prog)}%`));
      // mistura: posição relativa (escala log entre 10 e 90)
      const pos = cn ? Math.max(0, Math.min(100, ((Math.log(cn) - Math.log(10)) / (Math.log(90) - Math.log(10))) * 100)) : 50;
      out.push(el("div", { class: "mistura", "aria-label": `Mistura carbono/nitrogênio: ${cn ? Math.round(cn) : "sem material"} para 1` },
        el("span", { class: "medida-rotulo" }, `Mistura C/N: ${cn ? Math.round(cn) + " para 1" : "—"} ${!cn ? "" : cn < 20 ? "(verde demais)" : cn > 42 ? "(seco demais)" : "(equilibrada)"}`),
        el("div", { class: "mistura-barra" }, el("span", { class: "zona" }), el("i", { style: `left:${pos}%` })),
        el("div", { class: "mistura-legenda" }, el("span", {}, "mais verde"), el("span", {}, "ideal ~30"), el("span", {}, "mais seco"))));
      out.push(barra(p.u, `Umidade: ${Math.round(p.u)}% (ideal 40–65)`, p.u < 35 || p.u > 70 ? "alerta" : ""));
      out.push(barra(p.aer, `Ar dentro da pilha: ${Math.round(p.aer)}%`, p.aer < 30 ? "alerta" : ""));
      if (probs.length) out.push(el("ul", { class: "problemas" }, probs.map((x) => el("li", {}, el("b", {}, x.txt), " ", x.dica))));
      else if (massa >= 6 && !p.pronto) out.push(el("p", { class: "nota ok" }, "Tudo certo: mistura, umidade e ar no ponto. Agora é tempo!"));
      out.push(el("p", { class: "nota" }, sombra ? "Local à sombra: a pilha perde menos umidade." : "Local no sol: a pilha seca mais rápido, regue com frequência."));
      // ações
      const acoes = el("div", { class: "acoes-grade" });
      if (p.pronto) acoes.append(this.btn(`Coletar ${p.saida} de composto`, () => this.acao(Ac.coletarComposto(e, c)), { classe: "btn-principal", icone: "composto" }));
      else {
        acoes.append(this.btn("Regar (5 L)", () => this.acao(Ac.regarPilha(e, c)), { icone: "agua" }));
        acoes.append(this.btn("Revirar", () => this.acao(Ac.revirarPilha(e, c)), { icone: "enxada" }));
      }
      const hoje = E.dia(e);
      acoes.append(this.btn(c.baldeDia === hoje ? "Balde de hoje já separado" : "Separar o balde da cozinha", () => this.baldeCozinha(c), { icone: "restos", desativado: c.baldeDia === hoje }));
      out.push(acoes);
      if (!p.pronto && p.prog < 40) {
        out.push(el("h3", {}, "Adicionar material"));
        const mats = ["palha", "folhas", "restos", "frutas", "esterco"];
        out.push(el("div", { class: "lista" }, mats.map((id) => {
          const q = E.qtd(e, id);
          const it = ITENS[id];
          return el("div", { class: "linha" }, ic(id, "ic grande"),
            el("div", { class: "linha-txt" }, el("b", {}, `${it.nome} (${q})`), el("small", { class: it.seco ? "tag-seco" : "tag-verde" }, it.seco ? "SECO · carbono" : "VERDE · nitrogênio")),
            el("div", { class: "linha-acoes" }, this.btn("+1", () => this.acao(Ac.adicionarPilha(e, c, id, 1)), { desativado: q < 1, rotulo: `Adicionar 1 ${it.nome}` }), this.btn("+3", () => this.acao(Ac.adicionarPilha(e, c, id, 3)), { desativado: q < 3, rotulo: `Adicionar 3 ${it.nome}` })));
        })));
        out.push(el("p", { class: "nota" }, "Onde conseguir: palha (limpar mato, colher milho e feijão), folhas secas (catar perto das árvores), restos (colher hortaliças), esterco (galinhas e cabras)."));
      }
      out.push(this.btn("Saiba mais sobre compostagem", () => this.folhaGuia("composteira"), { classe: "btn-pequeno" }));
      return out;
    });
  }

  baldeCozinha(c) {
    const e = this.e;
    const embaralhado = [...BALDE_COZINHA].sort(() => Math.random() - 0.5).slice(0, 6);
    if (!embaralhado.some((x) => x.ok)) embaralhado[0] = BALDE_COZINHA[0];
    const escolhidos = new Set();
    let conferido = false;
    this.folha("Balde da cozinha", () => {
      const out = [el("p", {}, "O que deste balde pode ir para a composteira? Toque para marcar e depois confira.")];
      out.push(el("div", { class: "balde" }, embaralhado.map((it) => {
        const sel = escolhidos.has(it.id);
        let cls = "balde-item" + (sel ? " sel" : "");
        if (conferido) cls += it.ok ? " certo" : sel ? " errado" : "";
        return el("button", { class: cls, "aria-pressed": String(sel), disabled: conferido, onclick: () => { sel ? escolhidos.delete(it.id) : escolhidos.add(it.id); this.audio.efeito("toque"); this.folhaAtual.render(); } },
          el("b", {}, it.nome), conferido ? el("small", {}, (it.ok ? "Pode: " : "Não pode: ") + it.por) : el("small", {}, sel ? "Vai para a composteira" : "Toque para marcar"));
      })));
      if (!conferido) out.push(this.btn("Conferir", () => {
        conferido = true;
        const certos = [...escolhidos].filter((id) => BALDE_COZINHA.find((b) => b.id === id).ok).length;
        const erros = [...escolhidos].length - certos + embaralhado.filter((b) => b.ok && !escolhidos.has(b.id)).length;
        Ac.separarBalde(e, [...escolhidos]);
        c.baldeDia = E.dia(e);
        this.audio.efeito(erros ? "errado" : "certo");
        aviso(erros ? `Quase! ${erros} escolha(s) para rever. O que era bom foi para a mochila.` : "Perfeito! Os restos certos foram para a mochila.", { dur: 3500 });
        this.xp(erros ? 3 : 8);
        this.depoisDeMudar();
      }, { classe: "btn-principal" }));
      else out.push(this.btn("Voltar à composteira", () => this.folhaComposteira(c), { classe: "btn-principal" }));
      return out;
    });
  }

  folhaAnimais(c) {
    const e = this.e;
    const gal = c.tipo === "galinheiro";
    this.folha(gal ? "Galinheiro" : "Cercado de cabras", () => {
      const comidas = gal ? ["racao", "milho"] : ["palma", "milho"];
      return [
        el("p", {}, gal ? `${c.animais} galinhas. Cada uma bota cerca de 1 ovo por dia se tiver comida e água.` : `${c.animais} cabras. Dão leite todo dia se comerem e beberem bem.`),
        barra(((c.comida || 0) / 48) * 100, c.comida > 0 ? `Comida para ${fmtH(c.comida)}` : "Comedouro vazio!", c.comida > 0 ? "" : "alerta"),
        barra(((c.agua || 0) / 48) * 100, c.agua > 0 ? `Água para ${fmtH(c.agua)}` : "Bebedouro vazio!", c.agua > 0 ? "agua" : "alerta"),
        el("div", { class: "acoes-grade" },
          ...comidas.map((id) => this.btn(`Alimentar com ${nomeItem(id).toLowerCase()} (${E.qtd(e, id)}/${c.animais})`, () => this.acao(Ac.alimentarAnimais(e, c, id)), { icone: id, desativado: E.qtd(e, id) < c.animais })),
          this.btn(`Dar água (${c.animais * 4} L)`, () => this.acao(Ac.darAgua(e, c)), { icone: "agua" }),
          this.btn(`Coletar ${gal ? "ovos" : "leite"} (${Math.floor(c.estoque || 0)})`, () => this.acao(Ac.coletarProducao(e, c)), { classe: "btn-principal", icone: gal ? "ovo" : "leite", desativado: (c.estoque || 0) < 1 }),
          this.btn(`Coletar esterco (${Math.floor(c.esterco || 0)})`, () => this.acao(Ac.coletarEsterco(e, c)), { icone: "esterco", desativado: (c.esterco || 0) < 1 })),
        el("p", { class: "nota" }, gal ? "Sem comida ou água, as galinhas param de botar (mas não morrem no jogo). Esterco vai para a composteira, não direto na horta." : "A palma forrageira aguenta a seca e é uma ótima reserva de comida para a estiagem."),
      ];
    });
  }

  folhaTanque(c) {
    const e = this.e;
    this.folha("Tanque de peixes (Sisteminha)", () => {
      const ciclo = c.peixes ? Math.round((c.ciclo / S.CICLO_PEIXE) * 100) : 0;
      return [
        barra(c.nivelAgua || 0, `Água no tanque: ${Math.round(c.nivelAgua || 0)}%`, "agua"),
        c.peixes ? barra(ciclo, `Ciclo dos peixes: ${ciclo}%`) : el("p", {}, "Sem peixes no momento."),
        c.peixes ? barra(c.qualidade, `Qualidade da água: ${Math.round(c.qualidade)}%`, c.qualidade < 40 ? "alerta" : "") : null,
        c.peixes ? el("p", {}, c.comida > 0 ? `Alimentados por mais ${fmtH(c.comida)}.` : "Os peixes estão com fome!") : null,
        el("div", { class: "acoes-grade" },
          this.btn("Encher com água da cisterna", () => this.acao(Ac.encherTanque(e, c)), { icone: "agua", desativado: (c.nivelAgua || 0) >= 100 }),
          !c.peixes ? this.btn(`Soltar alevinos (${E.qtd(e, "alevinos")})`, () => this.acao(Ac.soltarAlevinos(e, c)), { classe: "btn-principal", icone: "alevinos" }) : null,
          c.peixes ? this.btn(`Alimentar (ração: ${E.qtd(e, "racao")})`, () => this.acao(Ac.alimentarPeixes(e, c)), { icone: "racao" }) : null,
          c.peixes ? this.btn("Renovar parte da água → horta", () => this.acao(Ac.renovarAgua(e, c)), { icone: "regador" }) : null,
          c.peixes && c.ciclo >= S.CICLO_PEIXE ? this.btn("Despescar", () => this.acao(Ac.despescar(e, c)), { classe: "btn-principal", icone: "peixe" }) : null,
          this.btn(`Coletar sedimento (${Math.floor(c.lodo || 0)})`, () => this.acao(Ac.coletarLodo(e, c)), { icone: "esterco", desativado: (c.lodo || 0) < 1 })),
        el("div", { class: "real" }, el("b", {}, "Na vida real"), el("p", {}, "No Sisteminha, a água do tanque, rica em nutrientes, é usada para irrigar a horta, e o sedimento vai para a compostagem. Para o Nordeste, a Embrapa recomenda principalmente a tilápia, despescada ao fim de cada ciclo de cerca de 90 dias. No jogo, o ciclo é bem mais curto.")),
      ];
    });
  }

  // ----- Mandala
  abrirMandala() {
    const e = this.e;
    if (E.nivel(e) < 4) { aviso("A mandala abre no nível 4."); return; }
    this.folha("Mandala agrícola", () => {
      const m = e.mandala;
      const etapas = ["Escolher o local", "Limpar o terreno", "Anéis e caminhos", "Reservatório central", "Irrigação", "Adubar e plantar", "Produzindo"];
      const out = [el("ol", { class: "etapas" }, etapas.map((t, i) => el("li", { class: i < m.etapa ? "feita" : i === m.etapa ? "atual" : "" }, t)))];
      if (!e.missoes.ativas.includes("mandala") && !e.missoes.feitas.includes("mandala")) out.push(el("p", { class: "nota" }, "Dica: fale com a Técnica Ana para fazer da mandala uma missão com recompensa."));
      if (m.etapa === 0) {
        for (const [id, L] of Object.entries(LOCAIS_MANDALA)) {
          out.push(el("div", { class: "cartao-op" }, el("b", {}, `Local ${id}: ${L.nome}`), el("p", {}, "A favor: " + L.pros), el("p", {}, "Contra: " + L.contras),
            this.btn("Escolher este local", () => { this.acao(Ac.escolherLocalMandala(e, id)); this.faz.mandalaCanvas = null; }, { classe: "btn-principal" })));
        }
      } else if (m.etapa === 1) {
        out.push(el("p", {}, `Limpe o mato do círculo com a enxada. Faltam ${Ac.matoNaMandala(e)} pedaços com mato.`));
        out.push(this.btn("Pegar a enxada e ir lá", () => { this.fecharFolha(); this.escolherFerramenta("enxada"); this.irMandala(); }, { classe: "btn-principal", icone: "enxada" }));
      } else if (m.etapa === 2) {
        this.formato = this.formato || { aneis: 3, caminhos: 4 };
        const f = this.formato;
        const prev = el("canvas", { class: "mandala-prev", width: 120, height: 120, "aria-label": `Prévia: ${f.aneis} anéis e ${f.caminhos} caminhos` });
        desenharPreviaMandala(prev, f.aneis, f.caminhos);
        out.push(prev);
        out.push(el("div", { class: "op" }, el("span", {}, "Anéis de canteiros"), el("div", { class: "segmentado" }, [3, 4, 5].map((n) => el("button", { "aria-pressed": String(f.aneis === n), onclick: () => { f.aneis = n; this.folhaAtual.render(); } }, n)))));
        out.push(el("div", { class: "op" }, el("span", {}, "Caminhos para circular"), el("div", { class: "segmentado" }, [4, 6, 8].map((n) => el("button", { "aria-pressed": String(f.caminhos === n), onclick: () => { f.caminhos = n; this.folhaAtual.render(); } }, n)))));
        out.push(el("p", { class: "nota" }, "Mais anéis = mais canteiros, mas também mais água e trabalho. Os caminhos deixam alcançar cada canteiro sem pisar na terra."));
        out.push(this.btn("Marcar no chão", () => { this.acao(Ac.definirFormato(e, f.aneis, f.caminhos)); this.faz.mandalaCanvas = null; }, { classe: "btn-principal" }));
      } else if (m.etapa === 3) {
        const custo = 150 + Math.round(150 * LOCAIS_MANDALA[m.local].perda * 2);
        out.push(el("p", {}, "No centro fica o reservatório de água, ligado à cisterna por um cano. Dele sai a água para os canteiros."));
        out.push(el("div", { class: "real" }, el("b", {}, "Mandala não é aquaponia"), el("p", {}, "Algumas mandalas criam peixes ou patos no reservatório, mas isso exige manejo próprio. Na aquaponia, peixes e plantas dividem a mesma água em circulação constante: é outro sistema.")));
        out.push(this.btn(`Construir reservatório (${custo})`, () => this.acao(Ac.construirReservatorio(e)), { classe: "btn-principal", icone: "moeda", desativado: e.moedas < custo }));
      } else if (m.etapa === 4) {
        out.push(el("p", {}, "Como a água vai chegar aos canteiros?"));
        for (const [id, ir] of Object.entries(Ac.IRRIGACOES)) out.push(el("div", { class: "cartao-op" }, el("b", {}, ir.nome), el("p", {}, ir.desc), this.btn(ir.custo ? `Escolher (${ir.custo})` : "Escolher", () => this.acao(Ac.planejarIrrigacao(e, id)), { classe: "btn-principal", desativado: e.moedas < ir.custo })));
      } else if (m.etapa === 5) {
        out.push(el("p", {}, `Canteiros adubados com composto ou húmus: ${Ac.adubadosMandala(e)}/6. Culturas diferentes plantadas: ${Ac.diversidadeMandala(e)}/4.`));
        out.push(el("p", { class: "nota" }, "Sugestão: anel de dentro (perto da água) com alface, coentro e couve; anel do meio com tomate, cebolinha e feijão; anel de fora com milho, abóbora e mandioca."));
        out.push(el("div", { class: "acoes-grade" },
          this.btn("Adubar", () => { this.fecharFolha(); this.faz.insumo = E.qtd(e, "humus") && !E.qtd(e, "composto") ? "humus" : "composto"; this.escolherFerramenta("adubo"); this.irMandala(); }, { icone: "composto" }),
          this.btn("Plantar", () => { this.fecharFolha(); this.escolherFerramenta("semente"); this.irMandala(); }, { icone: "semente" })));
      }
      if (m.etapa >= 4) {
        out.push(barra((m.agua / m.cap) * 100, `Reservatório: ${Math.round(m.agua)} de ${m.cap} L`, "agua"));
        out.push(this.btn("Levar 100 L da cisterna", () => this.acao(Ac.abastecerMandala(e)), { icone: "agua" }));
      }
      if (m.etapa >= 6) {
        const canteiros = Object.values(e.tiles).filter((t) => t.mandala && t.parte === "canteiro");
        out.push(el("ul", { class: "perfil-stats" },
          el("li", {}, el("span", {}, "Canteiros"), el("b", {}, canteiros.length)),
          el("li", {}, el("span", {}, "Plantados agora"), el("b", {}, canteiros.filter((t) => t.c).length)),
          el("li", {}, el("span", {}, "Culturas diferentes"), el("b", {}, Ac.diversidadeMandala(e))),
          el("li", {}, el("span", {}, "Colheitas na mandala"), el("b", {}, e.missoes.passos.colheitaMandala || 0)),
          el("li", {}, el("span", {}, "Água usada pela irrigação"), el("b", {}, `${Math.round(m.aguaUsada || 0)} L`)),
          el("li", {}, el("span", {}, "Irrigação"), el("b", {}, Ac.IRRIGACOES[m.irrig]?.nome || "—"))));
      }
      out.push(this.btn("Saiba mais sobre a mandala", () => this.folhaGuia("mandala"), { classe: "btn-pequeno" }));
      return out;
    });
  }
  irMandala() {
    const L = LOCAIS_MANDALA[this.e.mandala.local];
    if (L) this.faz.irPara(L.cx * E.T, (L.cy - RAIO + 0.2) * E.T);
  }

  // ----- Sisteminha
  folhaSisteminha() {
    const e = this.e;
    if (E.nivel(e) < 6) { aviso("O Sisteminha abre no nível 6."); return; }
    const MODULOS = [
      { id: "tanque", nome: "Tanque de peixes", obrig: true, custo: 200, agua: "200 L para encher", desc: "Módulo básico. Tilápias; a água renovada irriga a horta." },
      { id: "horta", nome: "Horta irrigada com água do tanque", custo: 0, agua: "usa a água renovada", desc: "Seus canteiros recebem água com nutrientes." },
      { id: "galinheiro", nome: "Galinhas poedeiras", custo: 160, agua: "12 L por dia", desc: "Ovos; esterco para a compostagem." },
      { id: "composteira", nome: "Compostagem", custo: 30, agua: "pouca", desc: "Recebe sedimento, esterco e restos; devolve composto." },
      { id: "minhocario", nome: "Minhocário", custo: 60, agua: "pouca", desc: "Transforma composto e esterco em húmus." },
      { id: "fruteiras", nome: "Fruteiras", custo: 0, agua: "pouca", desc: "Acerola e outras frutas adaptadas (nível 7)." },
    ];
    this.plano = this.plano || new Set(e.sisteminha.plano.length ? e.sisteminha.plano : ["tanque", "horta", "composteira"]);
    this.folha("Sisteminha Embrapa", () => {
      const out = [el("p", {}, "Produção integrada em pouco espaço: o que sobra de um módulo alimenta o outro.")];
      if (e.sisteminha.etapa === 0) {
        out.push(el("h3", {}, "Planeje os módulos"));
        let total = 0;
        for (const m of MODULOS) {
          const sel = this.plano.has(m.id);
          const ja = e.construcoes.some((c) => c.tipo === m.id);
          if (sel && !ja) total += m.custo;
          out.push(el("button", { class: "linha escolha" + (sel ? " sel" : ""), "aria-pressed": String(sel), disabled: m.obrig, onclick: () => { sel ? this.plano.delete(m.id) : this.plano.add(m.id); this.folhaAtual.render(); } },
            el("div", { class: "linha-txt" }, el("b", {}, `${sel ? "☑" : "☐"} ${m.nome}${m.obrig ? " (obrigatório)" : ""}`), el("small", {}, `${m.desc} Custo: ${ja ? "já tem" : m.custo} · Água: ${m.agua}`))));
        }
        out.push(el("p", { class: "nota" }, `Custo estimado do plano: ${total} moedas. Água: lembre que tudo sai da sua cisterna.`));
        out.push(this.btn("Confirmar plano", () => {
          if (this.plano.size < 3) { aviso("Escolha o tanque e pelo menos mais 2 módulos."); return; }
          e.sisteminha.plano = [...this.plano];
          e.sisteminha.etapa = 1;
          this.resultado({ ok: true, msg: "Plano feito! Construa o tanque pelo menu Construir.", xp: 10 });
        }, { classe: "btn-principal" }));
      } else {
        const tem = (id) => id === "horta" ? Object.values(e.tiles).some((t) => t.c) : id === "fruteiras" ? Object.values(e.tiles).some((t) => t.c === "acerola") : e.construcoes.some((c) => c.tipo === id);
        out.push(el("h3", {}, "Seus módulos"));
        out.push(el("ul", { class: "modulos" }, e.sisteminha.plano.map((id) => { const m = MODULOS.find((x) => x.id === id); return el("li", { class: tem(id) ? "feita" : "" }, `${tem(id) ? "✔" : "○"} ${m.nome}`); })));
        out.push(el("h3", {}, "Como tudo se liga"));
        out.push(el("ul", { class: "fluxos" },
          el("li", {}, "Tanque → água com nutrientes → horta"),
          el("li", {}, "Tanque → sedimento → compostagem ou minhocário"),
          el("li", {}, "Galinhas → esterco → compostagem"),
          el("li", {}, "Horta → restos → compostagem"),
          el("li", {}, "Compostagem → composto → horta e minhocário"),
          el("li", {}, "Minhocário → húmus → horta")));
      }
      out.push(el("div", { class: "real" }, el("b", {}, "Simplificação do jogo"),
        el("p", {}, "O Sisteminha é uma tecnologia real da Embrapa (com UFU e Fapemig). No jogo, os tempos, custos e quantidades são simplificados. Para montar um de verdade, consulte os materiais oficiais e a assistência técnica da sua região.")));
      out.push(this.btn("Ler o guia e as fontes", () => this.folhaGuia("sisteminha"), { classe: "btn-pequeno" }));
      return out;
    });
  }

  // ----- Missões, guia, conquistas
  folhaMissoes() {
    const e = this.e;
    this.folha("Missões", () => {
      const out = [];
      const ativas = e.missoes.ativas.map(M.missao).filter(Boolean);
      out.push(el("h3", {}, "Em andamento"));
      if (!ativas.length) out.push(el("p", { class: "vazio" }, "Nenhuma. Fale com as pessoas que têm um ! sobre a cabeça."));
      for (const m of ativas) {
        const i = M.passoAtual(e, m);
        out.push(el("div", { class: "missao" }, el("b", {}, m.titulo), el("small", {}, `Com ${M.PESSOAS[m.pessoa].nome} · aprende: ${m.aprende}`),
          el("ol", {}, m.passos.map((p, k) => el("li", { class: p.ok(e) ? "feita" : k === i ? "atual" : "" }, (p.ok(e) ? "✔ " : "") + p.txt))),
          el("small", {}, `Recompensa: ${m.premio.moedas} moedas, ${m.premio.xp} xp`)));
      }
      const disp = M.disponiveis(e);
      if (disp.length) {
        out.push(el("h3", {}, "Disponíveis"));
        for (const m of disp) out.push(el("p", {}, `${m.titulo}: fale com ${M.PESSOAS[m.pessoa].nome}.`));
      }
      const prox = M.MISSOES.filter((m) => m.nivel > E.nivel(e));
      if (prox.length) out.push(el("p", { class: "nota" }, `Próximas: ${prox.map((m) => `${m.titulo} (nível ${m.nivel})`).join(", ")}.`));
      if (e.missoes.feitas.length) out.push(el("h3", {}, "Concluídas"), el("p", {}, e.missoes.feitas.map((id) => M.missao(id)?.titulo).join(" · ")));
      return out;
    });
  }

  folhaGuia(topico) {
    this.folha("Guia e fontes", () => {
      const out = [];
      if (!topico) {
        out.push(el("p", {}, "Explicações curtas sobre o que você faz no jogo, com a diferença entre a simplificação do jogo e a vida real."));
        out.push(el("div", { class: "lista" }, [{ id: "comoJogar", titulo: "Como jogar" }, ...GUIA].map((g) => el("button", { class: "linha escolha", onclick: () => this.folhaGuia(g.id) }, el("div", { class: "linha-txt" }, el("b", {}, g.titulo))))));
        out.push(el("h3", {}, "Todas as fontes"));
        out.push(el("ul", { class: "fontes" }, Object.values(FONTES).map((f) => el("li", {}, el("a", { href: f.url, target: "_blank", rel: "noopener" }, f.titulo)))));
        out.push(el("p", { class: "nota" }, "As fontes foram consultadas a partir das páginas e publicações oficiais citadas. Os números do jogo são simplificados."));
        return out;
      }
      if (topico === "comoJogar") {
        out.push(el("ul", { class: "como" },
          el("li", {}, "Escolha uma ferramenta na barra de baixo e toque no canteiro: seu personagem vai até lá e faz o trabalho. Dá para tocar em vários canteiros seguidos."),
          el("li", {}, "Arraste o dedo no mapa para andar livremente."),
          el("li", {}, "Toque em construções, na cisterna, na banca e no quadro de pedidos para abrir os painéis."),
          el("li", {}, "Toque numa planta com a Mão para ver água, fertilidade e tempo até a colheita."),
          el("li", {}, "Ícones sobre as plantas: estrela amarela = pronta; gota = com sede; gota com ponto vermelho = murchando."),
          el("li", {}, "No computador: as teclas 1 a 7 escolhem as ferramentas da barra, WASD ou setas andam, E usa a ferramenta à frente, Esc abre o menu."),
          el("li", {}, "O jogo salva sozinho. Ficar sem jogar não estraga nada: o tempo só passa com o jogo aberto.")));
      } else {
        const g = GUIA.find((x) => x.id === topico);
        out.push(el("h3", {}, g.titulo));
        for (const t of g.texto) out.push(el("p", {}, t));
        out.push(el("div", { class: "real" }, el("b", {}, "No jogo"), el("p", {}, g.jogo)));
        if (g.fontes.length) out.push(el("h3", {}, "Fontes"), el("ul", { class: "fontes" }, g.fontes.map((k) => el("li", {}, el("a", { href: FONTES[k].url, target: "_blank", rel: "noopener" }, FONTES[k].titulo)))));
      }
      out.push(this.btn("Voltar ao guia", () => this.folhaGuia(), { classe: "btn-pequeno" }));
      return out;
    });
  }

  folhaConquistas() {
    this.folha("Conquistas", () => el("div", { class: "lista" }, Object.entries(CONQUISTAS).map(([id, c]) => {
      const tem = this.e.conquistas.includes(id);
      return el("div", { class: "linha" + (tem ? "" : " travada") }, el("div", { class: "linha-txt" }, el("b", {}, (tem ? "★ " : "☆ ") + c.nome), el("small", {}, c.desc)));
    })));
  }

  // ----- Informações de um canteiro
  infoTile(t, x, y) {
    const e = this.e;
    this.folha(t.c ? CULTURAS[t.c].nome : "Canteiro", () => {
      const out = [];
      if (t.c) {
        const c = CULTURAS[t.c];
        const p = S.progresso(t);
        out.push(barra(p * 100, t.morta ? "Planta seca" : p >= 1 ? "Pronta para colher!" : `Crescimento: ${Math.round(p * 100)}% · faltam ~${fmtH((c.cresce - t.h) / (0.6 + (t.f / 100) * 0.8))}`));
        if (t.murcha) out.push(el("p", { class: "nota alerta" }, "Murchando de sede! Regue para ela voltar a crescer."));
        if (t.rot) out.push(el("p", { class: "nota" }, "Mesma cultura de antes neste canteiro: crescimento 20% mais lento (sem rotação)."));
        out.push(el("p", { class: "nota" }, `Água: ${nivelAgua(c)} · aguenta ${c.tolera} h sem água${c.adaptada ? " · adaptada à seca" : ""}.`));
      }
      out.push(barra(t.u, `Umidade do solo: ${Math.round(t.u)}% ${t.u < 15 ? "(seco)" : t.u > 60 ? "(úmido)" : ""}`, t.u < 15 ? "alerta" : "agua"));
      out.push(barra(t.f, `Fertilidade: ${Math.round(t.f)} ${t.f < 30 ? "(fraca)" : t.f >= 70 ? "(ótima)" : ""}`));
      out.push(el("p", {}, [t.pal ? "Com cobertura de palha." : "Sem cobertura.", t.got ? " Com gotejamento." : "", t.mandala ? ` Canteiro da mandala (anel ${(t.anel ?? 0) + 1}).` : ""].join("")));
      if (t.ult) out.push(el("small", {}, `Última colheita aqui: ${CULTURAS[t.ult].nome}.`));
      void x; void y;
      return out;
    }, "folha-pequena");
  }

  aviso(t) {
    aviso(t, { dur: 2800 });
  }
  // Mensagem com atalho para trocar para a ferramenta certa.
  sugerirFerramenta(ferr, msg) {
    const nomes = { mao: "Mão", enxada: "Enxada", semente: "Plantar", regador: "Regar", adubo: "Adubar", palha: "Cobrir", gotejo: "Gotejo" };
    aviso(msg, { dur: 4500, acao: { rotulo: `Usar ${nomes[ferr]}`, fn: () => this.escolherFerramenta(ferr) } });
  }
}

const RAIO = 5.4;
const ICONE_CONSTR = { composteira: "composto", galinheiro: "ovo", cisterna2: "agua", oficina: "enxada", cercado: "leite", tanque: "peixe", minhocario: "humus", flores: "restos", banco: "galhos" };

export const CONQUISTAS = {
  primeiraColheita: { nome: "Primeira colheita", desc: "Colha qualquer cultura." },
  maoNaTerra: { nome: "Mão na terra", desc: "Faça 50 colheitas." },
  diversidade: { nome: "Prato colorido", desc: "Colha 8 culturas diferentes." },
  gotaAGota: { nome: "Gota a gota", desc: "Tenha 10 canteiros com gotejamento." },
  rotacao: { nome: "Rodízio", desc: "Faça rotação plantando feijão onde colheu outra cultura." },
  feirante: { nome: "Feirante", desc: "Venda num dia de feira." },
  compostoCaprichado: { nome: "Composto caprichado", desc: "Faça um composto mantendo a pilha bem cuidada." },
  sertaoResistente: { nome: "Sertão resistente", desc: "Atravesse uma estiagem com 80% das plantas vivas." },
  missao_composteira: { nome: "Do resto, o adubo", desc: "Conclua a missão da composteira." },
  missao_mandala: { nome: "Mandala viva", desc: "Conclua a mandala agrícola." },
  missao_sisteminha: { nome: "Tudo se integra", desc: "Conclua o Sisteminha." },
  missao_seca: { nome: "Água guardada", desc: "Conclua a preparação para a estiagem." },
};

const CONVERSAS = {
  zefa: ["Planta que pede muita água, planta na chuva. Na seca, feijão-de-corda, mandioca e palma.", "Chão descoberto é chão que esquenta e seca. Cubra com palha!", "Regar de manhã cedo ou no fim da tarde perde menos água pro sol."],
  ana: ["Composteira boa tem cheiro de terra, não de podre. Se cheirar mal, revire e ponha material seco.", "Rotação de culturas ajuda a quebrar o ciclo de pragas e a cuidar do solo.", "Esterco fresco não vai direto no canteiro: passa pela compostagem."],
  raimundo: ["Meu avô dizia: quem guarda água na chuva não passa sede na seca.", "Galinha solta come bicho da horta, mas também come a horta. Melhor no cercado!"],
  rita: ["Na feira, o que mais sai é coentro, alface e tomate. E ovo caipira!", "Comprar de quem planta perto é comida mais fresca e dinheiro que fica na comunidade."],
  joaquim: ["No Sisteminha, o tanque é o coração. Mas peixe precisa de ração, água boa e cuidado todo dia.", "Não existe receita única: cada família escolhe os módulos que cabem no seu espaço e na sua água."],
};

function desenharPreviaMandala(canvas, aneis, caminhos) {
  const g = canvas.getContext("2d");
  const W = canvas.width, c = W / 2, R = W / 2 - 4;
  g.clearRect(0, 0, W, W);
  const img = g.createImageData(W, W);
  const m = { aneis, caminhos };
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const dx = (x - c) / R * RAIO, dy = (y - c) / R * RAIO;
    const d = Math.hypot(dx, dy);
    if (d > RAIO) continue;
    let cor;
    if (d < 1.6) cor = [58, 154, 208];
    else {
      const p = E.partesMandala(m, d, Math.atan2(dy, dx));
      const larg = (RAIO - 1.6) / aneis;
      const rel = (d - 1.6) % larg;
      cor = p.tipo === "caminho" || rel < 0.16 ? [214, 192, 146] : [[90, 168, 71], [120, 180, 80], [150, 190, 90], [110, 150, 70], [130, 170, 60]][p.anel];
    }
    const i = (y * W + x) * 4;
    img.data[i] = cor[0]; img.data[i + 1] = cor[1]; img.data[i + 2] = cor[2]; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}
