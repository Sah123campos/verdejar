// Núcleo do jogo: tela, câmera, objetos do mundo, moradores, missões e desenho.
import { folhaDeSprites, desenharSprite, LARG, ALT, DIRECOES, normalizar, APARENCIA_INICIAL } from "./personagem.js";
import * as W from "./mundo.js";
import { T, MW, MH, TILE } from "./mundo.js";
import { criarCanvas, hash } from "./pixel.js";
import { ler, gravar } from "./salvar.js";
import { $, aviso, abrirModal, fecharModal, modalAberto, vibrar } from "./ui.js";
import { abrirTriagem } from "./triagem.js";

const ALVO = 232; // altura/largura mínima em "pixels de arte"
const VEL = 74;
const RAIO_INTERACAO = 24;
const CAP_SACOLA = 6;

// ---------------------------------------------------------------- Tela
export class Tela {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.w = 300;
    this.h = 300;
    this.escala = 1;
    this.dpr = 1;
    this.ouvintes = [];
    const reajustar = () => {
      requestAnimationFrame(() => this.ajustar());
      // alguns navegadores informam o tamanho final um pouco depois (tela cheia, rotação)
      clearTimeout(this.t1);
      clearTimeout(this.t2);
      this.t1 = setTimeout(() => this.ajustar(), 250);
      this.t2 = setTimeout(() => this.ajustar(), 700);
    };
    window.addEventListener("resize", reajustar);
    window.addEventListener("orientationchange", reajustar);
    window.visualViewport?.addEventListener("resize", reajustar);
    document.addEventListener("fullscreenchange", reajustar);
    document.addEventListener("webkitfullscreenchange", reajustar);
    this.reajustar = reajustar;
    this.ajustar();
  }
  aoRedimensionar(f) { this.ouvintes.push(f); }
  ajustar() {
    const app = document.getElementById("app");
    const vw = app.clientWidth || window.innerWidth;
    const vh = app.clientHeight || window.innerHeight;
    if (!vw || !vh) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const pw = Math.round(vw * dpr), ph = Math.round(vh * dpr);
    const escala = Math.max(1, Math.round(Math.min(pw, ph) / ALVO));
    const w = Math.ceil(pw / escala), h = Math.ceil(ph / escala);
    if (w === this.w && h === this.h && escala === this.escala && dpr === this.dpr) return;
    Object.assign(this, { w, h, escala, dpr, vw, vh });
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = `${(w * escala) / dpr}px`;
    this.canvas.style.height = `${(h * escala) / dpr}px`;
    this.ctx.imageSmoothingEnabled = false;
    for (const f of this.ouvintes) f(w, h);
  }
  // coordenadas da tela (CSS) -> pixels de arte
  paraArte(cx, cy) {
    return { x: (cx * this.dpr) / this.escala, y: (cy * this.dpr) / this.escala };
  }
}

// ---------------------------------------------------------------- Moradores
const MORADORES = {
  lia: {
    nome: "Lia", x: 15.2, y: 46.6,
    ap: { cabelo: "trancas", corCabelo: "#1f1a1c", pele: "#8b532f", olhos: "grandes", detalhes: ["bochechas"], cima: "jardineira", corCima: "#4a6fa5", cor2Cima: "#f1d04b", materialCima: "jeans", calcado: "tenis", corCalcado: "#d0443a", costas: "ecobag", corCostas: "#e8dcc0" },
  },
  iara: {
    nome: "Dona Iara", x: 9.5, y: 25.4,
    ap: { cabelo: "coque", corCabelo: "#ecebe6", pele: "#c4844f", rosto: "redondo", olhos: "serenos", detalhes: ["bochechas", "pinta"], cima: "vestido", corCima: "#5aa847", cor2Cima: "#f1d04b", estampaCima: "floral", baixo: "legging", corBaixo: "#4d6b3a", calcado: "galochas", corCalcado: "#d9a93a", cabeca: "chapeuPalha", corCabeca: "#d0443a", rostoAc: "oculos" },
  },
  teo: {
    nome: "Seu Téo", x: 16.3, y: 17.2,
    ap: { cabelo: "curto", corCabelo: "#a9a7a3", pele: "#d99f6c", rosto: "quadrado", detalhes: ["barba", "bigode"], cima: "colete", corCima: "#2b3a66", cor2Cima: "#9a9a96", baixo: "cargo", corBaixo: "#7a5236", materialBaixo: "canhamo", calcado: "botas", corCalcado: "#4d6b3a", cabeca: "chapeuBalde", corCabeca: "#4d6b3a" },
  },
  bia: {
    nome: "Bia", x: 28.6, y: 8.6,
    ap: { cabelo: "blackPower", corCabelo: "#3d2618", pele: "#6d3e22", olhos: "cilios", cima: "tech", corCima: "#2aa7a0", cor2Cima: "#f1d04b", materialCima: "tech", baixo: "legging", corBaixo: "#24252a", calcado: "canoAlto", corCalcado: "#f2efe6", costas: "mochilaSolar", corCostas: "#3e4147" },
  },
  caio: {
    nome: "Caio", x: 27.6, y: 23.6,
    ap: { cabelo: "moicano", corCabelo: "#e67aa6", pele: "#eab58c", rosto: "longo", detalhes: ["sardas"], cima: "jaqueta", corCima: "#4a6fa5", cor2Cima: "#ee8a2e", materialCima: "retalhos", baixo: "saia", corBaixo: "#8a2f48", estampaBaixo: "xadrez", calcado: "canoAlto", corCalcado: "#24252a", pescoco: "cachecol", corPescoco: "#f1d04b", rostoAc: "oculosEscuros" },
  },
};

// ---------------------------------------------------------------- Missões
export const MISSOES = [
  { id: "limpeza", nome: "Vila limpa", desc: "Recolha o lixo espalhado e separe no Ecoponto.", total: 20, chave: "separados", npc: null },
  { id: "plantio", nome: "Mãos na terra", desc: "Pegue mudas com a Dona Iara (horta) e plante nas covas.", total: 8, chave: "plantadas", npc: "iara" },
  { id: "agua", nome: "Água é vida", desc: "Pegue a ferramenta com o Seu Téo (ponte) e conserte os vazamentos.", total: 4, chave: "consertos", npc: "teo" },
  { id: "luz", nome: "Luz na hora certa", desc: "Apague as lâmpadas acesas em pleno dia.", total: 6, chave: "apagadas", npc: null },
  { id: "solar", nome: "Energia do sol", desc: "Pegue painéis com a Bia (cooperativa) e instale nos suportes.", total: 4, chave: "paineis", npc: "bia" },
];
const PESOS = { limpeza: 0.3, plantio: 0.25, agua: 0.15, luz: 0.1, solar: 0.2 };

// ---------------------------------------------------------------- Jogo
export class Jogo {
  constructor({ tela, entrada, audio, aoAbrirEditor, aoFim }) {
    this.tela = tela;
    this.entrada = entrada;
    this.audio = audio;
    this.aoAbrirEditor = aoAbrirEditor;
    this.aoFim = aoFim;
    this.estado = "titulo";
    this.qualidade = 1;
    this.t = 0;
    this.cam = { x: 300, y: 600 };
    this.particulas = [];
    this.dialogo = null;
    this.alvoToque = null;
  }

  // Carregamento pesado (arte do chão), feito em etapas para a barra de progresso andar.
  async preparar(progresso) {
    const espera = () => new Promise((r) => setTimeout(r, 0));
    this.mapa = W.criarMapa();
    progresso(0.15, "Desenhando a vila…");
    await espera();
    this.construirObjetos();
    progresso(0.3, "Plantando as árvores…");
    await espera();
    this.chao = W.desenharChao(this.mapa.get, (pm, vivo) => this.decorarChao(pm, vivo));
    this.construirGrade();
    progresso(0.75, "Chamando os moradores…");
    await espera();
    for (const id of Object.keys(MORADORES)) {
      const m = MORADORES[id];
      this.npcs.push({
        id, nome: m.nome, x: m.x * T, y: m.y * T, casaX: m.x * T, casaY: m.y * T, dir: "baixo", quadro: 0, anda: 0, pausa: 1 + Math.random() * 2,
        folha: folhaDeSprites(normalizar({ ...APARENCIA_INICIAL, ...m.ap })), alvo: null,
      });
    }
    this.brilho = this.criarBrilho();
    this.fumaca = this.criarFumaca();
    progresso(0.95, "Quase lá…");
    await espera();
    this.carregarProgresso();
  }

