// Mundo: mapa da Vila Verdejar e toda a arte de cenário, gerada por código.
// Cada elemento existe em duas versões: "seca" (vila poluída, sem cor) e "viva"
// (vila recuperada). O jogo mistura as duas conforme a vida da vila aumenta.
import { Pixmap, rgb, misturar, escurecer, clarear, hash, ruido, criarCanvas } from "./pixel.js";

export const T = 16;
export const MW = 40;
export const MH = 58;

export const TILE = { GRAMA: 0, TERRA: 1, PEDRA: 2, RUA: 3, AGUA: 4, PONTE: 5, AREIA: 6, CANTEIRO: 7, PISO: 8, MATA: 9 };

// ---------------------------------------------------------------- Lixo
export const CATEGORIAS = [
  { id: "papel", nome: "Papel", cor: "#2f6fd0" },
  { id: "plastico", nome: "Plástico", cor: "#d0443a" },
  { id: "metal", nome: "Metal", cor: "#d9a521" },
  { id: "vidro", nome: "Vidro", cor: "#3c9a48" },
  { id: "organico", nome: "Orgânico", cor: "#7a5236" },
];
export const LIXOS = {
  pet: { nome: "Garrafa PET", cat: "plastico", fato: "Uma garrafa PET leva cerca de 400 anos para se decompor. Reciclada, vira até roupa!" },
  sacola: { nome: "Sacola plástica", cat: "plastico", fato: "Sacolas plásticas no rio confundem tartarugas, que acham que são águas-vivas." },
  lata: { nome: "Latinha", cat: "metal", fato: "O alumínio pode ser reciclado infinitas vezes, e o Brasil recicla quase todas as latinhas." },
  conserva: { nome: "Lata de conserva", cat: "metal", fato: "Latas de aço também são recicláveis: lave antes de descartar." },
  jornal: { nome: "Jornal", cat: "papel", fato: "Cada tonelada de papel reciclado poupa cerca de 20 árvores." },
  caixa: { nome: "Caixa de papelão", cat: "papel", fato: "Desmonte as caixas: ocupam menos espaço na coleta seletiva." },
  vidro: { nome: "Garrafa de vidro", cat: "vidro", fato: "O vidro é 100% reciclável e não perde qualidade no processo." },
  pote: { nome: "Pote de vidro", cat: "vidro", fato: "Antes de reciclar, um pote de vidro pode guardar sementes ou temperos." },
  banana: { nome: "Casca de banana", cat: "organico", fato: "Restos de comida viram adubo na composteira e alimentam a horta." },
  maca: { nome: "Resto de maçã", cat: "organico", fato: "Quase metade do lixo de casa é orgânico e pode virar adubo." },
};

// ---------------------------------------------------------------- Utilidades de arte
function pixmapParaCanvas(pm) {
  return pm.paraCanvas();
}

// Transforma a versão viva na versão poluída: cores apagadas, poeira e um tom acinzentado.
function poluirCor(c, x, y) {
  const g = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15;
  const cinza = [g, g * 0.97, g * 0.88, c[3]];
  let r = misturar(c, cinza, 0.68);
  r = misturar(r, [150, 140, 112, c[3]], 0.18);
  const n = hash(x, y, 404);
  if (n < 0.06) r = escurecer(r, 0.12);
  r[3] = c[3];
  return r;
}
function poluir(pm) {
  const o = new Pixmap(pm.w, pm.h);
  for (let y = 0; y < pm.h; y++)
    for (let x = 0; x < pm.w; x++) {
      const c = pm.get(x, y);
      if (c[3] === 0) continue;
      const i = (y * pm.w + x) * 4;
      const r = poluirCor(c, x, y);
      o.d[i] = r[0]; o.d[i + 1] = r[1]; o.d[i + 2] = r[2]; o.d[i + 3] = c[3];
    }
  return o;
}

// Cria as duas versões (viva e seca) de um sprite.
function par(w, h, desenhar, { contorno = true } = {}) {
  const viva = new Pixmap(w, h);
  desenhar(viva, true);
  if (contorno) viva.contornar(0.6);
  const seca0 = new Pixmap(w, h);
  desenhar(seca0, false);
  if (contorno) seca0.contornar(0.6);
  const seca = poluir(seca0);
  return { viva: pixmapParaCanvas(viva), seca: pixmapParaCanvas(seca), w, h };
}
function unico(w, h, desenhar, contorno = true) {
  const pm = new Pixmap(w, h);
  desenhar(pm);
  if (contorno) pm.contornar(0.6);
  return pixmapParaCanvas(pm);
}

function sombreado(pm, x0, y0, w, h, cor, { luz = 0.14, sombra = 0.26 } = {}) {
  const c = rgb(cor);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let k = c;
      if (x === w - 1 || y === h - 1) k = escurecer(c, sombra);
      else if (x === 0 || y === 0) k = clarear(c, luz);
      pm.set(x0 + x, y0 + y, k);
    }
}

