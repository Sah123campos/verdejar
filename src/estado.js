// Estado da fazenda: mapa base, terreno de cada lote, inventário, construções e progresso.
// Tudo que importa para continuar a partida fica num objeto simples salvo no aparelho.
import { LOTES, LOCAIS_MANDALA, RAIO_MANDALA, CONSTRUCOES, CULTURAS, nivelDe } from "./dados.js";
import { ler, gravar } from "./salvar.js";
import { hash } from "./pixel.js";

export const T = 16;
export const MW = 34;
export const MH = 44;
const CHAVE = "fazenda";

// Tipos do mapa base (não mudam durante o jogo)
export const BASE = { CAATINGA: 0, CHAO: 1, ESTRADA: 2, CAMPO: 3, AGUA: 4, AREIA: 5 };

// Árvores nativas: dão sombra, folhas secas e galhos.
export const ARVORES = [
  { x: 10, y: 4, tipo: "juazeiro" }, { x: 27, y: 4, tipo: "umbuzeiro" }, { x: 7.5, y: 18.5, tipo: "umbuzeiro" },
  { x: 28.5, y: 12, tipo: "juazeiro" }, { x: 4, y: 21.5, tipo: "juazeiro" }, { x: 16.5, y: 31.5, tipo: "umbuzeiro" },
  { x: 5, y: 39.5, tipo: "umbuzeiro" }, { x: 30.5, y: 22, tipo: "juazeiro" }, { x: 13, y: 38.5, tipo: "juazeiro" },
  { x: 30.5, y: 31.5, tipo: "umbuzeiro" },
];

// Construções fixas da propriedade
export const FIXOS = {
  casa: { x: 15, y: 3, w: 5, h: 4 },
  cisterna: { x: 21, y: 5, w: 2, h: 2 },
  banca: { x: 6, y: 6, w: 3, h: 2 },
  quadro: { x: 10, y: 7, w: 1, h: 1 },
  cacimba: { x: 5, y: 10, w: 1, h: 1 },
};

export function tipoBase(x, y) {
  if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) return BASE.CAATINGA;
  if (x >= 3 && x <= 4) return BASE.ESTRADA;
  if (y >= 9 && y <= 9 && x >= 3 && x <= 24) return BASE.ESTRADA;
  if (y >= 31 && y <= 32 && x >= 3 && x <= 30) return BASE.ESTRADA;
  if (y <= 8 && x >= 5 && x <= 30) return BASE.CHAO;
  // riacho seco ao longo da borda leste
  if (x >= 31) return (y * 7 + x) % 11 < 3 ? BASE.AREIA : BASE.CAMPO;
  return BASE.CAMPO;
}

export function loteDe(x, y) {
  for (const l of LOTES) if (x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1) return l.id;
  return -1;
}

export function naMandala(x, y, local) {
  const L = LOCAIS_MANDALA[local];
  if (!L) return null;
  const dx = x + 0.5 - L.cx, dy = y + 0.5 - L.cy;
  const d = Math.hypot(dx, dy);
  if (d > RAIO_MANDALA) return null;
  return { d, ang: Math.atan2(dy, dx) };
}

// Classifica um ponto da mandala: reservatório, caminho ou canteiro (anel k).
export function partesMandala(m, d, ang) {
  if (d < 1.6) return { tipo: "reservatorio" };
  const n = m.aneis || 3;
  const largura = (RAIO_MANDALA - 1.6) / n;
  const k = Math.min(n - 1, Math.floor((d - 1.6) / largura));
  const nc = m.caminhos || 4;
  let a = ang + Math.PI;
  const passo = (Math.PI * 2) / nc;
  const off = Math.abs(((a + passo / 2) % passo) - passo / 2);
  if (off * d < 0.45) return { tipo: "caminho", anel: k };
  return { tipo: "canteiro", anel: k };
}

export function chave(x, y) {
  return `${x},${y}`;
}

function novoTile(x, y, lote) {
  const h = hash(x, y, 51);
  let t = "mato";
  let f = 35 + Math.floor(h * 15);
  if (lote === 0 && x >= 9 && x <= 14 && y >= 13 && y <= 16) { t = "terra"; f = 55; }
  if (lote === 2 && y >= 24) f = 14; // solo cansado da baixada
  return { t, u: 30, f, c: null, h: 0, sec: 0, col: 0, pal: false, got: false, ult: null, morta: false, pedra: t === "mato" && h > 0.86 };
}