  // ------------------------------------------------------------ Construção do mundo
  construirObjetos() {
    const o = (this.objetos = []);
    this.npcs = [];
    const add = (spr, x, y, solido, extra = {}) => {
      const ob = { spr, x, y, solido: solido && [x + solido[0], y + solido[1], solido[2], solido[3]], ...extra };
      o.push(ob);
      return ob;
    };
    const px = (v) => v * T;
    // borda de mata
    for (let x = 0; x < MW * T; x += 18) {
      add(W.spriteArvore((x / 18) % 4), x + 6 + (hash(x, 0) - 0.5) * 6, 26, [-5, -6, 10, 6]);
      if (hash(x, 1) < 0.6) add(W.spriteArvore((x / 18 + 1) % 4), x + 12, 12, null);
      add(W.spriteArvore((x / 18 + 2) % 4), x + 4 + (hash(x, 3) - 0.5) * 6, MH * T - 8, [-5, -6, 10, 6]);
    }
    for (let y = 40; y < MH * T - 20; y += 20) {
      const rio = this.mapa.get(1, Math.floor(y / T)) === TILE.AGUA || this.mapa.get(1, Math.floor((y - 10) / T)) === TILE.AGUA;
      if (rio) continue;
      add(W.spriteArvore((y / 20) % 4), 10 + (hash(0, y) - 0.5) * 6, y, [-5, -6, 10, 6]);
      add(W.spriteArvore((y / 20 + 1) % 4), MW * T - 10 + (hash(1, y) - 0.5) * 6, y, [-5, -6, 10, 6]);
    }
    // árvores internas
    const arvores = [[4, 6], [7, 9], [10, 5], [14, 8], [3, 18], [6, 21], [13, 16], [24, 16], [36, 17], [37, 22], [26, 30.5], [37, 34], [4, 52], [8, 54], [17, 51], [22, 54], [37, 46], [24, 46], [10, 46.5], [36, 53]];
    arvores.forEach(([x, y], i) => add(W.spriteArvore(i % 4), px(x), px(y), [-5, -6, 10, 6]));
    const arbustos = [[15, 15], [23, 15], [2.8, 23], [13, 30], [25.5, 31.5], [16.5, 47], [22.5, 47], [9, 48], [35, 44], [3.5, 44], [30, 20.5], [14.5, 29], [25.5, 18]];
    arbustos.forEach(([x, y]) => add(W.spriteArbusto(), px(x), px(y), [-7, -5, 14, 5]));
    for (const [x, y] of [[11, 52], [27, 45.5], [6, 12], [35, 6]]) add(W.spritePedra(), px(x), px(y), [-6, -5, 12, 5]);

    // construções
    add(W.spriteCooperativa(), px(29.5), px(7), [-70, -50, 140, 50]);
    add(W.spriteBrecho(), px(30), px(22), [-54, -54, 108, 54]);
    this.ecoponto = add(W.spriteEcoponto(), px(10.5), px(21.6), [-38, -24, 76, 24], { tipo: "ecoponto" });
    add(W.spriteViveiro(), px(5.5), px(25.8), [-30, -32, 60, 32]);
    this.composteira = add(W.spriteComposteira(), px(12.4), px(25.6), [-10, -8, 20, 8], { tipo: "composteira" });
    this.fonte = add(W.spriteFonte(), px(20), px(23.8), [-20, -20, 40, 20], { tipo: "fonte" });
    for (const [x, y] of [[15.6, 24.4], [24.4, 24.4], [17, 19.2]]) add(W.spriteBanco(), px(x), px(y), [-12, -7, 24, 7]);
    this.espelho = add(W.spriteEspelho(), px(35), px(21.8), [-12, -6, 24, 6], { tipo: "espelho" });
    this.casas = [];
    [[6, 37, 0], [13, 37, 1], [26, 37, 2], [33, 37, 3], [6, 45, 4], [13, 45, 0], [26, 45, 1], [33, 45, 2]].forEach(([x, y, v]) => {
      this.casas.push(add(W.spriteCasa(v, false), px(x), px(y), [-38, -40, 76, 40]));
    });
    // cerca da horta
    for (let x = 2.5; x <= 11.5; x += 1) add(W.spriteCerca(), px(x), px(31.9), [-8, -5, 16, 5]);
    // placas
    this.placas = [
      add(W.spritePlaca(), px(17.3), px(45.6), [-2, -4, 4, 4], { tipo: "placa", texto: "Dica: arraste o dedo no cenário para andar com o controle, ou toque num lugar para ir até lá. O botão amarelo interage." }),
      add(W.spritePlaca(), px(8), px(22.6), [-2, -4, 4, 4], { tipo: "placa", texto: "Ecoponto. Azul: papel. Vermelho: plástico. Amarelo: metal. Verde: vidro. Marrom: orgânico." }),
      add(W.spritePlaca(), px(26.6), px(24.6), [-2, -4, 4, 4], { tipo: "placa", texto: "Parque das Mudas: cada árvore pode absorver cerca de 150 kg de gás carbônico em 20 anos." }),
      add(W.spritePlaca(), px(22.6), px(16.8), [-2, -4, 4, 4], { tipo: "placa", texto: "Rio Verdejar. Ao norte: Cooperativa Solar. A leste da praça: Brechó Circular." }),
    ];

    // elementos de missão
    const tipos = Object.keys(W.LIXOS);
    const posLixo = [[15, 19], [24, 21], [17, 27.5], [23, 27.4], [5, 38.4], [12, 39.2], [27, 38.3], [35, 39.4], [6, "n"], [11, "s"], [27, "n"], [34, "s"], [29, 26], [34, 29.6], [31, 31.2], [6, 5], [12, 7], [9, 3.6], [8, 50.5], [20, 52]];
    this.lixos = posLixo.map(([x, y], i) => {
      let yy = y;
      if (y === "n") yy = this.mapa.rioTopo[x] - 0.4;
      if (y === "s") yy = this.mapa.rioTopo[x] + 3.7;
      return { id: i, tipo: tipos[(i * 3) % tipos.length], x: px(x + 0.5), y: px(yy), pego: false };
    });
    this.covas = [[28.5, 25.6], [31.5, 25.2], [35, 26.2], [29, 29.4], [33, 28.6], [36, 30.8], [5, 8.6], [13, 4.4]].map(([x, y], i) => ({ id: i, x: px(x), y: px(y), plantada: null }));
    this.torneiras = [[12.6, 27.2], [23.6, 20], [16.6, 43.6], [23, 6.8]].map(([x, y], i) => ({ id: i, x: px(x), y: px(y), ok: false }));
    this.postes = [[9.5, 37.7], [16.5, 37.7], [23, 37.7], [30, 37.7], [14.4, 18.4], [25.6, 28.6]].map(([x, y], i) => ({ id: i, x: px(x), y: px(y), acesa: true }));
    this.suportes = [[24, 10.3], [27, 10.3], [30, 10.4], [33, 10.3]].map(([x, y], i) => ({ id: i, x: px(x), y: px(y), ok: false }));
  }

  decorarChao(pm, vivo) {
    // plantinhas nos canteiros da horta
    for (let y = 26; y <= 30; y += 2)
      for (let x = 3 * T + 4; x < 12 * T - 2; x += 8) {
        const yy = y * T + 9;
        if (vivo) {
          const c = hash(x, y) < 0.5 ? [72, 160, 67, 255] : [90, 176, 70, 255];
          pm.elipse(x, yy, 3, 2.4, c);
          pm.set(x - 1, yy - 1, [160, 220, 110, 255]);
          if (hash(x, y, 2) < 0.4) pm.set(x + 1, yy, [220, 70, 60, 255]);
        } else {
          pm.set(x, yy, [120, 110, 70, 255]);
          pm.set(x - 1, yy + 1, [120, 110, 70, 255]);
          pm.set(x + 1, yy - 1, [140, 120, 80, 255]);
        }
      }
    if (vivo) {
      // canteiros de flores na praça
      for (const [cx, cy] of [[14.5, 21], [25.5, 21], [14.5, 26], [25.5, 26]])
        for (let k = 0; k < 14; k++) {
          const x = cx * T + (hash(k, cx) - 0.5) * 14, y = cy * T + (hash(k, cy) - 0.5) * 12;
          pm.set(x, y, [[240, 106, 138, 255], [255, 211, 77, 255], [180, 140, 255, 255]][k % 3]);
          pm.set(x, y + 1, [63, 138, 55, 255]);
        }
    }
  }