// ---------------------------------------------------------------- Árvores e plantas
function copa(pm, cx, cy, escala, vivo, s) {
  const bolas = [[0, 0, 10], [-7, 3, 7], [7, 3, 7], [-4, -5, 6.5], [4, -5, 6.5], [0, 5, 7]];
  const pal = vivo
    ? [rgb("#2f7a34"), rgb("#47a043"), rgb("#73c650"), rgb("#b2e673")]
    : [rgb("#5f5d3a"), rgb("#837f4c"), rgb("#a59a62"), rgb("#c2b47a")];
  for (let y = 0; y < pm.h; y++)
    for (let x = 0; x < pm.w; x++) {
      let dentro = false, ny = 0, nx = 0;
      for (const [bx, by, r] of bolas) {
        const dx = (x + 0.5 - (cx + bx * escala)) / (r * escala), dy = (y + 0.5 - (cy + by * escala)) / (r * escala);
        const d = dx * dx + dy * dy;
        if (d <= 1 + (hash(x, y, s) - 0.5) * 0.25) { dentro = true; nx = (x - cx) / (10 * escala); ny = (y - cy) / (10 * escala); }
      }
      if (!dentro) continue;
      if (!vivo && hash(x, y, s + 9) < 0.14) continue; // folhagem rala
      const n = ruido(x * 0.45, y * 0.45, s);
      let i = 1;
      if (ny < -0.35 && nx < 0.3) i = 2;
      if (ny > 0.35 || nx > 0.55) i = 0;
      if (n > 0.68) i = Math.min(3, i + 1);
      if (n < 0.25) i = Math.max(0, i - 1);
      let c = pal[i];
      if (!vivo && hash(x, y, s + 3) < 0.08) c = rgb("#9a6a3a");
      if (vivo && hash(x, y, s + 5) < 0.012) c = rgb(["#f06a6a", "#ffd34d", "#ffffff"][Math.floor(hash(x, y, s) * 3)]);
      pm.set(x, y, c);
    }
}
function tronco(pm, x, y0, y1, larg = 4) {
  const c = rgb("#7a5236");
  for (let y = y0; y <= y1; y++)
    for (let i = 0; i < larg; i++) pm.set(x + i, y, i === 0 ? clarear(c, 0.15) : i === larg - 1 ? escurecer(c, 0.3) : (y + i) % 4 === 0 ? escurecer(c, 0.12) : c);
  pm.set(x - 1, y1, escurecer(c, 0.2));
  pm.set(x + larg, y1, escurecer(c, 0.3));
}

const cacheArvores = [];
export function spriteArvore(v) {
  if (!cacheArvores[v]) {
    cacheArvores[v] = par(32, 42, (pm, vivo) => {
      tronco(pm, 14, 24, 40);
      copa(pm, 16, 15, 1 + (v % 3) * 0.04, vivo, 100 + v * 7);
    });
  }
  return cacheArvores[v];
}
let cacheMudas = null;
export function spritesMuda() {
  if (cacheMudas) return cacheMudas;
  cacheMudas = [
    unico(12, 14, (pm) => {
      pm.rect(5, 6, 1, 7, rgb("#5a8a3a"));
      pm.rect(2, 4, 3, 2, rgb("#6cc04a"));
      pm.rect(6, 2, 3, 2, rgb("#6cc04a"));
      pm.set(2, 4, rgb("#9be070"));
      pm.set(8, 2, rgb("#9be070"));
      pm.rect(3, 12, 6, 2, rgb("#6a4a30"));
    }),
    unico(22, 28, (pm) => {
      tronco(pm, 10, 15, 26, 2);
      copa(pm, 11, 10, 0.55, true, 55);
    }),
    spriteArvore(1).viva,
  ];
  return cacheMudas;
}
export function spriteCova() {
  return unico(14, 8, (pm) => {
    pm.elipse(7, 4, 6, 3, (x, y, nx, ny) => (ny < -0.2 ? rgb("#4a3020") : rgb("#6a4a30")));
    pm.rect(11, 0, 1, 5, rgb("#c9a36a"));
    pm.rect(10, 0, 3, 2, rgb("#f2efe6"));
  }, false);
}
let cacheArbusto = null;
export function spriteArbusto() {
  if (!cacheArbusto) cacheArbusto = par(18, 14, (pm, vivo) => copa(pm, 9, 8, 0.55, vivo, 300));
  return cacheArbusto;
}

// ---------------------------------------------------------------- Construções
function janela(pm, x, y, w, h, vivo, acesa) {
  sombreado(pm, x, y, w, h, "#5a4632");
  const vidro = acesa ? rgb("#ffe37a") : vivo ? rgb("#9fd6ee") : rgb("#7b8a94");
  pm.rect(x + 1, y + 1, w - 2, h - 2, vidro);
  pm.rect(x + 1, y + Math.floor(h / 2), w - 2, 1, rgb("#5a4632"));
  pm.set(x + 1, y + 1, clarear(vidro, 0.5));
  if (vivo) {
    // floreira
    pm.rect(x - 1, y + h, w + 2, 2, rgb("#8a5a3a"));
    for (let i = 0; i < w; i += 2) pm.set(x + i, y + h - 1, rgb(i % 4 ? "#f06a8a" : "#ffd34d"));
  }
}