export function novoEstado() {
  const tiles = {};
  for (const l of LOTES) for (let y = l.y0; y <= l.y1; y++) for (let x = l.x0; x <= l.x1; x++) {
    if (ARVORES.some((a) => Math.floor(a.x) === x && Math.floor(a.y) === y)) continue;
    tiles[chave(x, y)] = novoTile(x, y, l.id);
  }
  return {
    v: 1,
    xp: 0,
    moedas: 150,
    horas: 7, // começa às 7h do dia 1
    chuva: 0, // horas restantes de chuva
    inv: { sem_coentro: 6, sem_alface: 3, sem_feijao: 4, palha: 2, folhas: 0, galhos: 0 },
    regador: { carga: 6, max: 6, tanque: 0 },
    cisterna: { agua: 300, cap: 400 },
    cacimba: { dia: 0, usos: 0 },
    calha: false,
    lotes: [0],
    tiles,
    construcoes: [],
    proxId: 1,
    casaCor: "#efe2c4",
    arvoresColeta: {},
    mandala: { etapa: 0, local: null, aneis: 3, caminhos: 4, irrig: null, agua: 0, cap: 300, limpos: 0 },
    sisteminha: { etapa: 0, plano: [] },
    missoes: { feitas: [], ativas: ["primeirosPassos"], passos: {} },
    pedidos: [],
    conquistas: [],
    stats: { colheitas: 0, vendas: 0, moedasGanhas: 0, aguaUsada: 0, aguaChuva: 0, colhidas: {}, compostoFeito: 0, ovos: 0, leite: 0, peixes: 0, plantasSecas: 0 },
    seca: { preparo: null, avaliada: -1 },
    jogador: { x: 17.5 * T, y: 8.6 * T, dir: "baixo" },
    tutorialVisto: false,
  };
}

export function carregar() {
  const s = ler(CHAVE);
  if (!s || s.v !== 1 || typeof s.tiles !== "object") return null;
  const base = novoEstado();
  const e = { ...base, ...s };
  for (const k of ["inv", "regador", "cisterna", "mandala", "sisteminha", "missoes", "stats", "seca", "jogador"]) e[k] = { ...base[k], ...(s[k] || {}) };
  if (!Array.isArray(e.construcoes)) e.construcoes = [];
  if (!Array.isArray(e.lotes)) e.lotes = [0];
  return e;
}

export function salvarEstado(e) {
  return gravar(CHAVE, e);
}
export function existeSave() {
  const s = ler(CHAVE);
  return !!(s && s.v === 1);
}
export function apagarSave() {
  gravar(CHAVE, null);
}

// ------------------------------------------------------------ Consultas úteis
export function nivel(e) {
  return nivelDe(e.xp);
}
export function tile(e, x, y) {
  return e.tiles[chave(x, y)] || null;
}
// O jogador pode mexer neste tile? (lote comprado ou canteiro da mandala pronto)
export function tileLiberado(e, x, y) {
  const t = tile(e, x, y);
  if (!t) return false;
  if (t.mandala) return e.mandala.etapa >= 1;
  return e.lotes.includes(loteDe(x, y));
}
export function construcaoEm(e, x, y) {
  for (const c of e.construcoes) {
    const d = CONSTRUCOES[c.tipo];
    if (x >= c.x && x < c.x + d.w && y >= c.y && y < c.y + d.h) return c;
  }
  return null;
}
export function fixoEm(x, y) {
  for (const [id, f] of Object.entries(FIXOS)) if (x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h) return id;
  return null;
}
export function arvoreEm(x, y) {
  return ARVORES.find((a) => Math.floor(a.x) === x && Math.floor(a.y) === y) || null;
}
export function qtd(e, id) {
  return e.inv[id] || 0;
}
export function dar(e, id, n = 1) {
  e.inv[id] = (e.inv[id] || 0) + n;
  if (e.inv[id] <= 0) delete e.inv[id];
}
export function tirar(e, id, n = 1) {
  if ((e.inv[id] || 0) < n) return false;
  e.inv[id] -= n;
  if (e.inv[id] <= 0) delete e.inv[id];
  return true;
}
export function culturasLiberadas(e) {
  const n = nivel(e);
  return Object.entries(CULTURAS).filter(([, c]) => c.nivel <= n).map(([id]) => id);
}
export function dia(e) {
  return Math.floor(e.horas / 24) + 1;
}
export function horaDoDia(e) {
  return e.horas % 24;
}