  criarBrilho() {
    const c = criarCanvas(48, 48);
    const g = c.getContext("2d");
    const r = g.createRadialGradient(24, 24, 2, 24, 24, 24);
    r.addColorStop(0, "rgba(255,240,160,0.65)");
    r.addColorStop(1, "rgba(255,240,160,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 48, 48);
    return c;
  }
  criarFumaca() {
    const c = criarCanvas(64, 40);
    const g = c.getContext("2d");
    const r = g.createRadialGradient(32, 20, 2, 32, 20, 30);
    r.addColorStop(0, "rgba(140,130,110,0.32)");
    r.addColorStop(1, "rgba(140,130,110,0)");
    g.fillStyle = r;
    g.save();
    g.scale(1, 0.66);
    g.fillRect(0, 0, 64, 64);
    g.restore();
    const blobs = [];
    for (let i = 0; i < 26; i++) blobs.push({ x: Math.random() * MW * T, y: Math.random() * MH * T, v: 4 + Math.random() * 6 });
    this.blobs = blobs;
    return c;
  }

  // ------------------------------------------------------------ Progresso
  novoProgresso() {
    return {
      v: 1, x: 13 * T, y: 46.4 * T, dir: "baixo", tempo: 0, introVista: false,
      lixos: [], sacola: [], separados: 0, acertosPrimeira: 0, erros: 0,
      mudas: 0, plantadas: [], consertos: [], apagadas: [], paineis: [], paineisInv: 0,
      ferramenta: false, falou: {}, trocasVisual: 0, fim: false,
    };
  }
  carregarProgresso() {
    const p = ler("progresso");
    this.p = { ...this.novoProgresso(), ...(p && p.v === 1 ? p : {}) };
    // valida números e listas vindos do armazenamento
    for (const k of ["lixos", "sacola", "plantadas", "consertos", "apagadas", "paineis"]) if (!Array.isArray(this.p[k])) this.p[k] = [];
    this.p.sacola = this.p.sacola.filter((t) => W.LIXOS[t]).slice(0, CAP_SACOLA);
    this.aplicarProgresso();
  }
  aplicarProgresso() {
    const p = this.p;
    for (const l of this.lixos) l.pego = p.lixos.includes(l.id);
    for (const c of this.covas) {
      const reg = p.plantadas.find((r) => r.id === c.id);
      c.plantada = reg ? reg.t : null;
    }
    for (const t of this.torneiras) t.ok = p.consertos.includes(t.id);
    for (const l of this.postes) l.acesa = !p.apagadas.includes(l.id);
    for (const s of this.suportes) s.ok = p.paineis.includes(s.id);
    this.jogador = { x: p.x, y: p.y, dir: p.dir, quadro: 0, anda: 0, passo: 0 };
    this.ecoVis = this.eco();
  }
  salvar() {
    if (!this.jogador) return;
    this.p.x = Math.round(this.jogador.x);
    this.p.y = Math.round(this.jogador.y);
    this.p.dir = this.jogador.dir;
    gravar("progresso", this.p);
  }
  apagarProgresso() {
    this.p = this.novoProgresso();
    this.aplicarProgresso();
    gravar("progresso", this.p);
  }

  progressoMissao(m) {
    const v = this.p[m.chave];
    return Math.min(m.total, typeof v === "number" ? v : v.length);
  }
  eco() {
    let e = 0;
    for (const m of MISSOES) e += (this.progressoMissao(m) / m.total) * PESOS[m.id];
    return Math.min(1, e);
  }

  definirAparencia(ap) {
    this.ap = ap;
    this.folha = folhaDeSprites(ap);
  }

  // ------------------------------------------------------------ Estados
  iniciarPartida() {
    this.estado = "jogando";
    this.entrada.ativo = true;
    this.centralizarCamera(true);
    if (!this.p.introVista) setTimeout(() => this.intro(), 500);
  }
  pausar(sim) {
    if (sim && this.estado === "jogando") {
      this.estado = "pausa";
      this.entrada.soltar();
      this.salvar();
    } else if (!sim && this.estado === "pausa") {
      this.estado = "jogando";
    }
  }

  // ------------------------------------------------------------ Diálogo
  falar(linhas, aoFim) {
    this.dialogo = { linhas, i: 0, chars: 0, aoFim };
    this.entrada.soltar();
    this.alvoToque = null;
    $("dialogo").hidden = false;
    this.mostrarLinha();
  }
  mostrarLinha() {
    const d = this.dialogo;
    const l = d.linhas[d.i];
    const npc = this.npcs.find((n) => n.id === l.quem);
    $("dialogo-nome").textContent = npc ? npc.nome : l.quem === "voce" ? this.ap.nome || "Você" : l.quem === "placa" ? "Placa" : "";
    d.texto = l.texto.replaceAll("{nome}", this.ap.nome || "vizinha ou vizinho");
    d.chars = 0;
    $("dialogo-texto").textContent = "";
    const cv = $("dialogo-retrato");
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 20, 20);
    const folha = npc ? npc.folha : l.quem === "voce" ? this.folha : null;
    cv.style.visibility = folha ? "visible" : "hidden";
    if (folha) ctx.drawImage(folha, 2, 0, 20, 20, 0, 0, 20, 20);
  }
  avancarDialogo() {
    const d = this.dialogo;
    if (!d) return;
    if (d.chars < d.texto.length) {
      d.chars = d.texto.length;
      $("dialogo-texto").textContent = d.texto;
      return;
    }
    d.i++;
    if (d.i >= d.linhas.length) {
      $("dialogo").hidden = true;
      this.dialogo = null;
      d.aoFim?.();
      return;
    }
    this.audio.efeito("toque");
    this.mostrarLinha();
  }
  atualizarDialogo(dt) {
    const d = this.dialogo;
    if (!d || d.chars >= d.texto.length) return;
    const antes = Math.floor(d.chars);
    d.chars = Math.min(d.texto.length, d.chars + dt * 45);
    if (Math.floor(d.chars) !== antes) {
      $("dialogo-texto").textContent = d.texto.slice(0, Math.floor(d.chars));
      if (antes % 3 === 0) this.audio.efeito("dialogo");
    }
  }

  intro() {
    this.falar([
      { quem: "lia", texto: "Oi, {nome}! Que bom que você chegou. Olha em volta: a Vila Verdejar perdeu a cor." },
      { quem: "lia", texto: "Tem lixo na rua, torneiras vazando, luz acesa em pleno dia… e o ar ficou cinzento." },
      { quem: "lia", texto: "Mas dá para mudar! Cada coisa que você fizer devolve um pouco de vida à vila. Fique de olho na barra de folhinha lá em cima." },
      { quem: "lia", texto: "Comece recolhendo o lixo e levando ao Ecoponto, perto da praça. A Dona Iara (horta), o Seu Téo (ponte) e a Bia (cooperativa) também precisam de ajuda." },
      { quem: "lia", texto: "Ah, e se quiser trocar de visual, o Caio cuida do Brechó Circular, ao lado da praça. Roupa boa não vai para o lixo!" },
    ], () => {
      this.p.introVista = true;
      this.p.falou.lia = true;
      this.salvar();
    });
  }