const CORES_CASA = [
  { parede: "#efe2c4", telhado: "#c4553a" },
  { parede: "#cfe0e8", telhado: "#3f6fa8" },
  { parede: "#f0d0c8", telhado: "#5a8a4a" },
  { parede: "#e8c9a0", telhado: "#9a5a8a" },
  { parede: "#e2ecd0", telhado: "#b07a3a" },
];
const cacheCasas = new Map();
export function spriteCasa(v, acesa) {
  const k = v + (acesa ? "a" : "");
  if (cacheCasas.has(k)) return cacheCasas.get(k);
  const cor = CORES_CASA[v % CORES_CASA.length];
  const s = par(80, 74, (pm, vivo) => {
    // paredes
    const pa = rgb(cor.parede);
    for (let y = 30; y < 72; y++)
      for (let x = 4; x < 76; x++) pm.set(x, y, x > 72 ? escurecer(pa, 0.18) : y > 69 ? escurecer(pa, 0.12) : hash(x, y, v) < 0.04 ? escurecer(pa, 0.05) : pa);
    // telhado
    const te = rgb(cor.telhado);
    for (let y = 2; y < 32; y++) {
      const m = Math.max(0, 14 - Math.floor(y / 2.2));
      for (let x = m; x < 80 - m; x++) {
        let c = (y % 5 === 0) ? escurecer(te, 0.2) : ((x + (Math.floor(y / 5) % 2) * 4) % 8 === 0 ? escurecer(te, 0.12) : te);
        if (y < 5) c = clarear(te, 0.2);
        if (x < m + 2) c = clarear(c, 0.12);
        if (x > 77 - m) c = escurecer(c, 0.2);
        pm.set(x, y, c);
      }
    }
    pm.rect(0, 30, 80, 2, escurecer(te, 0.35));
    if (vivo) {
      // painéis solares no telhado
      for (const px of [20, 42]) {
        pm.rect(px, 10, 18, 12, rgb("#23396e"));
        for (let i = 0; i < 18; i += 6) pm.rect(px + i, 10, 1, 12, rgb("#5a7ac0"));
        pm.rect(px, 16, 18, 1, rgb("#5a7ac0"));
        pm.set(px + 1, 11, rgb("#cfe2ff"));
      }
    }
    // porta e janelas
    sombreado(pm, 34, 48, 12, 24, "#7a4a2e");
    pm.set(43, 60, rgb("#e8c860"));
    pm.rect(33, 72, 14, 2, rgb("#8a8478"));
    janela(pm, 12, 42, 14, 12, vivo, acesa);
    janela(pm, 54, 42, 14, 12, vivo, acesa);
    if (!vivo) {
      // rachaduras e manchas
      for (let i = 0; i < 6; i++) pm.set(60 + i, 58 + (i % 2), rgb("#7a7060"));
      pm.rect(6, 64, 10, 6, misturar(pa, "#6a6050", 0.4));
    } else {
      // trepadeira
      for (let y = 34; y < 72; y++) if (hash(5, y, 3) < 0.7) pm.set(5 + (y % 3 === 0 ? 1 : 0), y, rgb(y % 4 ? "#47a043" : "#73c650"));
    }
  });
  cacheCasas.set(k, s);
  return s;
}

let cacheCoop = null;
export function spriteCooperativa() {
  if (cacheCoop) return cacheCoop;
  cacheCoop = par(144, 84, (pm, vivo) => {
    const pa = rgb("#dfe6e2");
    for (let y = 26; y < 82; y++) for (let x = 2; x < 142; x++) pm.set(x, y, x > 138 ? escurecer(pa, 0.2) : y > 79 ? escurecer(pa, 0.1) : pa);
    // telhado plano com painéis
    pm.rect(0, 6, 144, 22, rgb("#6d7d78"));
    pm.rect(0, 26, 144, 2, rgb("#46524e"));
    for (let i = 0; i < 6; i++) {
      const x = 6 + i * 23;
      pm.rect(x, 9, 20, 14, vivo ? rgb("#23396e") : rgb("#3a3f48"));
      for (let k = 0; k < 20; k += 5) pm.rect(x + k, 9, 1, 14, vivo ? rgb("#5a7ac0") : rgb("#55595f"));
      pm.rect(x, 16, 20, 1, vivo ? rgb("#5a7ac0") : rgb("#55595f"));
      if (!vivo && i % 2) { pm.rect(x + 3, 10, 6, 4, rgb("#8a8478")); } // painéis quebrados/sujos
    }
    // letreiro com sol
    pm.rect(48, 30, 48, 14, rgb("#2d7a37"));
    pm.elipse(58, 37, 4.5, 4.5, rgb("#f4c64a"));
    for (const [dx, dy] of [[0, -7], [0, 7], [-7, 0], [7, 0]]) pm.set(58 + dx, 37 + dy, rgb("#f4c64a"));
    for (let i = 0; i < 4; i++) pm.rect(68 + i * 6, 34 + (i % 2), 4, 6 - (i % 2) * 2, rgb("#f7f0da"));
    // portas de vidro e janelas
    sombreado(pm, 62, 54, 20, 28, "#3a5a6a");
    pm.rect(64, 56, 7, 24, rgb(vivo ? "#9fd6ee" : "#7b8a94"));
    pm.rect(73, 56, 7, 24, rgb(vivo ? "#9fd6ee" : "#7b8a94"));
    for (const x of [12, 34, 96, 118]) janela(pm, x, 50, 16, 14, vivo, false);
    // bateria / medidor
    sombreado(pm, 128, 62, 10, 18, "#9a9a96");
    pm.rect(130, 66, 6, 10, rgb(vivo ? "#5aa847" : "#d0443a"));
  });
  return cacheCoop;
}

