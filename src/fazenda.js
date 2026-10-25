// Núcleo do Raízes do Sertão: mapa, câmera, personagem, toques, fila de ações,
// construção, desenho da fazenda, clima, dia e noite.
import { folhaDeSprites, desenharSprite, normalizar, APARENCIA_INICIAL } from "./personagem.js";
import * as A from "./arte.js";
import * as E from "./estado.js";
import { T, MW, MH, ARVORES, FIXOS } from "./estado.js";
import { CULTURAS, CONSTRUCOES, LOTES, LOCAIS_MANDALA, RAIO_MANDALA, SEG_POR_HORA } from "./dados.js";
import * as S from "./simulacao.js";
import * as Ac from "./acoes.js";
import { PESSOAS, POSICOES } from "./missoes.js";
import { criarCanvas, hash } from "./pixel.js";

const VEL = 92;
const ALCANCE = 22;

export class Fazenda {
  constructor({ tela, entrada, audio, ui }) {
    this.tela = tela;
    this.entrada = entrada;
    this.audio = audio;
    this.ui = ui;
    this.t = 0;
    this.cam = { x: 0, y: 0 };
    this.fila = [];
    this.particulas = [];
    this.textos = [];
    this.ferramenta = "mao";
    this.cultura = "coentro";
    this.insumo = "composto";
    this.colocando = null;
    this.pausado = true;
    this.chuvaFator = 1;
    this.qualidade = 1;
  }

  preparar() {
    this.chao = A.desenharChao();
    this.cactos = [];
    for (let i = 0; i < 70; i++) {
      const x = hash(i, 1, 70) * MW, y = hash(i, 2, 70) * MH;
      if (E.tipoBase(Math.floor(x), Math.floor(y)) !== E.BASE.CAATINGA) continue;
      this.cactos.push({ x: x * T, y: y * T, v: i % 3 === 0 ? 0 : 1 });
    }
  }

  iniciar(estado, aparencia) {
    this.e = estado;
    this.definirAparencia(aparencia);
    this.jog = { x: estado.jogador.x, y: estado.jogador.y, dir: estado.jogador.dir || "baixo", quadro: 0, anda: 0, acao: null };
    this.npcs = Object.entries(PESSOAS).map(([id, p]) => ({
      id, nome: p.nome, x: POSICOES[id][0] * T, y: POSICOES[id][1] * T, casaX: POSICOES[id][0] * T, casaY: POSICOES[id][1] * T,
      dir: "baixo", quadro: 0, anda: 0, pausa: Math.random() * 3, alvo: null,
      folha: folhaDeSprites(normalizar({ ...APARENCIA_INICIAL, ...p.ap })),
    }));
    this.bichos = new Map();
    this.mandalaCanvas = null;
    this.fila = [];
    this.colocando = null;
    this.centralizar(true);
    if (!this.e.pedidos.length) Ac.gerarPedidos(this.e);
  }

  definirAparencia(ap) {
    this.ap = ap;
    this.folha = folhaDeSprites(ap);
  }

  npcVisivel(n) {
    const nv = E.nivel(this.e);
    return { zefa: 1, rita: 1, ana: 2, raimundo: 3, joaquim: 6 }[n.id] <= nv;
  }

  // ------------------------------------------------------------ Atualização
  atualizar(dt) {
    this.t += dt;
    const e = this.e;
    if (!e) return [];
    const acoes = this.entrada.consumir();
    let eventos = [];
    if (!this.pausado) {
      eventos = S.avancar(e, dt / SEG_POR_HORA, { temSombra: (c) => this.temSombra(c.x + 1, c.y + 1) });
      const alvo = S.estacao(e) === "chuva" ? 1 : 0;
      this.chuvaFator += (alvo - this.chuvaFator) * Math.min(1, dt * 0.25);
      this.moverJogador(dt);
      this.processarFila(dt);
      this.atualizarNpcs(dt);
      this.atualizarBichos(dt);
      const toque = this.entrada.toqueRapido;
      this.entrada.toqueRapido = null;
      if (toque) this.tratarToque(toque);
      if (acoes.includes("interagir")) this.interagirFrente();
    } else {
      // no modo de construção o tempo fica parado, mas o toque escolhe o lugar
      const toque = this.entrada.toqueRapido;
      this.entrada.toqueRapido = null;
      if (toque && this.colocando) this.tratarToque(toque);
    }
    this.atualizarParticulas(dt);
    this.centralizar(false, dt);
    e.jogador.x = Math.round(this.jog.x);
    e.jogador.y = Math.round(this.jog.y);
    e.jogador.dir = this.jog.dir;
    return { acoes, eventos };
  }

  moverJogador(dt) {
    const j = this.jog;
    const d = this.entrada.direcao();
    if (Math.hypot(d.x, d.y) > 0.05) {
      this.fila = [];
      this.andar(d.x, d.y, dt, Math.min(1, Math.hypot(d.x, d.y)));
    } else if (!this.fila.length && !j.acao) {
      j.quadro = Math.floor(this.t * 1.6) % 2;
    }
    if (j.acao) {
      j.acao.t -= dt;
      j.quadro = 0;
      if (j.acao.t <= 0) j.acao = null;
    }
  }

  andar(dx, dy, dt, m = 1) {
    const j = this.jog;
    const v = VEL * (0.35 + 0.65 * m) * dt;
    const ax = j.x, ay = j.y;
    const n = Math.hypot(dx, dy) || 1;
    this.mover(j, (dx / n) * v, (dy / n) * v);
    if (Math.abs(dx) > Math.abs(dy) * 1.1) j.dir = dx > 0 ? "dir" : "esq";
    else j.dir = dy > 0 ? "baixo" : "cima";
    const prog = Math.hypot(j.x - ax, j.y - ay);
    j.anda += prog;
    const passo = Math.floor(j.anda / 9) % 4;
    if (passo !== j.passo && passo % 2 === 0) this.audio.efeito("passo");
    j.passo = passo;
    j.quadro = 2 + passo;
    return prog;
  }