  // ------------------------------------------------------------ Interações
  interativos() {
    const lista = [];
    const p = this.p;
    for (const l of this.lixos) if (!l.pego) lista.push({ x: l.x, y: l.y - 3, rotulo: "Pegar", fazer: () => this.pegarLixo(l) });
    for (const n of this.npcs) lista.push({ x: n.x, y: n.y - 6, rotulo: "Falar", fazer: () => this.falarCom(n), npc: n });
    lista.push({ x: this.ecoponto.x, y: this.ecoponto.y + 4, raio: 34, rotulo: p.sacola.length ? "Separar" : "Ecoponto", fazer: () => this.usarEcoponto() });
    for (const c of this.covas) if (c.plantada === null) lista.push({ x: c.x, y: c.y, rotulo: "Plantar", fazer: () => this.plantar(c) });
    for (const t of this.torneiras) if (!t.ok) lista.push({ x: t.x, y: t.y, rotulo: "Consertar", fazer: () => this.consertar(t) });
    for (const l of this.postes) if (l.acesa) lista.push({ x: l.x, y: l.y, rotulo: "Apagar", fazer: () => this.apagar(l) });
    for (const s of this.suportes) if (!s.ok) lista.push({ x: s.x, y: s.y - 4, rotulo: "Instalar", fazer: () => this.instalar(s) });
    lista.push({ x: 30 * T - 4, y: 22 * T + 4, raio: 18, rotulo: "Entrar", fazer: () => this.entrarBrecho() });
    lista.push({ x: this.espelho.x, y: this.espelho.y + 2, raio: 22, rotulo: "Provador", fazer: () => this.usarEspelho() });
    lista.push({ x: this.composteira.x, y: this.composteira.y + 2, raio: 20, rotulo: "Ver", fazer: () => this.falar([{ quem: "iara", texto: "Essa é a composteira! Os restos orgânicos do Ecoponto viram adubo para a horta em poucos meses." }]) });
    for (const pl of this.placas) lista.push({ x: pl.x, y: pl.y + 2, raio: 18, rotulo: "Ler", fazer: () => this.falar([{ quem: "placa", texto: pl.texto }]) });
    return lista;
  }

  maisProximo() {
    const j = this.jogador;
    let melhor = null, dm = Infinity;
    // um pouco à frente do personagem, para mirar no que ele está olhando
    const fx = j.x + (j.dir === "esq" ? -6 : j.dir === "dir" ? 6 : 0);
    const fy = j.y - 4 + (j.dir === "cima" ? -6 : j.dir === "baixo" ? 4 : 0);
    for (const it of this.interativos()) {
      const d = Math.hypot(it.x - fx, it.y - fy);
      if (d < (it.raio || RAIO_INTERACAO) && d < dm) { dm = d; melhor = it; }
    }
    return melhor;
  }

  pegarLixo(l) {
    if (this.p.sacola.length >= CAP_SACOLA) {
      this.audio.efeito("cheio");
      vibrar([15, 30, 15]);
      aviso("Sacola cheia! Leve ao Ecoponto para separar.");
      return;
    }
    l.pego = true;
    this.p.lixos.push(l.id);
    this.p.sacola.push(l.tipo);
    this.audio.efeito("pegar");
    vibrar(10);
    this.estouro(l.x, l.y - 4, ["#f7f0da", "#a6dc7e"], 8);
    aviso(`${W.LIXOS[l.tipo].nome} na sacola (${this.p.sacola.length}/${CAP_SACOLA})`, { dur: 1500 });
    this.salvar();
  }

  usarEcoponto() {
    if (!this.p.sacola.length) {
      const resta = this.lixos.filter((l) => !l.pego).length;
      this.falar([{ quem: "placa", texto: resta ? `Ecoponto. Traga lixo na sacola para separar. Ainda há ${resta} itens espalhados pela vila.` : "Ecoponto. Toda a vila está limpa. Obrigado por separar o lixo!" }]);
      return;
    }
    this.audio.efeito("abrir");
    this.entrada.soltar();
    const itens = [...this.p.sacola];
    abrirTriagem(itens, {
      audio: this.audio,
      aoAcertar: (tipo, primeira) => {
        const i = this.p.sacola.indexOf(tipo);
        if (i >= 0) this.p.sacola.splice(i, 1);
        this.p.separados++;
        if (primeira) this.p.acertosPrimeira++;
        this.salvar();
      },
      aoTerminar: (erros) => {
        this.p.erros += erros;
        this.salvar();
        this.verificarMissoes();
        if (!this.p.falou.compostoAviso && this.p.separados >= 3) {
          this.p.falou.compostoAviso = true;
          aviso("O orgânico vai para a composteira da horta e vira adubo!", { dur: 3500 });
        }
      },
    });
  }