let cacheBrecho = null;
export function spriteBrecho() {
  if (cacheBrecho) return cacheBrecho;
  cacheBrecho = par(112, 80, (pm, vivo) => {
    const pa = rgb("#f2d7a8");
    for (let y = 22; y < 78; y++) for (let x = 3; x < 109; x++) pm.set(x, y, x > 105 ? escurecer(pa, 0.18) : hash(x, y, 8) < 0.05 ? escurecer(pa, 0.06) : pa);
    // telhado
    for (let y = 0; y < 24; y++) for (let x = 0; x < 112; x++) pm.set(x, y, y % 4 === 0 ? escurecer(rgb("#8a4a6a"), 0.2) : y < 3 ? clarear(rgb("#8a4a6a"), 0.2) : rgb("#8a4a6a"));
    // toldo listrado
    for (let x = 6; x < 106; x++) {
      const c = Math.floor(x / 8) % 2 ? rgb("#f7f0da") : rgb("#45a545");
      for (let y = 26; y < 34; y++) pm.set(x, y, y === 33 ? escurecer(c, 0.25) : c);
      if (x % 8 === 4) pm.set(x, 34, c);
    }
    // vitrine com roupas
    sombreado(pm, 10, 40, 36, 26, "#6a4a32");
    pm.rect(12, 42, 32, 22, rgb(vivo ? "#cfeaf2" : "#8a949a"));
    const roupas = ["#d0443a", "#3c6fcf", "#f1d04b", "#5aa847"];
    for (let i = 0; i < 4; i++) {
      const x = 14 + i * 8;
      pm.rect(x + 2, 44, 2, 1, rgb("#5a4632"));
      pm.rect(x, 45, 6, 8, rgb(roupas[i]));
      pm.rect(x - 1, 46, 1, 4, rgb(roupas[i]));
      pm.rect(x + 6, 46, 1, 4, rgb(roupas[i]));
    }
    // porta
    sombreado(pm, 60, 46, 16, 32, "#7a4a2e");
    pm.rect(62, 48, 12, 12, rgb(vivo ? "#cfeaf2" : "#8a949a"));
    pm.set(73, 64, rgb("#e8c860"));
    // placa com cabide
    pm.rect(82, 40, 22, 16, rgb("#f7f0da"));
    pm.rect(82, 40, 22, 1, rgb("#8a6a40"));
    for (let i = 0; i < 9; i++) pm.set(87 + i, 50 - Math.abs(i - 4) * 0.5 | 0, rgb("#5a4632"));
    pm.rect(91, 44, 1, 3, rgb("#5a4632"));
    // setas de reciclagem
    pm.rect(86, 52, 14, 1, rgb("#45a545"));
    pm.rect(84, 64, 22, 1, rgb("#c9a36a"));
  });
  return cacheBrecho;
}

let cacheEcoponto = null;
export function spriteEcoponto() {
  if (cacheEcoponto) return cacheEcoponto;
  cacheEcoponto = par(80, 46, (pm, vivo) => {
    // cobertura
    pm.rect(0, 0, 80, 8, rgb("#45a545"));
    pm.rect(0, 7, 80, 2, rgb("#2d7a37"));
    pm.rect(2, 9, 2, 34, rgb("#8a8478"));
    pm.rect(76, 9, 2, 34, rgb("#8a8478"));
    // símbolo
    pm.elipse(40, 4, 3, 3, rgb("#f7f0da"));
    CATEGORIAS.forEach((c, i) => {
      const x = 6 + i * 14;
      const k = rgb(c.cor);
      sombreado(pm, x, 22, 12, 22, c.cor);
      pm.rect(x - 1, 19, 14, 4, escurecer(k, 0.2));
      pm.rect(x + 3, 26, 6, 2, escurecer(k, 0.35));
      pm.rect(x + 2, 32, 8, 6, clarear(k, 0.25));
      if (!vivo) { pm.set(x + 2, 44, rgb("#c9c2b0")); pm.set(x + 9, 45, rgb("#9a8a70")); }
    });
  });
  return cacheEcoponto;
}