  // Colisão: caatinga, construções, árvores e casa.
  bloqueado(px, py) {
    const x = Math.floor(px / T), y = Math.floor(py / T);
    if (x < 0 || y < 0 || x >= MW || y >= MH) return true;
    if (E.tipoBase(x, y) === E.BASE.CAATINGA) return true;
    const f = E.fixoEm(x, y);
    if (f && f !== "quadro") {
      // a casa só bloqueia a parte de baixo (dá para passar atrás do telhado)
      if (f === "casa" && y < FIXOS.casa.y + 2) return false;
      return true;
    }
    if (E.construcaoEm(this.e, x, y)) return true;
    for (const a of ARVORES) if (Math.abs(px - a.x * T) < 5 && py > a.y * T - 6 && py < a.y * T + 2) return true;
    return false;
  }
  colide(x, y) {
    return this.bloqueado(x - 4, y - 2) || this.bloqueado(x + 4, y - 2) || this.bloqueado(x - 4, y) || this.bloqueado(x + 4, y);
  }
  mover(o, dx, dy) {
    if (!this.colide(o.x + dx, o.y)) o.x += dx;
    if (!this.colide(o.x, o.y + dy)) o.y += dy;
  }

  // Caminho simples na grade de tiles (BFS), para andar até onde o jogador tocou.
  caminho(x0, y0, tx, ty) {
    const ini = [Math.floor(x0 / T), Math.floor(y0 / T)];
    const livre = (x, y) => !(this.colide(x * T + 8, y * T + 12));
    const chaveDe = (x, y) => y * MW + x;
    const veio = new Map([[chaveDe(...ini), null]]);
    const fila = [ini];
    let melhor = ini, dm = Infinity;
    for (let k = 0; k < fila.length && k < 1600; k++) {
      const [x, y] = fila[k];
      const d = Math.hypot(x - tx, y - ty);
      if (d < dm) { dm = d; melhor = [x, y]; }
      if (d <= 1.01 && livre(x, y)) { melhor = [x, y]; break; }
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + ax, ny = y + ay;
        const ch = chaveDe(nx, ny);
        if (veio.has(ch) || !livre(nx, ny)) continue;
        veio.set(ch, [x, y]);
        fila.push([nx, ny]);
      }
    }
    const rota = [];
    for (let c = melhor; c; c = veio.get(chaveDe(...c))) rota.push({ x: c[0] * T + 8, y: c[1] * T + 12 });
    rota.reverse();
    rota.shift();
    return rota;
  }

  // ------------------------------------------------------------ Toques
  telaParaMundo(cx, cy) {
    const a = this.tela.paraArte(cx, cy);
    return { x: a.x + Math.round(this.cam.x), y: a.y + Math.round(this.cam.y) };
  }

  tratarToque(t) {
    const w = this.telaParaMundo(t.x, t.y);
    const tx = Math.floor(w.x / T), ty = Math.floor(w.y / T);
    if (this.colocando) {
      const d = CONSTRUCOES[this.colocando.tipo];
      this.colocando.x = tx - Math.floor(d.w / 2);
      this.colocando.y = ty - Math.floor(d.h / 2);
      this.validarColocacao();
      this.audio.efeito("toque");
      return;
    }
    // pessoas
    for (const n of this.npcs) {
      if (!this.npcVisivel(n)) continue;
      if (Math.abs(w.x - n.x) < 10 && w.y > n.y - 30 && w.y < n.y + 4) {
        this.audio.efeito("abrir");
        this.virarPara(n.x, n.y);
        this.ui.falarCom(n.id);
        return;
      }
    }
    // construções, fixos e animais abrem painel direto
    const c = E.construcaoEm(this.e, tx, ty) || this.construcaoPorSprite(w.x, w.y);
    if (c) { this.audio.efeito("abrir"); this.ui.abrirConstrucao(c); return; }
    const f = E.fixoEm(tx, ty) || this.fixoPorSprite(w.x, w.y);
    if (f) { this.audio.efeito("abrir"); this.ui.abrirFixo(f); return; }
    if (this.e.mandala.etapa >= 4) {
      const L = LOCAIS_MANDALA[this.e.mandala.local];
      if (Math.hypot(w.x / T - L.cx, w.y / T - L.cy) < 1.6) { this.audio.efeito("abrir"); this.ui.abrirMandala(); return; }
    }
    // lote à venda
    const tile = E.tile(this.e, tx, ty);
    if (tile && !E.tileLiberado(this.e, tx, ty) && !E.arvoreEm(tx, ty)) {
      if (tile.mandala) { this.ui.aviso("Este círculo é da mandala. Siga as etapas no painel da mandala."); return; }
      this.ui.abrirTerras(E.loteDe(tx, ty));
      return;
    }
    // ferramenta mão em planta que não está pronta: mostra informações sem andar
    if (this.ferramenta === "mao" && tile && tile.c && !tile.morta && !S.prontaParaColher(tile)) {
      this.ui.infoTile(tile, tx, ty);
      return;
    }
    if (this.ferramenta === "mao" && tile && !tile.c && !tile.morta && !E.arvoreEm(tx, ty)) {
      const ferr = tile.t === "preparada" ? "semente" : "enxada";
      this.ui.sugerirFerramenta(ferr, tile.t === "preparada" ? "Este canteiro está pronto para plantar." : tile.t === "mato" ? "Aqui tem mato: limpe com a enxada." : "Prepare esta terra com a enxada.");
      return;
    }
    if (!tile && !E.arvoreEm(tx, ty)) {
      this.marca = { x: w.x, y: w.y, t: 0.5 };
      this.irPara(w.x, w.y);
      return;
    }
    const pre = this.preChecar(tile, tx, ty);
    if (pre) {
      this.audio.efeito("errado");
      if (pre.ferr) this.ui.sugerirFerramenta(pre.ferr, pre.msg);
      else { this.ui.aviso(pre.msg); if (pre.abrir) this.ui.abrir(pre.abrir); }
      return;
    }
    if (this.fila.some((a) => a.x === tx && a.y === ty)) return;
    this.fila.push({ x: tx, y: ty, ferr: this.ferramenta, op: { cultura: this.cultura, insumo: this.insumo }, rota: null });
    this.audio.efeito("toque");
  }

  // Evita andar até o canteiro para descobrir que falta algo.
  preChecar(t, x, y) {
    const e = this.e;
    if (E.arvoreEm(x, y)) return null;
    if (t && !t.morta && !(t.mandala && t.parte && t.parte !== "canteiro")) {
      if (this.ferramenta === "semente" && !t.c && t.t !== "preparada") return { msg: t.t === "mato" ? "Primeiro limpe o mato com a enxada." : "Primeiro prepare a terra com a enxada.", ferr: "enxada" };
      if (this.ferramenta === "enxada" && t.t === "preparada" && !t.c) return { msg: "Esta terra já está preparada. Agora é plantar!", ferr: "semente" };
      if (this.ferramenta === "enxada" && t.c && S.prontaParaColher(t)) return { msg: "Esta planta está pronta: colha com a Mão.", ferr: "mao" };
      if ((this.ferramenta === "semente" || this.ferramenta === "enxada") && t.c && !S.prontaParaColher(t)) return { msg: "Já tem planta aqui. Ela precisa de água para crescer.", ferr: "regador" };
    }
    switch (this.ferramenta) {
      case "semente": if (!E.qtd(e, "sem_" + this.cultura)) return { msg: `Sem sementes de ${CULTURAS[this.cultura].nome.toLowerCase()}.`, abrir: { tipo: "sementes" } }; break;
      case "regador": if (e.regador.carga <= 0) return { msg: "Regador vazio: toque na cisterna (ao lado da casa) ou na cacimba (perto da estrada, de graça)." }; break;
      case "palha": if (!E.qtd(e, "palha")) return { msg: "Sem palha. Limpe mato ou retire plantas secas." }; break;
      case "gotejo": if (!E.qtd(e, "kitGotejo")) return { msg: "Sem kit de gotejamento. Compre na loja.", abrir: { tipo: "loja" } }; break;
      case "adubo": if (!E.qtd(e, this.insumo)) return { msg: `Sem ${this.insumo === "composto" ? "composto" : this.insumo === "humus" ? "húmus" : "adubo"}.`, abrir: { tipo: "insumos" } }; break;
    }
    return null;
  }

  irPara(x, y) {
    this.fila = [{ irPara: true, x: Math.floor(x / T), y: Math.floor(y / T), wx: x, wy: y }];
  }

  // Botão de ação / tecla E: usa a ferramenta no tile à frente.
  interagirFrente() {
    const j = this.jog;
    const fx = j.x + (j.dir === "esq" ? -14 : j.dir === "dir" ? 14 : 0);
    const fy = j.y - 4 + (j.dir === "cima" ? -14 : j.dir === "baixo" ? 10 : 0);
    for (const n of this.npcs) if (this.npcVisivel(n) && Math.hypot(n.x - fx, n.y - fy) < 16) return this.ui.falarCom(n.id);
    const tx = Math.floor(fx / T), ty = Math.floor(fy / T);
    const c = E.construcaoEm(this.e, tx, ty);
    if (c) return this.ui.abrirConstrucao(c);
    const f = E.fixoEm(tx, ty);
    if (f) return this.ui.abrirFixo(f);
    if (E.tile(this.e, tx, ty) || E.arvoreEm(tx, ty)) {
      const pre = this.preChecar(E.tile(this.e, tx, ty), tx, ty);
      if (pre) return this.ui.aviso(pre.msg);
      this.executar({ x: tx, y: ty, ferr: this.ferramenta, op: { cultura: this.cultura, insumo: this.insumo } });
    }
  }

  processarFila(dt) {
    const a = this.fila[0];
    if (!a) return;
    const j = this.jog;
    const cx = a.irPara ? a.wx : a.x * T + 8, cy = a.irPara ? a.wy : a.y * T + 8;
    const dist = Math.hypot(cx - j.x, cy - (j.y - 6));
    if ((!a.irPara && dist <= ALCANCE) || (a.irPara && dist < 4)) {
      this.fila.shift();
      if (!a.irPara) this.executar(a);
      return;
    }
    if (!a.rota) a.rota = this.caminho(j.x, j.y, a.irPara ? Math.floor(a.wx / T) : a.x, a.irPara ? Math.floor(a.wy / T) : a.y);
    const prox = a.rota.length ? a.rota[0] : { x: cx, y: cy + 6 };
    const ex = prox.x - j.x, ey = prox.y - j.y;
    if (Math.hypot(ex, ey) < 3 && a.rota.length) { a.rota.shift(); return; }
    const prog = this.andar(ex, ey, dt);
    a.travado = prog < 0.2 ? (a.travado || 0) + dt : 0;
    if (a.travado > 0.5) {
      this.fila.shift();
      if (!a.irPara && dist < ALCANCE * 1.8) this.executar(a);
    }
  }

  executar(a) {
    const r = Ac.usarFerramenta(this.e, a.ferr, a.x, a.y, a.op);
    this.virarPara(a.x * T + 8, a.y * T + 8);
    this.ui.resultado(r, a.x * T + 8, a.y * T + 4);
    if (r.ok && r.efeito) {
      this.jog.acao = { t: 0.28, ferr: a.ferr };
      this.efeito(r.efeito, a.x * T + 8, a.y * T + 10);
    }
    if (r.info) this.ui.infoTile(r.info, a.x, a.y);
  }

  virarPara(x, y) {
    const j = this.jog;
    const dx = x - j.x, dy = y - (j.y - 6);
    if (Math.abs(dx) > Math.abs(dy)) j.dir = dx > 0 ? "dir" : "esq";
    else j.dir = dy > 0 ? "baixo" : "cima";
  }

  construcaoPorSprite(x, y) {
    // toque um pouco acima da base (telhado/sprite) também abre a construção
    for (const c of this.e.construcoes) {
      const d = CONSTRUCOES[c.tipo];
      if (x >= c.x * T && x < (c.x + d.w) * T && y >= c.y * T - 16 && y < (c.y + d.h) * T) return c;
    }
    return null;
  }
  fixoPorSprite(x, y) {
    for (const [id, f] of Object.entries(FIXOS)) {
      if (x >= f.x * T && x < (f.x + f.w) * T && y >= f.y * T - (id === "casa" ? 8 : 18) && y < (f.y + f.h) * T) return id;
    }
    return null;
  }

  temSombra(x, y) {
    return ARVORES.some((a) => Math.hypot(a.x - x, a.y - y) <= 3.2);
  }

  // ------------------------------------------------------------ Construção
  comecarColocacao(tipo) {
    const d = CONSTRUCOES[tipo];
    const tx = Math.floor(this.jog.x / T) + 1, ty = Math.floor(this.jog.y / T) + 1;
    this.colocando = { tipo, x: tx, y: ty };
    this.fila = [];
    this.validarColocacao();
    void d;
  }
  validarColocacao() {
    const c = this.colocando;
    const v = Ac.podeConstruir(this.e, c.tipo, c.x, c.y);
    c.valido = v.ok;
    c.msg = v.msg;
    c.dicas = [];
    if (c.tipo === "composteira" && v.ok) {
      const sombra = this.temSombra(c.x + 1, c.y + 1);
      let roca = false;
      for (let y = c.y - 4; y <= c.y + 5; y++) for (let x = c.x - 4; x <= c.x + 5; x++) { const t = E.tile(this.e, x, y); if (t && (t.t === "preparada" || t.c)) roca = true; }
      c.dicas.push(sombra ? "À sombra: a pilha perde menos umidade." : "Sol pleno: a pilha vai secar mais rápido. Prefira perto de uma árvore.");
      c.dicas.push(roca ? "Perto da roça: fácil levar restos e composto." : "Longe da roça: vai dar mais trabalho carregar.");
      c.nota = (sombra ? 1 : 0) + (roca ? 1 : 0);
    }
    this.ui.atualizarColocacao(c);
  }
  confirmarColocacao() {
    const c = this.colocando;
    if (!c) return;
    const r = Ac.construir(this.e, c.tipo, c.x, c.y);
    this.ui.resultado(r, (c.x + 1) * T, c.y * T);
    if (r.ok) {
      this.colocando = null;
      this.efeito("instalar", (c.x + 1) * T, (c.y + 1) * T);
      this.ui.fimColocacao(r.c);
    }
  }
  cancelarColocacao() {
    this.colocando = null;
    this.ui.fimColocacao(null);
  }

  // ------------------------------------------------------------ Moradores e bichos
  atualizarNpcs(dt) {
    for (const n of this.npcs) {
      if (!this.npcVisivel(n)) continue;
      if (n.alvo) {
        const ex = n.alvo.x - n.x, ey = n.alvo.y - n.y, d = Math.hypot(ex, ey);
        if (d < 1.5) { n.alvo = null; n.pausa = 2 + Math.random() * 4; continue; }
        const v = 22 * dt;
        const ax = n.x, ay = n.y;
        this.mover(n, (ex / d) * v, (ey / d) * v);
        n.dir = Math.abs(ex) > Math.abs(ey) ? (ex > 0 ? "dir" : "esq") : ey > 0 ? "baixo" : "cima";
        n.anda += Math.hypot(n.x - ax, n.y - ay);
        n.quadro = 2 + (Math.floor(n.anda / 8) % 4);
        if (Math.hypot(n.x - ax, n.y - ay) < 0.05) { n.alvo = null; n.pausa = 1; }
      } else {
        n.quadro = Math.floor(this.t * 1.4 + n.casaX) % 2;
        n.pausa -= dt;
        if (n.pausa <= 0) {
          const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 14;
          n.alvo = { x: n.casaX + Math.cos(a) * r, y: n.casaY + Math.sin(a) * r * 0.5 };
        }
      }
    }
  }

  atualizarBichos(dt) {
    for (const c of this.e.construcoes) {
      if (c.tipo !== "galinheiro" && c.tipo !== "cercado") continue;
      let l = this.bichos.get(c.id);
      const d = CONSTRUCOES[c.tipo];
      const n = c.animais || 0;
      if (!l || l.length !== n) {
        l = [];
        for (let i = 0; i < n; i++) l.push({ x: (c.x + 0.6 + Math.random() * (d.w - 1.6)) * T, y: (c.y + 1.4 + Math.random() * (d.h - 1.8)) * T, vx: 0, vy: 0, t: Math.random() * 2, q: 0, esq: false });
        this.bichos.set(c.id, l);
      }
      for (const b of l) {
        b.t -= dt;
        if (b.t <= 0) {
          b.t = 0.8 + Math.random() * 2.5;
          const a = Math.random() * Math.PI * 2;
          const v = Math.random() < 0.4 ? 0 : c.tipo === "galinheiro" ? 14 : 9;
          b.vx = Math.cos(a) * v;
          b.vy = Math.sin(a) * v * 0.6;
          if (b.vx) b.esq = b.vx < 0;
        }
        b.x = Math.max((c.x + 0.4) * T, Math.min((c.x + d.w - 0.5) * T, b.x + b.vx * dt));
        b.y = Math.max((c.y + 1.4) * T, Math.min((c.y + d.h - 0.2) * T, b.y + b.vy * dt));
        b.q = b.vx || b.vy ? Math.floor(this.t * 6) % 2 : Math.floor(this.t * 1.5 + b.x) % 2;
      }
    }
  }

  // ------------------------------------------------------------ Efeitos
  efeito(tipo, x, y) {
    const cores = { enxada: ["#8a6a40", "#b88a5c"], plantar: ["#5aa847", "#9bd46a"], regar: ["#7fd0f0", "#cfeeff"], colher: ["#f4c64a", "#9bd46a", "#ffffff"], instalar: ["#f4c64a", "#ffffff"], pegar: ["#b07a3a", "#e6c36a"], moeda: ["#f4c64a", "#fff3a0"] }[tipo] || ["#ffffff"];
    this.audio.efeito({ enxada: "enxada", plantar: "plantar", regar: "regar", colher: "colher", instalar: "instalar", pegar: "pegar", moeda: "moeda" }[tipo] || "toque");
    const n = this.qualidade < 0.5 ? 5 : 10;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 15 + Math.random() * 30;
      this.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, g: 80, vida: 0.5 + Math.random() * 0.3, cor: cores[i % cores.length] });
    }
  }
  textoFlutuante(txt, x, y, cor = "#ffffff") {
    this.textos.push({ txt, x, y, t: 1.2, cor });
  }
  atualizarParticulas(dt) {
    for (const p of this.particulas) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vida -= dt; }
    this.particulas = this.particulas.filter((p) => p.vida > 0);
    for (const t of this.textos) { t.t -= dt; t.y -= dt * 14; }
    this.textos = this.textos.filter((t) => t.t > 0);
    if (this.marca) { this.marca.t -= dt; if (this.marca.t <= 0) this.marca = null; }
  }

  // ------------------------------------------------------------ Câmera
  centralizar(imediato, dt = 0) {
    const w = this.tela.w, h = this.tela.h;
    // deixa espaço para a barra de ferramentas embaixo
    const ax = this.jog.x - w / 2, ay = this.jog.y - 10 - h * 0.46;
    if (imediato) { this.cam.x = ax; this.cam.y = ay; }
    else { const k = Math.min(1, dt * 7); this.cam.x += (ax - this.cam.x) * k; this.cam.y += (ay - this.cam.y) * k; }
    const W0 = MW * T, H0 = MH * T;
    this.cam.x = w >= W0 ? (W0 - w) / 2 : Math.max(0, Math.min(W0 - w, this.cam.x));
    this.cam.y = h >= H0 ? (H0 - h) / 2 : Math.max(-40, Math.min(H0 - h + 60, this.cam.y));
  }

  // ------------------------------------------------------------ Desenho
  desenhar() {
    const ctx = this.tela.ctx;
    const w = this.tela.w, h = this.tela.h;
    const e = this.e;
    const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#5a6a3a";
    ctx.fillRect(0, 0, w, h);
    if (!e) return;
    const chuva = this.chuvaFator;
    const sx = Math.max(0, cx), sy = Math.max(0, cy);
    const sw = Math.min(MW * T - sx, w - (sx - cx)), sh = Math.min(MH * T - sy, h - (sy - cy));
    if (sw > 0 && sh > 0) {
      if (chuva < 0.999) ctx.drawImage(this.chao.seca, sx, sy, sw, sh, sx - cx, sy - cy, sw, sh);
      if (chuva > 0.001) { ctx.globalAlpha = chuva; ctx.drawImage(this.chao.chuva, sx, sy, sw, sh, sx - cx, sy - cy, sw, sh); ctx.globalAlpha = 1; }
    }
    const tx0 = Math.max(0, Math.floor(cx / T) - 1), ty0 = Math.max(0, Math.floor(cy / T) - 1);
    const tx1 = Math.min(MW - 1, Math.floor((cx + w) / T) + 1), ty1 = Math.min(MH - 1, Math.floor((cy + h) / T) + 2);
    const chuvaNoChao = chuva > 0.5;
    // solo
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      const t = E.tile(e, x, y);
      if (!t || E.construcaoEm(e, x, y)) continue;
      if (t.mandala && t.parte && t.parte !== "canteiro") continue;
      const px = x * T - cx, py = y * T - cy;
      if (t.t === "mato") {
        ctx.drawImage(A.soloSprite("mato", false, chuvaNoChao), px, py);
        if (t.pedra) ctx.drawImage(A.pedraSprite(), px + 2, py + 4);
      } else {
        ctx.drawImage(A.soloSprite(t.t, t.u > 45, false), px, py);
        if (t.f >= 70) ctx.drawImage(A.fertilSprite(), px, py);
        if (t.pal) ctx.drawImage(A.palhaSprite(), px, py);
        if (t.got) ctx.drawImage(A.gotejoSprite(), px, py);
      }
    }
    this.desenharMandala(ctx, cx, cy);
    this.desenharLotes(ctx, cx, cy);
    // marcas da fila
    for (const a of this.fila) {
      if (a.irPara) continue;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.strokeRect(a.x * T - cx + 1.5, a.y * T - cy + 1.5, 13, 13);
    }
    if (this.destaque) this.desenharDestaque(ctx, cx, cy);
    // objetos por profundidade
    const lista = [];
    const vis = (x, y, m = 60) => x > cx - m && x < cx + w + m && y > cy - 8 && y < cy + h + 90;
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      const t = E.tile(e, x, y);
      if (!t || !t.c || E.construcaoEm(e, x, y)) continue;
      const est = t.morta ? Math.max(1, S.estagio(t)) : S.estagio(t);
      const spr = A.culturaSprite(t.c, est, t.morta ? "morta" : t.murcha ? "murcha" : "ok");
      lista.push({ y: y * T + 15, d: () => ctx.drawImage(spr, x * T - cx, y * T + 16 - spr.height - cy) });
    }
    for (const a of ARVORES) if (vis(a.x * T, a.y * T)) {
      const spr = A.arvoreSprite(a.tipo, chuva > 0.5);
      lista.push({ y: a.y * T + 1, d: () => { this.sombra(ctx, a.x * T - cx, a.y * T - cy, 12); ctx.drawImage(spr, Math.round(a.x * T - 20 - cx), Math.round(a.y * T - 43 - cy)); } });
    }
    for (const c of this.cactos) if (vis(c.x, c.y)) lista.push({ y: c.y, d: () => ctx.drawImage(A.cactoSprite(c.v), Math.round(c.x - 8 - cx), Math.round(c.y - 26 - cy)) });
    this.listaFixos(lista, cx, cy);
    for (const c of e.construcoes) this.listaConstrucao(lista, c, cx, cy);
    for (const n of this.npcs) if (this.npcVisivel(n) && vis(n.x, n.y)) lista.push({ y: n.y, d: () => this.desenharAtor(ctx, n, n.folha, cx, cy) });
    lista.push({ y: this.jog.y + 0.1, d: () => this.desenharJogador(ctx, cx, cy) });
    if (this.colocando) lista.push({ y: 99999, d: () => this.desenharColocacao(ctx, cx, cy) });
    lista.sort((a, b) => a.y - b.y);
    for (const it of lista) it.d();
    this.desenharIndicadores(ctx, cx, cy, tx0, ty0, tx1, ty1);
    this.desenharClima(ctx, w, h);
    // partículas e textos
    for (const p of this.particulas) { ctx.fillStyle = p.cor; ctx.globalAlpha = Math.min(1, p.vida * 3); ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 1, 1); }
    ctx.globalAlpha = 1;
    if (this.marca) {
      ctx.strokeStyle = `rgba(255,255,255,${this.marca.t * 1.6})`;
      ctx.beginPath();
      ctx.ellipse(this.marca.x - cx, this.marca.y - cy, 6 - this.marca.t * 4, 3 - this.marca.t * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  sombra(ctx, x, y, r) {
    ctx.fillStyle = "rgba(40,30,10,0.25)";
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  listaFixos(lista, cx, cy) {
    const e = this.e;
    const h = E.horaDoDia(e);
    const noite = h < 6 || h >= 18.5;
    const casa = FIXOS.casa;
    const sc = A.casaSprite(e.casaCor, e.calha, noite);
    lista.push({ y: (casa.y + casa.h) * T, d: () => this.tela.ctx.drawImage(sc, casa.x * T - 2 - cx, (casa.y + casa.h) * T - sc.height - cy) });
    const ci = FIXOS.cisterna;
    const scis = A.cisternaSprite(e.cisterna.agua / e.cisterna.cap);
    lista.push({ y: (ci.y + ci.h) * T, d: () => this.tela.ctx.drawImage(scis, ci.x * T - 1 - cx, (ci.y + ci.h) * T - scis.height - cy) });
    const b = FIXOS.banca;
    const sb = A.bancaSprite();
    lista.push({ y: (b.y + b.h) * T, d: () => this.tela.ctx.drawImage(sb, b.x * T - 1 - cx, (b.y + b.h) * T - sb.height - cy) });
    const ca = FIXOS.cacimba;
    const sca = A.cacimbaSprite();
    lista.push({ y: (ca.y + 1) * T, d: () => this.tela.ctx.drawImage(sca, ca.x * T - 2 - cx, (ca.y + 1) * T - sca.height - cy) });
    const q = FIXOS.quadro;
    const sq = A.quadroSprite();
    lista.push({ y: (q.y + 1) * T, d: () => this.tela.ctx.drawImage(sq, q.x * T - 1 - cx, (q.y + 1) * T - sq.height - cy) });
  }

  listaConstrucao(lista, c, cx, cy) {
    const ctx = this.tela.ctx;
    const d = CONSTRUCOES[c.tipo];
    const base = (c.y + d.h) * T;
    let spr;
    switch (c.tipo) {
      case "composteira": spr = A.composteiraSprite(c.pilha); break;
      case "galinheiro": spr = A.galinheiroSprite(); break;
      case "cercado": spr = A.cercadoSprite(); break;
      case "tanque": spr = A.tanqueSprite(c.nivelAgua || 0, c.peixes); break;
      case "minhocario": spr = A.minhocarioSprite(); break;
      case "cisterna2": spr = A.cisternaSprite(this.e.cisterna.agua / this.e.cisterna.cap); break;
      case "oficina": spr = A.oficinaSprite(); break;
      case "flores": spr = A.floresSprite(); break;
      case "banco": spr = A.bancoSprite(); break;
    }
    if (!spr) return;
    const x = c.x * T + (d.w * T - spr.width) / 2;
    lista.push({ y: base - 1, d: () => ctx.drawImage(spr, Math.round(x - cx), base - spr.height - cy) });
    // animais por cima
    const l = this.bichos.get(c.id);
    if (l) for (const b of l) {
      lista.push({ y: b.y + 0.5, d: () => {
        const s = c.tipo === "galinheiro" ? A.galinhaSprite(b.q, hash(b.x | 0, 0, 1) < 0.5 ? "#f2efe6" : "#b5653a") : A.cabraSprite(b.q);
        ctx.save();
        ctx.translate(Math.round(b.x - cx), Math.round(b.y - cy));
        if (b.esq) ctx.scale(-1, 1);
        ctx.drawImage(s, -s.width / 2, -s.height);
        ctx.restore();
      } });
    }
    // vapor da composteira quente e moscas se houver problema
    if (c.tipo === "composteira" && c.pilha && c.pilha.temp > 45 && !c.pilha.pronto) {
      lista.push({ y: base, d: () => {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        for (let i = 0; i < 4; i++) {
          const k = (this.t * 0.6 + i / 4) % 1;
          ctx.fillRect(Math.round(c.x * T + 10 + i * 4 - cx + Math.sin(this.t * 2 + i) * 2), Math.round(base - 18 - k * 14 - cy), 2, 2);
        }
      } });
    }
  }

  desenharAtor(ctx, a, folha, cx, cy) {
    this.sombra(ctx, a.x - cx, a.y - cy, 6);
    desenharSprite(ctx, folha, a.dir, a.quadro, Math.round(a.x - cx), Math.round(a.y + 1 - cy));
  }
  desenharJogador(ctx, cx, cy) {
    const j = this.jog;
    this.desenharAtor(ctx, j, this.folha, cx, cy);
    if (j.acao) {
      const ic = A.icone(j.acao.ferr === "semente" ? "semente" : j.acao.ferr === "adubo" ? this.insumo : j.acao.ferr);
      const k = j.acao.t / 0.28;
      const ox = j.dir === "esq" ? -12 : j.dir === "dir" ? 12 : 8;
      ctx.drawImage(ic, Math.round(j.x + ox - 6 - cx), Math.round(j.y - 22 + Math.sin(k * Math.PI) * -4 - cy));
    }
  }

  desenharLotes(ctx, cx, cy) {
    const e = this.e;
    for (const l of LOTES) {
      if (e.lotes.includes(l.id)) continue;
      const x0 = l.x0 * T - cx, y0 = l.y0 * T - cy, x1 = (l.x1 + 1) * T - cx, y1 = (l.y1 + 1) * T - cy;
      ctx.fillStyle = "rgba(40,30,10,0.18)";
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = "#8a6a40";
      for (let x = x0; x < x1; x += 8) { ctx.fillRect(x, y0, 2, 5); ctx.fillRect(x, y1 - 5, 2, 5); }
      for (let y = y0; y < y1; y += 8) { ctx.fillRect(x0, y, 2, 5); ctx.fillRect(x1 - 2, y, 2, 5); }
      ctx.fillRect(x0, y0 + 2, x1 - x0, 1);
      ctx.fillRect(x0, y1 - 3, x1 - x0, 1);
      // placa
      const px = Math.round((x0 + x1) / 2), py = Math.round((y0 + y1) / 2);
      ctx.fillStyle = "#7a5236"; ctx.fillRect(px - 1, py, 2, 10);
      ctx.fillStyle = "#f7f0da"; ctx.fillRect(px - 12, py - 9, 24, 10);
      ctx.fillStyle = "#d0443a"; ctx.fillRect(px - 10, py - 7, 20, 2);
      ctx.fillStyle = "#22302a"; ctx.fillRect(px - 9, py - 3, 6, 1); ctx.fillRect(px - 1, py - 3, 9, 1);
    }
  }

  // Mandala: caminhos e bordas desenhados por cima dos tiles, para os canteiros ficarem redondos.
  desenharMandala(ctx, cx, cy) {
    const m = this.e.mandala;
    if (!m.local) return;
    const L = LOCAIS_MANDALA[m.local];
    const chave = `${m.local}:${m.etapa >= 3 ? m.aneis : 0}:${m.caminhos}:${m.etapa >= 3}`;
    if (!this.mandalaCanvas || this.mandalaChave !== chave) {
      this.mandalaChave = chave;
      this.mandalaCanvas = this.criarCamadaMandala(m, L);
    }
    const R = RAIO_MANDALA;
    const ox = Math.round((L.cx - R - 1) * T - cx), oy = Math.round((L.cy - R - 1) * T - cy);
    ctx.drawImage(this.mandalaCanvas, ox, oy);
    if (m.etapa >= 4) {
      const res = A.reservatorioSprite(m.agua / m.cap);
      ctx.drawImage(res, Math.round(L.cx * T - 27 - cx), Math.round(L.cy * T - 27 - cy));
      if (m.agua > 5) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(L.cx * T - 12 + i * 9 - cx + Math.sin(this.t + i) * 3), Math.round(L.cy * T - 6 + i * 4 - cy), 3, 1);
      }
    } else if (m.etapa === 3) {
      ctx.fillStyle = "rgba(90,60,30,0.6)";
      ctx.beginPath();
      ctx.arc(L.cx * T - cx, L.cy * T - cy, 1.5 * T, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  criarCamadaMandala(m, L) {
    const R = RAIO_MANDALA;
    const tam = Math.ceil((R + 1) * 2 * T);
    const c = criarCanvas(tam, tam);
    const g = c.getContext("2d");
    const img = g.createImageData(tam, tam);
    const formato = m.etapa >= 3;
    for (let py = 0; py < tam; py++) for (let px = 0; px < tam; px++) {
      const wx = px / T + (L.cx - R - 1), wy = py / T + (L.cy - R - 1);
      const dx = wx - L.cx, dy = wy - L.cy;
      const d = Math.hypot(dx, dy);
      let cor = null;
      if (d > R + 0.15) continue;
      if (d > R - 0.2) cor = (Math.floor(px / 3) + Math.floor(py / 3)) % 2 ? [168, 160, 144] : [140, 132, 118]; // pedras da borda
      else if (formato && d >= 1.6) {
        const p = E.partesMandala(m, d, Math.atan2(dy, dx));
        const n = m.aneis, larg = (R - 1.6) / n;
        const rel = (d - 1.6) % larg;
        if (p.tipo === "caminho" || rel < 0.16) cor = [214, 192, 146];
      } else if (formato && d < 1.6 && d > 1.45) cor = [150, 140, 120];
      if (!cor) continue;
      const i = (py * tam + px) * 4;
      img.data[i] = cor[0]; img.data[i + 1] = cor[1]; img.data[i + 2] = cor[2]; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  desenharColocacao(ctx, cx, cy) {
    const c = this.colocando;
    const d = CONSTRUCOES[c.tipo];
    ctx.fillStyle = c.valido ? "rgba(90,200,90,0.35)" : "rgba(220,70,60,0.4)";
    ctx.fillRect(c.x * T - cx, c.y * T - cy, d.w * T, d.h * T);
    ctx.strokeStyle = c.valido ? "#5ad25a" : "#e0503c";
    ctx.lineWidth = 1;
    ctx.strokeRect(c.x * T - cx + 0.5, c.y * T - cy + 0.5, d.w * T - 1, d.h * T - 1);
  }

  desenharDestaque(ctx, cx, cy) {
    const d = this.destaque;
    const k = 0.5 + Math.sin(this.t * 6) * 0.5;
    ctx.strokeStyle = `rgba(244,198,74,${0.5 + k * 0.5})`;
    for (const [x, y] of d.tiles || []) ctx.strokeRect(x * T - cx + 0.5, y * T - cy + 0.5, 15, 15);
    if (d.ponto) this.seta(ctx, d.ponto.x - cx, d.ponto.y - cy - 4 - k * 3);
  }

  seta(ctx, x, y) {
    ctx.fillStyle = "#22302a";
    ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x - 6, y - 3); ctx.lineTo(x + 6, y - 3); ctx.fill();
    ctx.fillStyle = "#f4c64a";
    ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x - 4, y - 2); ctx.lineTo(x + 4, y - 2); ctx.fill();
  }

  // Ícones sobre canteiros e construções: pronto, com sede, murcho, precisa de atenção.
  desenharIndicadores(ctx, cx, cy, tx0, ty0, tx1, ty1) {
    const e = this.e;
    const bob = Math.round(Math.sin(this.t * 4) * 1.5);
    const gota = A.icone("agua");
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      const t = E.tile(e, x, y);
      if (!t || !t.c) continue;
      const px = x * T - cx, py = y * T - cy;
      const alto = (A.ALTURA_CULTURA[t.c] || 16) - 16;
      if (t.morta) { ctx.fillStyle = "#7a4a2e"; ctx.fillRect(px + 6, py - 4 - alto, 4, 1); ctx.fillRect(px + 7, py - 5 - alto, 2, 3); continue; }
      if (S.prontaParaColher(t)) {
        ctx.fillStyle = "#fff3a0";
        ctx.fillRect(px + 7, py - 6 - alto + bob, 2, 6); ctx.fillRect(px + 5, py - 4 - alto + bob, 6, 2);
        ctx.fillStyle = "#f4c64a";
        ctx.fillRect(px + 7, py - 4 - alto + bob, 2, 2);
      } else if (t.u <= 12 || t.murcha) {
        ctx.globalAlpha = t.murcha ? 1 : 0.85;
        ctx.drawImage(gota, px + 2, py - 10 - alto + bob);
        if (t.murcha) { ctx.fillStyle = "#d0443a"; ctx.fillRect(px + 12, py - 10 - alto + bob, 2, 5); ctx.fillRect(px + 12, py - 4 - alto + bob, 2, 1); }
        ctx.globalAlpha = 1;
      }
    }
    for (const c of e.construcoes) {
      const d = CONSTRUCOES[c.tipo];
      const px = (c.x + d.w / 2) * T - cx, py = c.y * T - cy - 14 + bob;
      let ic = null;
      if (c.tipo === "composteira" && c.pilha?.pronto) ic = "composto";
      else if ((c.tipo === "galinheiro" || c.tipo === "cercado") && (c.comida <= 0 || c.agua <= 0)) ic = c.agua <= 0 ? "agua" : c.tipo === "galinheiro" ? "racao" : "palma";
      else if (c.tipo === "galinheiro" && c.estoque >= 1) ic = "ovo";
      else if (c.tipo === "cercado" && c.estoque >= 1) ic = "leite";
      else if (c.tipo === "tanque" && c.peixes && c.ciclo >= S.CICLO_PEIXE) ic = "peixe";
      else if (c.tipo === "tanque" && c.peixes && c.comida <= 0) ic = "racao";
      else if (c.tipo === "minhocario" && c.humus > 0) ic = "humus";
      if (ic) {
        ctx.fillStyle = "#f7f0da";
        ctx.fillRect(Math.round(px - 8), Math.round(py - 8), 16, 16);
        ctx.strokeStyle = "#22302a";
        ctx.strokeRect(Math.round(px - 8) + 0.5, Math.round(py - 8) + 0.5, 15, 15);
        ctx.drawImage(A.icone(ic), Math.round(px - 6), Math.round(py - 6));
      }
    }
    // pessoas com missão nova
    for (const n of this.npcs) {
      if (!this.npcVisivel(n) || !this.ui.temNovidade(n.id)) continue;
      const px = Math.round(n.x - cx), py = Math.round(n.y - 40 - cy + bob);
      ctx.fillStyle = "#22302a"; ctx.fillRect(px - 4, py - 5, 9, 11);
      ctx.fillStyle = "#f4c64a"; ctx.fillRect(px - 3, py - 4, 7, 9);
      ctx.fillStyle = "#22302a"; ctx.fillRect(px, py - 3, 1, 5); ctx.fillRect(px, py + 3, 1, 1);
    }
    // textos flutuantes
    ctx.font = "8px 'Pixelify Sans', monospace";
    ctx.textAlign = "center";
    for (const t of this.textos) {
      ctx.globalAlpha = Math.min(1, t.t * 2);
      ctx.fillStyle = "#22302a";
      ctx.fillText(t.txt, Math.round(t.x - cx) + 1, Math.round(t.y - cy) + 1);
      ctx.fillStyle = t.cor;
      ctx.fillText(t.txt, Math.round(t.x - cx), Math.round(t.y - cy));
    }
    ctx.globalAlpha = 1;
  }

  desenharClima(ctx, w, h) {
    const e = this.e;
    const hora = E.horaDoDia(e);
    const q = this.qualidade;
    // estiagem: luz quente; chuva: céu fechado
    const chove = S.chovendo(e);
    if (chove) {
      ctx.fillStyle = "rgba(40,60,90,0.22)";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(200,225,255,0.55)";
      ctx.beginPath();
      const n = Math.floor(90 * q);
      for (let i = 0; i < n; i++) {
        const x = (hash(i, 1, 5) * w + this.t * 40) % w, y = (hash(i, 2, 5) * h + this.t * 260 * (0.8 + hash(i, 3, 5) * 0.4)) % h;
        ctx.moveTo(Math.round(x), Math.round(y));
        ctx.lineTo(Math.round(x - 2), Math.round(y + 6));
      }
      ctx.stroke();
    } else if (S.estacao(e) === "seca") {
      ctx.fillStyle = "rgba(255,180,80,0.07)";
      ctx.fillRect(0, 0, w, h);
      if (q > 0.4) {
        ctx.fillStyle = "rgba(220,190,130,0.5)";
        for (let i = 0; i < 14; i++) ctx.fillRect(Math.round((hash(i, 7, 2) * w + this.t * 30) % w), Math.round((hash(i, 8, 2) * h + Math.sin(this.t + i) * 6) % h), 2, 1);
      }
    }
    // dia e noite
    let escuro = 0;
    if (hora >= 18 || hora < 6) {
      const k = hora >= 18 ? Math.min(1, (hora - 18) / 2) : hora < 5 ? 1 : 1 - (hora - 5);
      escuro = 0.5 * k;
    }
    if (escuro > 0) {
      ctx.fillStyle = `rgba(20,24,70,${escuro})`;
      ctx.fillRect(0, 0, w, h);
      // janelas da casa acesas brilham
      ctx.globalCompositeOperation = "lighter";
      const c = FIXOS.casa;
      const g = ctx.createRadialGradient(c.x * T + 40 - this.cam.x, c.y * T + 50 - this.cam.y, 4, c.x * T + 40 - this.cam.x, c.y * T + 50 - this.cam.y, 60);
      g.addColorStop(0, `rgba(255,200,100,${escuro * 0.5})`);
      g.addColorStop(1, "rgba(255,200,100,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    } else if (hora >= 16.5 && hora < 18) {
      ctx.fillStyle = `rgba(255,140,60,${0.1 * (hora - 16.5) / 1.5})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
}