  falarCom(n) {
    this.audio.efeito("abrir");
    // vira para o jogador
    const dx = this.jogador.x - n.x, dy = this.jogador.y - n.y;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "dir" : "esq") : dy > 0 ? "baixo" : "cima";
    n.alvo = null;
    n.anda = 0;
    const p = this.p;
    const primeira = !p.falou[n.id];
    p.falou[n.id] = true;
    const L = (texto) => ({ quem: n.id, texto });
    switch (n.id) {
      case "lia": {
        const e = Math.round(this.eco() * 100);
        this.falar([L(e < 100 ? `A vila já está ${e}% viva! ${this.dicaAtual()}` : "Você conseguiu! Escuta só os passarinhos.")]);
        break;
      }
      case "iara":
        if (primeira || (p.mudas === 0 && p.plantadas.length < 8)) {
          const dar = 8 - p.plantadas.length - p.mudas;
          p.mudas += Math.max(0, dar);
          this.falar([
            L("Ah, {nome}! A horta está sofrendo com a terra seca e o lixo."),
            L("Leve estas mudas de ipê, pitanga e jatobá. As covas estão marcadas com bandeirinhas no Parque das Mudas e no campo ao norte."),
            L("Árvore faz sombra, segura a terra, chama passarinho e deixa o ar mais fresco. Plante com carinho!"),
          ], () => { aviso(`Você recebeu ${dar} mudas.`); this.salvar(); });
        } else if (p.plantadas.length >= 8) {
          this.falar([L("As mudas estão crescendo lindas. Repare como a vila fica mais fresca!")]);
        } else this.falar([L(`Ainda faltam ${8 - p.plantadas.length} mudas para plantar. As covas têm bandeirinhas brancas.`)]);
        break;
      case "teo":
        if (!p.ferramenta) {
          p.ferramenta = true;
          this.falar([
            L("Opa! O rio está sujo e a vila desperdiça água por todo lado."),
            L("Uma torneira pingando pode perder mais de 40 litros por dia. Pegue minha chave de vedação e conserte os vazamentos."),
            L("Tem um na horta, um na praça, um perto das casas e um junto da cooperativa. O pinga-pinga denuncia!"),
          ], () => { aviso("Você recebeu a chave de vedação."); this.salvar(); });
        } else if (p.consertos.length < 4) this.falar([L(`Faltam ${4 - p.consertos.length} vazamentos. E se achar lixo na margem do rio, recolha também!`)]);
        else this.falar([L("Água limpa, peixe feliz! Até a fonte da praça voltou a funcionar.")]);
        break;
      case "bia":
        if (p.paineis.length + p.paineisInv < 4) {
          const dar = 4 - p.paineis.length - p.paineisInv;
          p.paineisInv += dar;
          this.falar([
            L("Oi, {nome}! A cooperativa quer gerar energia limpa para toda a vila."),
            L(`Leve estes ${dar} painéis solares e instale nos suportes pontilhados aqui na frente, perto do rio.`),
            L("E repare: tem poste aceso em pleno dia! Apague as lâmpadas que estão gastando energia à toa."),
          ], () => { aviso(`Você recebeu ${dar} painéis solares.`); this.salvar(); });
        } else if (p.paineis.length < 4) this.falar([L(`Faltam ${4 - p.paineis.length} painéis nos suportes. O sol está esperando!`)]);
        else this.falar([L("Energia do sol para todas as casas. Repare nos telhados!")]);
        break;
      case "caio":
        this.falar([
          L(primeira ? "Bem-vinde ao Brechó Circular! Aqui nada se perde: roupa usada ganha nova vida." : "Voltou para dar um tapa no visual?"),
          L("A indústria da moda gasta muita água. Trocar, consertar e reaproveitar roupas faz diferença."),
          L("Pode experimentar o que quiser: misture peças, cores e estilos à vontade."),
        ], () => this.aoAbrirEditor("brecho"));
        break;
    }
    this.salvar();
  }

  dicaAtual() {
    const f = this.objetivoAtual();
    return f ? f.texto : "Explore a vila!";
  }

  plantar(c) {
    if (this.p.mudas <= 0) {
      this.falar([{ quem: "placa", texto: this.p.falou.iara ? "Suas mudas acabaram. Fale de novo com a Dona Iara, na horta." : "Uma cova pronta para receber uma muda. A Dona Iara, na horta, tem mudas para você." }]);
      return;
    }
    this.p.mudas--;
    c.plantada = this.p.tempo;
    this.p.plantadas.push({ id: c.id, t: this.p.tempo });
    this.audio.efeito("plantar");
    vibrar(15);
    this.estouro(c.x, c.y - 4, ["#73c650", "#b2e673", "#7a5236"], 14);
    this.salvar();
    this.verificarMissoes();
  }

  consertar(t) {
    if (!this.p.ferramenta) {
      this.falar([{ quem: "placa", texto: "Essa torneira está pingando sem parar! Você precisa de uma ferramenta. O Seu Téo, perto da ponte, pode emprestar." }]);
      return;
    }
    t.ok = true;
    this.p.consertos.push(t.id);
    this.audio.efeito("consertar");
    vibrar(20);
    this.estouro(t.x, t.y - 8, ["#9fd6ee", "#ffffff"], 10);
    this.salvar();
    this.verificarMissoes();
  }

  apagar(l) {
    l.acesa = false;
    this.p.apagadas.push(l.id);
    this.audio.efeito("desligar");
    vibrar(10);
    if (this.p.apagadas.length === 1) aviso("Lâmpada apagada! De dia, o sol ilumina de graça.", { dur: 2600 });
    this.salvar();
    this.verificarMissoes();
  }

  instalar(s) {
    if (this.p.paineisInv <= 0) {
      this.falar([{ quem: "placa", texto: "Um suporte vazio para painel solar. A Bia, na Cooperativa Solar, tem os painéis." }]);
      return;
    }
    this.p.paineisInv--;
    s.ok = true;
    this.p.paineis.push(s.id);
    this.audio.efeito("instalar");
    vibrar(20);
    this.estouro(s.x, s.y - 10, ["#f4c64a", "#ffffff", "#9ec4ff"], 14);
    this.salvar();
    this.verificarMissoes();
  }

  entrarBrecho() {
    const caio = this.npcs.find((n) => n.id === "caio");
    if (!this.p.falou.caio) return this.falarCom(caio);
    this.audio.efeito("abrir");
    this.aoAbrirEditor("brecho");
  }

  usarEspelho() {
    this.falar([{ quem: "voce", texto: "Hmm… vamos ver esse visual no espelho do provador." }], () => this.aoAbrirEditor("editar"));
  }

  visualTrocado() {
    this.p.trocasVisual++;
    this.salvar();
  }

  verificarMissoes() {
    this.p.concluidas = this.p.concluidas || [];
    for (const m of MISSOES) {
      if (this.progressoMissao(m) >= m.total && !this.p.concluidas.includes(m.id)) {
        this.p.concluidas.push(m.id);
        this.audio.efeito("missao");
        vibrar([30, 50, 30]);
        aviso(`Missão concluída: ${m.nome}!`, { dur: 3200 });
        this.estouro(this.jogador.x, this.jogador.y - 20, ["#f4c64a", "#73c650", "#ffffff", "#ee8fb3"], 30);
      }
    }
    this.salvar();
    if (this.eco() >= 0.999 && !this.p.fim) {
      this.p.fim = true;
      this.salvar();
      setTimeout(() => this.celebrar(), 1200);
    }
  }

  celebrar() {
    this.celebracao = 6;
    this.falar([
      { quem: "lia", texto: "{nome}! Olha isso! A vila inteira voltou a ter cor!" },
      { quem: "iara", texto: "As mudas vão virar um bosque. Daqui a uns anos, sombra para todo mundo." },
      { quem: "teo", texto: "Rio limpo, torneira fechada. Água é vida, e agora a gente cuida dela." },
      { quem: "bia", texto: "E a energia vem do sol. Nada de lâmpada acesa à toa!" },
      { quem: "caio", texto: "E o melhor: todo mundo com estilo, sem desperdiçar nada." },
    ], () => this.aoFim());
  }

  objetivoAtual() {
    const p = this.p;
    const j = this.jogador;
    const perto = (lista) => {
      let m = null, dm = Infinity;
      for (const o of lista) { const d = Math.hypot(o.x - j.x, o.y - j.y); if (d < dm) { dm = d; m = o; } }
      return m;
    };
    const npc = (id) => this.npcs.find((n) => n.id === id);
    const soltos = this.lixos.filter((l) => !l.pego);
    if (p.sacola.length >= CAP_SACOLA || (p.sacola.length && !soltos.length)) return { texto: "Leve a sacola ao <b>Ecoponto</b>", alvo: this.ecoponto };
    if (p.mudas > 0) return { texto: `Plante as mudas nas covas (${p.mudas} na mão)`, alvo: perto(this.covas.filter((c) => c.plantada === null)) };
    if (p.paineisInv > 0) return { texto: "Instale os painéis nos suportes", alvo: perto(this.suportes.filter((s) => !s.ok)) };
    if (p.ferramenta && p.consertos.length < 4) return { texto: `Conserte os vazamentos (${p.consertos.length}/4)`, alvo: perto(this.torneiras.filter((t) => !t.ok)) };
    if (soltos.length) return { texto: `Recolha o lixo (${p.separados + p.sacola.length}/20)`, alvo: perto(soltos) };
    if (p.plantadas.length < 8 && p.mudas === 0) return { texto: "Fale com a <b>Dona Iara</b> na horta", alvo: npc("iara") };
    if (!p.ferramenta && p.consertos.length < 4) return { texto: "Fale com o <b>Seu Téo</b> perto da ponte", alvo: npc("teo") };
    if (p.paineis.length < 4) return { texto: "Fale com a <b>Bia</b> na Cooperativa Solar", alvo: npc("bia") };
    const acesa = this.postes.filter((l) => l.acesa);
    if (acesa.length) return { texto: `Apague as lâmpadas acesas de dia (${p.apagadas.length}/6)`, alvo: perto(acesa) };
    return null;
  }

  // ------------------------------------------------------------ Atualização
  atualizar(dt) {
    this.t += dt;
    const acoes = this.entrada.consumir();
    if (this.estado === "titulo") {
      this.cam.x = 20 * T + Math.sin(this.t * 0.07) * 9 * T - this.tela.w / 2;
      this.cam.y = 24 * T + Math.sin(this.t * 0.05) * 10 * T - this.tela.h / 2;
      this.limitarCamera();
      this.atualizarParticulas(dt);
      this.ecoVis += (this.eco() - this.ecoVis) * Math.min(1, dt * 2);
      return acoes;
    }
    if (this.estado !== "jogando") return acoes;
    this.p.tempo += dt;
    this.ecoVis += (this.eco() - this.ecoVis) * Math.min(1, dt * 1.2);
    this.audio.vida = this.ecoVis;

    const toque = this.entrada.toqueRapido;
    this.entrada.toqueRapido = null;
    if (this.dialogo) {
      if (acoes.includes("interagir") || toque) this.avancarDialogo();
      this.atualizarDialogo(dt);
      this.atualizarNpcs(dt);
      this.atualizarParticulas(dt);
      this.centralizarCamera(false, dt);
      return acoes.filter((a) => a !== "interagir");
    }
    if (modalAberto()) return acoes;

    // movimento
    const j = this.jogador;
    let { x: dx, y: dy } = this.entrada.direcao();
    if (dx || dy) this.alvoToque = null;
    if (toque) this.tratarToque(toque);
    if (this.alvoToque) {
      const a = this.alvoToque;
      while (a.rota?.length && Math.hypot(a.rota[0].x - j.x, a.rota[0].y - j.y) < 4) a.rota.shift();
      const prox = a.rota?.length ? a.rota[0] : a;
      const ex = prox.x - j.x, ey = prox.y - j.y;
      const d = Math.hypot(ex, ey);
      const chegou = a.it ? Math.hypot(a.it.x - j.x, a.it.y - (j.y - 4)) < (a.it.raio || RAIO_INTERACAO) - 4 : d < 3 && !a.rota?.length;
      if (chegou) {
        const it = a.it;
        this.alvoToque = null;
        if (it) { this.virarPara(it.x, it.y); it.fazer(); }
      } else if (d > 0.01) {
        dx = ex / d;
        dy = ey / d;
      }
    }
    const andando = Math.hypot(dx, dy) > 0.05;
    if (andando) {
      const m = Math.min(1, Math.hypot(dx, dy));
      const v = VEL * (0.35 + 0.65 * m) * dt;
      const ax = j.x, ay = j.y;
      this.mover(j, dx * v, dy * v);
      if (Math.abs(dx) > Math.abs(dy) * 1.1) j.dir = dx > 0 ? "dir" : "esq";
      else j.dir = dy > 0 ? "baixo" : "cima";
      const prog = Math.hypot(j.x - ax, j.y - ay);
      j.anda += prog;
      if (this.alvoToque) {
        this.alvoToque.travado = prog < 0.15 * v ? (this.alvoToque.travado || 0) + dt : 0;
        if (this.alvoToque.travado > 0.35) this.alvoToque = null;
      }
      const passo = Math.floor(j.anda / 9) % 4;
      if (passo !== j.passo && passo % 2 === 0) this.audio.efeito("passo");
      j.passo = passo;
      j.quadro = 2 + passo;
    } else {
      j.quadro = Math.floor(this.t * 1.6) % 2;
    }

    // interação
    this.foco = this.maisProximo();
    if (acoes.includes("interagir") && this.foco) {
      this.virarPara(this.foco.x, this.foco.y);
      this.foco.fazer();
    }
    this.atualizarNpcs(dt);
    this.atualizarParticulas(dt);
    this.centralizarCamera(false, dt);
    if (this.celebracao > 0) {
      this.celebracao -= dt;
      if (Math.random() < 0.6) this.estouro(this.cam.x + Math.random() * this.tela.w, this.cam.y - 4, ["#f4c64a", "#73c650", "#ee8fb3", "#9fd6ee"], 2, true);
    }
    this.tempoSalvar = (this.tempoSalvar || 0) + dt;
    if (this.tempoSalvar > 8) { this.tempoSalvar = 0; this.salvar(); }
    return acoes;
  }

  virarPara(x, y) {
    const j = this.jogador;
    const dx = x - j.x, dy = y - (j.y - 4);
    if (Math.abs(dx) > Math.abs(dy)) j.dir = dx > 0 ? "dir" : "esq";
    else j.dir = dy > 0 ? "baixo" : "cima";
  }

  tratarToque(t) {
    const a = this.tela.paraArte(t.x, t.y);
    const wx = a.x + Math.round(this.cam.x), wy = a.y + Math.round(this.cam.y);
    // tocou em algo interativo?
    let melhor = null, dm = 18;
    for (const it of this.interativos()) {
      const d = Math.hypot(it.x - wx, it.y - 6 - wy);
      if (d < dm) { dm = d; melhor = it; }
    }
    const j = this.jogador;
    if (melhor) {
      const { rota } = this.caminho(j.x, j.y, melhor.x, melhor.y + 8);
      this.alvoToque = { x: melhor.x, y: melhor.y + 8, it: melhor, rota };
      this.audio.efeito("toque");
    } else {
      const { rota } = this.caminho(j.x, j.y, wx, wy);
      const fim = rota.length ? rota[rota.length - 1] : { x: wx, y: wy };
      this.alvoToque = { x: fim.x, y: fim.y, rota };
      this.marcaToque = { x: wx, y: wy, t: 0.5 };
    }
  }

  colide(x, y) {
    if (this.colideEstatico(x, y)) return true;
    const x0 = x - 4, x1 = x + 4, y0 = y - 3, y1 = y;
    for (const r of this.solidosDinamicos()) if (x1 > r[0] && x0 < r[0] + r[2] && y1 > r[1] && y0 < r[1] + r[3]) return true;
    return false;
  }
  colideEstatico(x, y) {
    // caixa dos pés
    const x0 = x - 4, x1 = x + 4, y0 = y - 3, y1 = y;
    for (const [px, py] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
      const t = this.mapa.get(Math.floor(px / T), Math.floor(py / T));
      if (t === TILE.AGUA || t === TILE.MATA) return true;
    }
    for (const o of this.objetos) {
      const s = o.solido;
      if (s && x1 > s[0] && x0 < s[0] + s[2] && y1 > s[1] && y0 < s[1] + s[3]) return true;
    }
    return false;
  }

  // Grade de 8px para achar caminho quando o jogador toca num ponto do cenário.
  construirGrade() {
    const G = 8, gw = (MW * T) / G, gh = (MH * T) / G;
    this.grade = { G, gw, gh, d: new Uint8Array(gw * gh) };
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) this.grade.d[y * gw + x] = this.colideEstatico(x * G + 4, y * G + 6) ? 1 : 0;
  }
  caminho(x0, y0, x1, y1) {
    const { G, gw, gh, d } = this.grade;
    const din = this.solidosDinamicos().filter((r, i) => i >= this.npcs.length);
    const livre = (cx, cy) => {
      if (cx < 0 || cy < 0 || cx >= gw || cy >= gh || d[cy * gw + cx]) return false;
      const x = cx * G + 4, y = cy * G + 6;
      for (const r of din) if (x + 4 > r[0] && x - 4 < r[0] + r[2] && y > r[1] && y - 3 < r[1] + r[3]) return false;
      return true;
    };
    const ini = Math.floor(x0 / G) + Math.floor(y0 / G) * gw;
    const fx = Math.floor(x1 / G), fy = Math.floor(y1 / G);
    const veio = new Int32Array(gw * gh).fill(-1);
    veio[ini] = ini;
    const fila = [ini];
    let melhor = ini, dm = Infinity;
    const viz = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let k = 0; k < fila.length && k < 6000; k++) {
      const c = fila[k], cx = c % gw, cy = (c / gw) | 0;
      const dd = Math.hypot(cx - fx, cy - fy);
      if (dd < dm) { dm = dd; melhor = c; if (dd === 0) break; }
      for (const [ax, ay] of viz) {
        const nx = cx + ax, ny = cy + ay, n = ny * gw + nx;
        if (!livre(nx, ny) || veio[n] !== -1) continue;
        if (ax && ay && (!livre(cx + ax, cy) || !livre(cx, cy + ay))) continue; // não corta quinas
        veio[n] = c;
        fila.push(n);
      }
    }
    const rota = [];
    for (let c = melhor; c !== ini; c = veio[c]) rota.push({ x: (c % gw) * G + 4, y: ((c / gw) | 0) * G + 6 });
    rota.reverse();
    return { rota, chega: dm < 1.5 };
  }
  solidosDinamicos() {
    const l = [];
    for (const n of this.npcs) l.push([n.x - 5, n.y - 4, 10, 4]);
    for (const t of this.torneiras) l.push([t.x - 4, t.y - 5, 8, 5]);
    for (const p of this.postes) l.push([p.x - 2, p.y - 3, 4, 3]);
    for (const c of this.covas) if (c.plantada !== null && this.estagio(c) === 2) l.push([c.x - 5, c.y - 5, 10, 5]);
    for (const s of this.suportes) if (s.ok) l.push([s.x - 13, s.y - 6, 26, 6]);
    return l;
  }
  mover(e, dx, dy) {
    if (!this.colide(e.x + dx, e.y)) e.x += dx;
    else if (dy === 0 && !this.colide(e.x + dx, e.y + Math.abs(dx))) { e.x += dx; e.y += Math.abs(dx); }
    if (!this.colide(e.x, e.y + dy)) e.y += dy;
    e.x = Math.max(8, Math.min(MW * T - 8, e.x));
    e.y = Math.max(8, Math.min(MH * T - 2, e.y));
  }

  atualizarNpcs(dt) {
    for (const n of this.npcs) {
      const falando = this.dialogo && this.dialogo.linhas[this.dialogo.i]?.quem === n.id;
      if (falando) { n.quadro = Math.floor(this.t * 1.6) % 2; continue; }
      if (n.alvo) {
        const ex = n.alvo.x - n.x, ey = n.alvo.y - n.y, d = Math.hypot(ex, ey);
        if (d < 1.5) { n.alvo = null; n.pausa = 2 + Math.random() * 4; }
        else {
          const v = 26 * dt;
          const ax = n.x, ay = n.y;
          const salva = this.npcs;
          this.npcs = salva.filter((o) => o !== n);
          const jx = this.jogador;
          // NPC não atravessa o jogador
          if (Math.hypot(jx.x - (n.x + (ex / d) * v), jx.y - (n.y + (ey / d) * v)) > 10) this.mover(n, (ex / d) * v, (ey / d) * v);
          this.npcs = salva;
          n.dir = Math.abs(ex) > Math.abs(ey) ? (ex > 0 ? "dir" : "esq") : ey > 0 ? "baixo" : "cima";
          n.anda += Math.hypot(n.x - ax, n.y - ay);
          n.quadro = 2 + (Math.floor(n.anda / 8) % 4);
          if (Math.hypot(n.x - ax, n.y - ay) < 0.1 * v) { n.alvo = null; n.pausa = 1; }
        }
      } else {
        n.quadro = Math.floor(this.t * 1.4 + n.casaX) % 2;
        n.pausa -= dt;
        if (n.pausa <= 0) {
          const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 18;
          n.alvo = { x: n.casaX + Math.cos(a) * r, y: n.casaY + Math.sin(a) * r * 0.6 };
        }
      }
    }
  }

  estouro(x, y, cores, n, chuva = false) {
    const lim = this.qualidade < 0.5 ? n / 2 : n;
    for (let i = 0; i < lim; i++) {
      const a = Math.random() * Math.PI * 2, v = chuva ? 10 + Math.random() * 20 : 20 + Math.random() * 40;
      this.particulas.push({
        x, y, vx: Math.cos(a) * v * (chuva ? 0.5 : 1), vy: chuva ? 15 + Math.random() * 20 : Math.sin(a) * v - 30,
        g: chuva ? 0 : 90, vida: chuva ? 4 : 0.6 + Math.random() * 0.5, cor: cores[i % cores.length], folha: chuva,
      });
    }
  }
  atualizarParticulas(dt) {
    for (const p of this.particulas) {
      p.vx *= 1 - dt * (p.folha ? 0.2 : 1.5);
      p.vy += p.g * dt;
      p.x += (p.vx + (p.folha ? Math.sin(this.t * 3 + p.y * 0.1) * 12 : 0)) * dt;
      p.y += p.vy * dt;
      p.vida -= dt;
    }
    this.particulas = this.particulas.filter((p) => p.vida > 0);
    if (this.particulas.length > 400) this.particulas.splice(0, this.particulas.length - 400);
    // gotas das torneiras quebradas
    for (const t of this.torneiras) {
      if (t.ok) continue;
      t.gota = (t.gota || Math.random()) - dt;
      if (t.gota <= 0) {
        t.gota = 0.5;
        this.particulas.push({ x: t.x + 5, y: t.y - 7, vx: 0, vy: 10, g: 160, vida: 0.32, cor: "#9fd6ee", folha: false });
      }
    }
    if (this.marcaToque) { this.marcaToque.t -= dt; if (this.marcaToque.t <= 0) this.marcaToque = null; }
  }

  estagio(c) {
    if (c.plantada === null) return -1;
    const idade = this.p.tempo - c.plantada;
    return idade < 12 ? 0 : idade < 35 ? 1 : 2;
  }

  // ------------------------------------------------------------ Câmera
  centralizarCamera(imediato, dt = 0) {
    const j = this.jogador;
    const alvoX = j.x - this.tela.w / 2;
    const alvoY = j.y - 12 - this.tela.h / 2;
    if (imediato) { this.cam.x = alvoX; this.cam.y = alvoY; }
    else {
      const k = Math.min(1, dt * 8);
      this.cam.x += (alvoX - this.cam.x) * k;
      this.cam.y += (alvoY - this.cam.y) * k;
    }
    this.limitarCamera();
  }
  limitarCamera() {
    const W0 = MW * T, H0 = MH * T, w = this.tela.w, h = this.tela.h;
    this.cam.x = w >= W0 ? (W0 - w) / 2 : Math.max(0, Math.min(W0 - w, this.cam.x));
    this.cam.y = h >= H0 ? (H0 - h) / 2 : Math.max(0, Math.min(H0 - h, this.cam.y));
  }

  // ------------------------------------------------------------ Desenho
  desenhar() {
    const ctx = this.tela.ctx;
    const w = this.tela.w, h = this.tela.h;
    const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
    const eco = Math.max(0, Math.min(1, this.ecoVis || 0));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#2a4a3a";
    ctx.fillRect(0, 0, w, h);
    // chão: versão seca + versão viva por cima, conforme a vida da vila
    const sx = Math.max(0, cx), sy = Math.max(0, cy);
    const sw = Math.min(MW * T - sx, w), sh = Math.min(MH * T - sy, h);
    const dx0 = sx - cx, dy0 = sy - cy;
    if (eco < 0.999) ctx.drawImage(this.chao.seca, sx, sy, sw, sh, dx0, dy0, sw, sh);
    if (eco > 0.001) {
      ctx.globalAlpha = eco;
      ctx.drawImage(this.chao.viva, sx, sy, sw, sh, dx0, dy0, sw, sh);
      ctx.globalAlpha = 1;
    }
    // poças das torneiras
    for (const t of this.torneiras) {
      if (t.ok) continue;
      ctx.fillStyle = "rgba(120,190,230,0.55)";
      ctx.beginPath();
      ctx.ellipse(t.x + 5 - cx, t.y + 2 - cy, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // covas e suportes vazios (no chão)
    const cova = W.spriteCova();
    for (const c of this.covas) if (c.plantada === null) ctx.drawImage(cova, Math.round(c.x - 7 - cx), Math.round(c.y - 6 - cy));
    const painel = W.spritesPainel();
    for (const s of this.suportes) if (!s.ok) ctx.drawImage(painel.vazio, Math.round(s.x - 15 - cx), Math.round(s.y - 20 - cy));
    if (this.marcaToque) {
      ctx.strokeStyle = `rgba(255,255,255,${this.marcaToque.t * 1.6})`;
      ctx.beginPath();
      ctx.ellipse(this.marcaToque.x - cx, this.marcaToque.y - cy, 6 - this.marcaToque.t * 4, 3 - this.marcaToque.t * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // lista ordenada por profundidade
    const lista = [];
    const visivel = (x, y, mw = 80, mh = 100) => x > cx - mw && x < cx + w + mw && y > cy - 10 && y < cy + h + mh;
    for (const o of this.objetos) if (visivel(o.x, o.y, 90, 100)) lista.push({ y: o.y, d: () => this.desenharObjeto(ctx, o, cx, cy, eco) });
    const poste = W.spritesPoste();
    for (const l of this.postes) if (visivel(l.x, l.y)) lista.push({ y: l.y, d: () => ctx.drawImage(l.acesa ? poste.acesa : poste.apagada, Math.round(l.x - 6 - cx), Math.round(l.y - 44 - cy)) });
    const torn = W.spritesTorneira();
    for (const t of this.torneiras) if (visivel(t.x, t.y)) lista.push({ y: t.y, d: () => ctx.drawImage(t.ok ? torn.consertada : torn.vazando, Math.round(t.x - 7 - cx), Math.round(t.y - 18 - cy)) });
    for (const s of this.suportes) if (s.ok && visivel(s.x, s.y)) lista.push({ y: s.y, d: () => ctx.drawImage(painel.pronto, Math.round(s.x - 15 - cx), Math.round(s.y - 24 - cy)) });
    const mudas = W.spritesMuda();
    for (const c of this.covas) {
      const e = this.estagio(c);
      if (e < 0 || !visivel(c.x, c.y)) continue;
      const spr = mudas[e];
      lista.push({ y: c.y, d: () => { this.sombra(ctx, c.x - cx, c.y - cy, 4 + e * 3); ctx.drawImage(spr, Math.round(c.x - spr.width / 2 - cx), Math.round(c.y - spr.height + 1 - cy)); } });
    }
    for (const l of this.lixos) {
      if (l.pego || !visivel(l.x, l.y)) continue;
      const ic = W.iconeLixo(l.tipo);
      const bob = Math.sin(this.t * 3 + l.id) > 0.8 ? -1 : 0;
      lista.push({ y: l.y, d: () => { this.sombra(ctx, l.x - cx, l.y - cy, 4); ctx.drawImage(ic, Math.round(l.x - 6 - cx), Math.round(l.y - 11 - cy + bob)); } });
    }
    for (const n of this.npcs) if (visivel(n.x, n.y)) lista.push({ y: n.y, d: () => this.desenharAtor(ctx, n, n.folha, cx, cy) });
    if (this.estado !== "titulo" && this.folha) lista.push({ y: this.jogador.y + 0.1, d: () => this.desenharAtor(ctx, this.jogador, this.folha, cx, cy) });
    lista.sort((a, b) => a.y - b.y);
    for (const it of lista) it.d();

    this.desenharEfeitos(ctx, cx, cy, w, h, eco);
  }

  sombra(ctx, x, y, r) {
    ctx.fillStyle = "rgba(20,30,20,0.28)";
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  desenharObjeto(ctx, o, cx, cy, eco) {
    const s = o.spr;
    if (!s.w) { s.w = s.width; s.h = s.height; }
    const x = Math.round(o.x - s.w / 2 - cx), y = Math.round(o.y - s.h - cy);
    if (!s.seca) ctx.drawImage(s, x, y); // sprite único (igual nas duas versões)
    else if (eco < 0.999) ctx.drawImage(s.seca, x, y);
    if (s.viva && eco > 0.001) {
      ctx.globalAlpha = eco;
      ctx.drawImage(s.viva, x, y);
      ctx.globalAlpha = 1;
    }
    if (o === this.espelho) this.desenharReflexo(ctx, x, y);
    if (o === this.fonte && this.p.consertos.length >= 4) {
      // jatos d'água
      ctx.fillStyle = "rgba(190,235,255,0.85)";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + this.t;
        const k = (this.t * 2 + i / 6) % 1;
        ctx.fillRect(Math.round(x + 22 + Math.cos(a) * 9 * k), Math.round(y + 4 - Math.sin(k * Math.PI) * 6 + k * 14), 1, 2);
      }
    }
  }

  // O espelho do provador reflete o personagem quando ele chega perto.
  desenharReflexo(ctx, x, y) {
    const j = this.jogador;
    if (this.estado === "titulo" || !this.folha) return;
    const d = Math.hypot(j.x - this.espelho.x, j.y - this.espelho.y);
    if (d > 56) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 3, y + 3, 20, 30);
    ctx.clip();
    const dir = j.dir === "cima" ? "baixo" : j.dir === "baixo" ? "cima" : j.dir;
    const rx = x + 13 + Math.max(-8, Math.min(8, (j.x - this.espelho.x) * 0.4));
    ctx.globalAlpha = Math.max(0, 1 - d / 56) * 0.9 + 0.1;
    desenharSprite(ctx, this.folha, dir, j.quadro, rx, y + 33);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#bfe0ea";
    ctx.fillRect(x + 3, y + 3, 20, 30);
    ctx.restore();
  }

  desenharAtor(ctx, a, folha, cx, cy) {
    this.sombra(ctx, a.x - cx, a.y - cy, 6);
    desenharSprite(ctx, folha, a.dir, a.quadro, Math.round(a.x - cx), Math.round(a.y + 1 - cy));
  }

  desenharEfeitos(ctx, cx, cy, w, h, eco) {
    const q = this.qualidade;
    // brilho das lâmpadas acesas
    ctx.globalCompositeOperation = "lighter";
    for (const l of this.postes) if (l.acesa) ctx.drawImage(this.brilho, Math.round(l.x - 24 - cx), Math.round(l.y - 62 - cy));
    ctx.globalCompositeOperation = "source-over";
    // partículas
    for (const p of this.particulas) {
      ctx.fillStyle = p.cor;
      ctx.globalAlpha = Math.min(1, p.vida * 3);
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.folha ? 2 : 1, p.folha ? 1 : 1);
    }
    ctx.globalAlpha = 1;
    // borboletas e brilho na água quando a vila está viva
    const nb = Math.floor(eco * 14 * q);
    for (let i = 0; i < nb; i++) {
      const bx = (hash(i, 1, 9) * MW * T + Math.sin(this.t * 0.6 + i) * 30) % (MW * T);
      const by = (hash(i, 2, 9) * MH * T + Math.cos(this.t * 0.5 + i * 2) * 20) % (MH * T);
      if (bx < cx - 4 || bx > cx + w + 4 || by < cy - 4 || by > cy + h + 4) continue;
      const asa = Math.sin(this.t * 14 + i) > 0;
      ctx.fillStyle = ["#ffd34d", "#f06a8a", "#ffffff", "#b48cff"][i % 4];
      ctx.fillRect(Math.round(bx - cx) - (asa ? 1 : 0), Math.round(by - cy), asa ? 3 : 1, 2);
    }
    if (eco > 0.2 && q > 0.4) {
      ctx.fillStyle = `rgba(255,255,255,${0.7 * eco})`;
      for (let i = 0; i < 30 * q; i++) {
        const bx = Math.floor(hash(i, Math.floor(this.t * 1.5), 3) * w), by = Math.floor(hash(i, Math.floor(this.t * 1.5), 4) * h);
        if (this.mapa.get(Math.floor((bx + cx) / T), Math.floor((by + cy) / T)) === TILE.AGUA) ctx.fillRect(bx, by, 2, 1);
      }
    }
    // névoa de poluição
    const pol = 1 - eco;
    if (pol > 0.01) {
      ctx.fillStyle = `rgba(118,112,92,${0.2 * pol})`;
      ctx.fillRect(0, 0, w, h);
      if (q > 0.35) {
        ctx.globalAlpha = pol;
        const n = Math.floor(this.blobs.length * q);
        for (let i = 0; i < n; i++) {
          const b = this.blobs[i];
          const bx = ((b.x + this.t * b.v) % (MW * T + 64)) - 32;
          if (bx < cx - 70 || bx > cx + w + 10 || b.y < cy - 50 || b.y > cy + h + 10) continue;
          ctx.drawImage(this.fumaca, Math.round(bx - cx), Math.round(b.y - cy));
        }
        ctx.globalAlpha = 1;
      }
    }
    if (this.estado !== "jogando") return;
    // marcador do que pode ser usado
    if (this.foco && !this.dialogo) {
      const bob = Math.round(Math.sin(this.t * 6) * 1.5);
      const fx = Math.round(this.foco.x - cx), fy = Math.round(this.foco.y - cy - (this.foco.npc ? 36 : 18) + bob);
      ctx.fillStyle = "#22302a";
      ctx.fillRect(fx - 3, fy - 4, 7, 7);
      ctx.fillStyle = "#f4c64a";
      ctx.fillRect(fx - 2, fy - 3, 5, 5);
      ctx.fillStyle = "#22302a";
      ctx.fillRect(fx, fy - 2, 1, 2);
      ctx.fillRect(fx, fy + 1, 1, 1);
    }
    // seta do objetivo
    const obj = this.objetivoAtual();
    this.objetivo = obj;
    if (obj?.alvo && !this.dialogo) {
      const ax = obj.alvo.x - cx, ay = obj.alvo.y - 10 - cy;
      const m = 14;
      const fora = ax < m || ax > w - m || ay < 70 || ay > h - m;
      if (fora) {
        const jx = this.jogador.x - cx, jy = this.jogador.y - 14 - cy;
        const ang = Math.atan2(ay - jy, ax - jx);
        const r = 26 + Math.sin(this.t * 5) * 2;
        this.seta(ctx, jx + Math.cos(ang) * r, jy + Math.sin(ang) * r, ang);
      } else if (!this.foco || Math.hypot(this.foco.x - obj.alvo.x, this.foco.y - obj.alvo.y) > 30) {
        const bob = Math.round(Math.sin(this.t * 5) * 2);
        this.seta(ctx, ax, ay - (obj.alvo.folha ? 30 : obj.alvo.spr ? obj.alvo.spr.h - 6 : 10) + bob, Math.PI / 2);
      }
    }
  }

  seta(ctx, x, y, ang) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(ang);
    ctx.fillStyle = "#22302a";
    ctx.beginPath();
    ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f4c64a";
    ctx.beginPath();
    ctx.moveTo(4, 0); ctx.lineTo(-3, -3.4); ctx.lineTo(-1.4, 0); ctx.lineTo(-3, 3.4); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export { DIRECOES, LARG, ALT };