let cacheViveiro = null;
export function spriteViveiro() {
  if (cacheViveiro) return cacheViveiro;
  cacheViveiro = par(64, 52, (pm, vivo) => {
    const vidro = vivo ? rgb("#bfe6ef") : rgb("#9aa6a8");
    for (let y = 4; y < 50; y++) {
      const m = y < 18 ? Math.max(0, 18 - y) : 0;
      for (let x = 2 + m; x < 62 - m; x++) {
        let c = vidro;
        if (x % 12 === 2 || y % 12 === 4) c = rgb("#e8ece8");
        if (y > 18 && hash(x, y, 2) < (vivo ? 0.25 : 0.05)) c = rgb(vivo ? "#5aa847" : "#8a8458");
        pm.set(x, y, c);
      }
    }
    sombreado(pm, 26, 30, 12, 20, "#e8ece8");
    pm.rect(28, 32, 8, 18, vivo ? rgb("#7fc66a") : rgb("#8a9278"));
  });
  return cacheViveiro;
}

let cacheComposteira = null;
export function spriteComposteira() {
  if (!cacheComposteira) cacheComposteira = par(22, 18, (pm, vivo) => {
    sombreado(pm, 1, 4, 20, 14, "#8a5a3a");
    for (let x = 1; x < 21; x += 5) pm.rect(x, 4, 1, 14, rgb("#6a4228"));
    pm.rect(0, 2, 22, 3, rgb("#a8794a"));
    if (vivo) for (let i = 0; i < 5; i++) pm.set(4 + i * 3, 1, rgb("#5aa847"));
  });
  return cacheComposteira;
}

// ---------------------------------------------------------------- Mobiliário
let cacheFonte = null;
export function spriteFonte() {
  if (cacheFonte) return cacheFonte;
  cacheFonte = par(44, 34, (pm, vivo) => {
    pm.elipse(22, 22, 21, 11, (x, y, nx, ny) => (ny < -0.6 ? rgb("#e2dccb") : ny > 0.6 ? rgb("#9a9488") : rgb("#c9c2b0")));
    pm.elipse(22, 21, 17, 8, (x, y, nx, ny) => (vivo ? (ny < -0.3 ? rgb("#7fd0f0") : rgb("#3fa2d6")) : rgb("#8a8270")));
    if (!vivo) for (let i = 0; i < 10; i++) pm.set(14 + i, 20 + (i % 3), rgb("#6a6050"));
    pm.rect(20, 6, 4, 16, rgb("#c9c2b0"));
    pm.rect(23, 6, 1, 16, rgb("#9a9488"));
    pm.elipse(22, 6, 6, 3, rgb("#e2dccb"));
  });
  return cacheFonte;
}
let cacheBanco = null;
export function spriteBanco() {
  if (!cacheBanco) cacheBanco = par(26, 16, (pm) => {
    pm.rect(1, 2, 24, 3, rgb("#a8794a"));
    pm.rect(1, 6, 24, 4, rgb("#c08a52"));
    pm.rect(1, 9, 24, 1, rgb("#7a5236"));
    pm.rect(3, 10, 2, 5, rgb("#4a4a50"));
    pm.rect(21, 10, 2, 5, rgb("#4a4a50"));
  });
  return cacheBanco;
}
let cachePoste = null;
export function spritesPoste() {
  if (cachePoste) return cachePoste;
  const d = (acesa) => unico(12, 44, (pm) => {
    pm.rect(5, 8, 2, 34, rgb("#4a4f58"));
    pm.rect(6, 8, 1, 34, rgb("#30343a"));
    pm.rect(3, 41, 6, 3, rgb("#3a3e46"));
    pm.rect(2, 2, 8, 6, rgb("#3a3e46"));
    pm.rect(3, 6, 6, 3, acesa ? rgb("#fff3a0") : rgb("#b8c0c8"));
    if (acesa) pm.rect(4, 7, 4, 1, rgb("#ffffff"));
  });
  cachePoste = { acesa: d(true), apagada: d(false) };
  return cachePoste;
}
let cacheTorneira = null;
export function spritesTorneira() {
  if (cacheTorneira) return cacheTorneira;
  const d = (consertada) => unico(14, 18, (pm) => {
    pm.rect(5, 0, 4, 12, rgb("#8a9098"));
    pm.rect(8, 0, 1, 12, rgb("#5a6068"));
    pm.rect(5, 6, 8, 3, rgb("#9aa0a8"));
    pm.rect(11, 9, 2, 2, rgb("#8a9098"));
    pm.rect(3, 3, 8, 2, consertada ? rgb("#45a545") : rgb("#d0443a"));
    if (consertada) pm.rect(9, 7, 3, 1, rgb("#cfe2ff"));
    pm.rect(4, 14, 6, 4, rgb("#5a6068"));
  });
  cacheTorneira = { vazando: d(false), consertada: d(true) };
  return cacheTorneira;
}
let cachePainel = null;
export function spritesPainel() {
  if (cachePainel) return cachePainel;
  cachePainel = {
    vazio: unico(30, 20, (pm) => {
      for (let x = 1; x < 29; x++) if (x % 3) { pm.set(x, 8, rgb("#f7f0da")); pm.set(x, 19, rgb("#f7f0da")); }
      for (let y = 8; y < 20; y++) if (y % 3) { pm.set(1, y, rgb("#f7f0da")); pm.set(28, y, rgb("#f7f0da")); }
      pm.rect(13, 12, 4, 4, rgb("#f4c64a"));
    }, false),
    pronto: unico(30, 24, (pm) => {
      pm.rect(6, 14, 2, 9, rgb("#5a6068"));
      pm.rect(22, 14, 2, 9, rgb("#5a6068"));
      for (let y = 2; y < 16; y++) for (let x = 1; x < 29; x++) {
        let c = rgb("#23396e");
        if (x % 7 === 1 || y % 5 === 2) c = rgb("#5a7ac0");
        if (y === 2 || x === 1) c = rgb("#9aa0a8");
        pm.set(x, y + Math.floor((x - 1) / 14), c);
      }
      pm.set(3, 4, rgb("#e6f0ff"));
      pm.set(4, 4, rgb("#e6f0ff"));
    }),
  };
  return cachePainel;
}
let cacheEspelho = null;
export function spriteEspelho() {
  if (!cacheEspelho) cacheEspelho = unico(26, 40, (pm) => {
    sombreado(pm, 0, 0, 26, 36, "#a8794a");
    pm.rect(3, 3, 20, 30, rgb("#bfe0ea"));
    pm.rect(4, 4, 2, 10, rgb("#eaf8fc"));
    pm.rect(5, 36, 3, 4, rgb("#7a5236"));
    pm.rect(18, 36, 3, 4, rgb("#7a5236"));
  });
  return cacheEspelho;
}
let cacheCerca = null;
export function spriteCerca() {
  if (!cacheCerca) cacheCerca = par(16, 14, (pm) => {
    pm.rect(0, 4, 16, 2, rgb("#c8a070"));
    pm.rect(0, 9, 16, 2, rgb("#c8a070"));
    pm.rect(2, 1, 3, 13, rgb("#b08858"));
    pm.rect(11, 1, 3, 13, rgb("#b08858"));
  });
  return cacheCerca;
}
let cachePlaca = null;
export function spritePlaca() {
  if (!cachePlaca) cachePlaca = par(18, 20, (pm) => {
    pm.rect(8, 10, 2, 10, rgb("#7a5236"));
    sombreado(pm, 1, 1, 16, 10, "#c8a070");
    pm.rect(4, 4, 10, 1, rgb("#5a4632"));
    pm.rect(4, 7, 7, 1, rgb("#5a4632"));
  });
  return cachePlaca;
}
let cachePedra = null;
export function spritePedra() {
  if (!cachePedra) cachePedra = par(14, 10, (pm) => pm.elipse(7, 6, 6, 4, (x, y, nx, ny) => (ny < -0.3 ? rgb("#b8b4a8") : nx > 0.4 ? rgb("#7a786e") : rgb("#9a978c"))));
  return cachePedra;
}

const cacheLixo = new Map();
export function iconeLixo(tipo) {
  if (cacheLixo.has(tipo)) return cacheLixo.get(tipo);
  const c = unico(12, 12, (pm) => {
    switch (tipo) {
      case "pet":
        pm.rect(4, 3, 4, 8, rgb("#9fd6ee")); pm.rect(5, 1, 2, 2, rgb("#3c6fcf")); pm.rect(4, 6, 4, 2, rgb("#d0443a")); pm.set(4, 4, rgb("#e6f6ff"));
        break;
      case "sacola":
        pm.rect(2, 4, 8, 7, rgb("#eeeeea")); pm.rect(3, 2, 1, 3, rgb("#eeeeea")); pm.rect(8, 2, 1, 3, rgb("#eeeeea")); pm.rect(4, 7, 4, 1, rgb("#c9c9c0"));
        break;
      case "lata":
        pm.rect(3, 3, 6, 8, rgb("#d0443a")); pm.rect(3, 2, 6, 1, rgb("#c9ced8")); pm.rect(3, 10, 6, 1, rgb("#9aa0a8")); pm.rect(4, 5, 4, 3, rgb("#f2efe6"));
        break;
      case "conserva":
        pm.rect(2, 4, 8, 7, rgb("#b8c0c8")); pm.rect(2, 6, 8, 3, rgb("#5aa847")); pm.rect(2, 4, 8, 1, rgb("#e6eaee"));
        break;
      case "jornal":
        pm.rect(1, 3, 10, 7, rgb("#e6e2d6")); pm.rect(2, 4, 4, 2, rgb("#5a5a5a")); for (let y = 7; y < 10; y += 1) pm.rect(2, y, 8, 1, y % 2 ? rgb("#9a9a96") : rgb("#e6e2d6"));
        break;
      case "caixa":
        pm.rect(1, 4, 10, 7, rgb("#c08a52")); pm.rect(1, 3, 10, 2, rgb("#d9a46a")); pm.rect(5, 3, 2, 8, rgb("#e8d0a0"));
        break;
      case "vidro":
        pm.rect(4, 4, 4, 7, rgb("#3c9a48")); pm.rect(5, 1, 2, 3, rgb("#3c9a48")); pm.set(4, 5, rgb("#9be0a0"));
        break;
      case "pote":
        pm.rect(3, 4, 6, 7, rgb("#cfeaf2")); pm.rect(3, 2, 6, 2, rgb("#d9a521")); pm.set(4, 5, rgb("#ffffff"));
        break;
      case "banana":
        pm.rect(3, 5, 6, 2, rgb("#f1d04b")); pm.set(2, 4, rgb("#f1d04b")); pm.set(9, 4, rgb("#f1d04b")); pm.rect(4, 7, 4, 2, rgb("#d9a93a")); pm.set(6, 9, rgb("#7a5236"));
        break;
      case "maca":
        pm.rect(4, 2, 4, 2, rgb("#d0443a")); pm.rect(5, 4, 2, 4, rgb("#f2e6c0")); pm.rect(4, 8, 4, 2, rgb("#d0443a")); pm.set(6, 1, rgb("#7a5236"));
        break;
    }
  });
  cacheLixo.set(tipo, c);
  return c;
}

// ---------------------------------------------------------------- Chão (tiles)
function corTile(t, x, y, vivo, mapa) {
  // devolve a cor do pixel (x,y) do mundo
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  const lx = x % T, ly = y % T;
  const h = hash(x, y, 1);
  switch (t) {
    case TILE.GRAMA:
    case TILE.MATA: {
      const n = ruido(x * 0.12, y * 0.12, 7);
      let c = n > 0.6 ? rgb("#62b84a") : n < 0.35 ? rgb("#4fa241") : rgb("#58ad45");
      if (h < 0.08) c = rgb("#3f8a37");
      else if (h > 0.94) c = rgb("#8ad064");
      if (vivo && hash(Math.floor(x / 3), Math.floor(y / 3), 9) < 0.018 && hash(x, y, 4) < 0.6) c = rgb(["#f06a8a", "#ffd34d", "#ffffff", "#b48cff"][Math.floor(hash(Math.floor(x / 3), Math.floor(y / 3), 2) * 4)]);
      return c;
    }
    case TILE.TERRA: {
      let c = rgb("#b98a5a");
      if (h < 0.12) c = rgb("#a07548");
      if (h > 0.93) c = rgb("#d4a674");
      return c;
    }
    case TILE.PEDRA: {
      const bx = (lx + (Math.floor(ly / 8) % 2) * 4) % 8;
      if (bx === 0 || ly % 8 === 0) return rgb("#8f8a7e");
      let c = rgb("#c4beb0");
      if (bx === 7 || ly % 8 === 7) c = rgb("#aaa496");
      if (h < 0.05) c = rgb("#b5af9f");
      return c;
    }
    case TILE.PISO: {
      const a = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
      let c = a ? rgb("#e2d3ae") : rgb("#d29b6e");
      if (lx % 8 === 0 || ly % 8 === 0) c = escurecer(c, 0.12);
      return c;
    }
    case TILE.RUA: {
      let c = h < 0.1 ? rgb("#4a4b52") : rgb("#55565e");
      // faixa central tracejada
      if (ty === 39 && ly === 0 && Math.floor(x / 8) % 2 === 0) c = rgb("#f4d04a");
      if ((ty === 38 && ly === 0) || (ty === 39 && ly === 15)) c = rgb("#6a6b72");
      return c;
    }
    case TILE.AGUA: {
      const w = Math.sin(x * 0.4 + Math.floor(y / 3) * 1.7);
      let c = rgb("#3a9ad0");
      if (w > 0.85 && ly % 3 === 0) c = rgb("#8fd3f0");
      if (ruido(x * 0.08, y * 0.15, 3) > 0.65) c = misturar(c, "#2a7ab8", 0.5);
      // borda
      const acima = mapa(tx, Math.floor((y - 1) / T));
      if (acima !== TILE.AGUA && acima !== TILE.PONTE && ly < 2) c = rgb("#2a6a9a");
      return c;
    }
    case TILE.PONTE: {
      let c = ly % 4 === 0 ? rgb("#7a5236") : rgb("#b08050");
      if (h < 0.06) c = rgb("#9a6a3a");
      if (lx === 0 || lx === 15) { const v = mapa(tx + (lx === 0 ? -1 : 1), ty); if (v !== TILE.PONTE) c = rgb("#6a4228"); }
      return c;
    }
    case TILE.AREIA: {
      let c = rgb("#dcc58e");
      if (h < 0.1) c = rgb("#c9b07a");
      if (h > 0.95) c = rgb("#efdcac");
      return c;
    }
    case TILE.CANTEIRO: {
      let c = ly % 8 < 2 ? rgb("#5a3c24") : rgb("#7a5234");
      if (h < 0.08) c = rgb("#8a6040");
      return c;
    }
  }
  return rgb("#ff00ff");
}

// Pinta o chão inteiro (as duas versões) em canvases grandes; feito uma vez no carregamento.
export function desenharChao(mapa, decorar) {
  const W = MW * T, H = MH * T;
  const mk = (vivo) => {
    const pm = new Pixmap(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = mapa(Math.floor(x / T), Math.floor(y / T));
        let c = corTile(t, x, y, vivo, mapa);
        // transição grama -> caminho: franja de grama
        if (t !== TILE.GRAMA && t !== TILE.MATA && t !== TILE.AGUA) {
          const ly = y % T, lx = x % T;
          const tx = Math.floor(x / T), ty = Math.floor(y / T);
          const g = (v) => v === TILE.GRAMA || v === TILE.MATA;
          if ((ly < 2 && g(mapa(tx, ty - 1)) && hash(x, 0, 5) < (ly === 0 ? 0.9 : 0.4)) ||
              (lx < 1 && g(mapa(tx - 1, ty)) && hash(0, y, 5) < 0.6) ||
              (lx > 14 && g(mapa(tx + 1, ty)) && hash(1, y, 5) < 0.6)) c = rgb("#4fa241");
          if (ly > 13 && g(mapa(tx, ty + 1)) && ly === 15) c = escurecer(c, 0.25);
        }
        const i = (y * W + x) * 4;
        pm.d[i] = c[0]; pm.d[i + 1] = c[1]; pm.d[i + 2] = c[2]; pm.d[i + 3] = 255;
      }
    }
    decorar(pm, vivo);
    return vivo ? pm : poluir(pm);
  };
  const viva = mk(true);
  const seca0 = mk(false);
  // manchas e rachaduras na versão poluída
  for (let k = 0; k < 260; k++) {
    const x = Math.floor(hash(k, 1, 77) * W), y = Math.floor(hash(k, 2, 77) * H);
    const t = mapa(Math.floor(x / T), Math.floor(y / T));
    if (t === TILE.AGUA) {
      for (let i = 0; i < 8; i++) seca0.set(x + i, y + (i % 2), [120, 110, 70, 140]); // óleo/espuma
      continue;
    }
    if (t === TILE.GRAMA || t === TILE.MATA) {
      seca0.elipse(x, y, 3 + hash(k, 3, 7) * 4, 2 + hash(k, 4, 7) * 2, [170, 150, 100, 150]); // grama seca
    } else if (t === TILE.RUA || t === TILE.PEDRA || t === TILE.PISO) {
      for (let i = 0; i < 7; i++) seca0.set(x + i, y + Math.round(Math.sin(i + k) * 1.5), [60, 55, 50, 200]);
    }
  }
  return { viva: viva.paraCanvas(), seca: seca0.paraCanvas() };
}

// ---------------------------------------------------------------- Mapa
export function criarMapa() {
  const m = new Uint8Array(MW * MH);
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < MW && y < MH) m[y * MW + x] = t; };
  const get = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH ? TILE.MATA : m[y * MW + x]);
  const ret = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };

  // rio (com margens de areia) e ponte
  const rioTopo = [];
  for (let x = 0; x < MW; x++) {
    const top = 12 + Math.round(Math.sin(x * 0.33) * 0.8);
    rioTopo[x] = top;
    set(x, top - 1, TILE.AREIA);
    for (let y = top; y <= top + 2; y++) set(x, y, TILE.AGUA);
    set(x, top + 3, TILE.AREIA);
  }
  for (let x = 18; x <= 21; x++) for (let y = 10; y <= 16; y++) if (get(x, y) === TILE.AGUA || get(x, y) === TILE.AREIA) set(x, y, TILE.PONTE);

  // caminho principal norte-sul
  ret(18, 3, 21, 9, TILE.TERRA);
  ret(18, 15, 21, 17, TILE.PEDRA);
  ret(18, 28, 21, 37, TILE.PEDRA);
  // praça
  ret(14, 18, 25, 28, TILE.PISO);
  // caminhos laterais
  ret(8, 22, 13, 23, TILE.PEDRA);
  ret(26, 22, 31, 23, TILE.PEDRA);
  ret(22, 7, 30, 8, TILE.TERRA);
  ret(9, 18, 12, 21, TILE.PEDRA); // ecoponto
  // horta
  for (let y = 26; y <= 30; y += 2) ret(3, y, 11, y, TILE.CANTEIRO);
  ret(2, 24, 12, 25, TILE.TERRA);
  // rua e calçadas
  ret(0, 37, MW - 1, 37, TILE.PEDRA);
  ret(0, 38, MW - 1, 39, TILE.RUA);
  ret(0, 40, MW - 1, 40, TILE.PEDRA);
  // calçadinhas das casas do sul
  for (const x of [6, 13, 26, 33]) ret(x - 1, 41, x, 47, TILE.PEDRA);
  ret(18, 41, 21, 47, TILE.PEDRA);
  // lago ao sul
  for (let y = 48; y <= 53; y++) for (let x = 25; x <= 35; x++) {
    const d = ((x - 30) / 5.6) ** 2 + ((y - 50.5) / 3) ** 2;
    if (d <= 1) set(x, y, TILE.AGUA);
    else if (d <= 1.45) set(x, y, TILE.AREIA);
  }
  // trilha ao sul
  ret(12, 48, 14, 52, TILE.TERRA);
  // mata nas bordas
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (x < 2 || x >= MW - 2 || y < 2 || y >= MH - 2) {
      if (get(x, y) !== TILE.AGUA) set(x, y, TILE.MATA);
    }
  }
  return { m, get, rioTopo };
}
