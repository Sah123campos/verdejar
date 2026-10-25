// Arte do Raízes do Sertão, toda gerada por código em pixel art:
// chão (versões de chuva e de seca), solo, culturas em cada estágio, construções,
// árvores da caatinga, animais e ícones da interface.
import { Pixmap, rgb, misturar, escurecer, clarear, hash, ruido, criarCanvas } from "./pixel.js";
import { MW, MH, T, BASE, tipoBase } from "./estado.js";

function spr(w, h, fn, contorno = true) {
  const pm = new Pixmap(w, h);
  fn(pm);
  if (contorno) pm.contornar(0.55);
  return pm.paraCanvas();
}
const cache = new Map();
function guardado(chave, fn) {
  if (!cache.has(chave)) cache.set(chave, fn());
  return cache.get(chave);
}
const C = (h) => rgb(h);

// ---------------------------------------------------------------- Chão base
function corChao(tipo, x, y, chuva) {
  const h = hash(x, y, 2);
  const n = ruido(x * 0.09, y * 0.09, 4);
  switch (tipo) {
    case BASE.CAATINGA: {
      let c = chuva ? misturar("#7a9a4a", "#9aa85a", n) : misturar("#b09a6a", "#c4ad78", n);
      if (h < 0.1) c = escurecer(c, 0.2);
      if (h > 0.95) c = clarear(c, 0.15);
      return c;
    }
    case BASE.CHAO: {
      let c = misturar("#d4b48a", "#c9a678", n);
      if (h < 0.06) c = C("#b8946a");
      if (h > 0.97) c = C("#e6cfa6");
      return c;
    }
    case BASE.ESTRADA: {
      let c = misturar("#c9a070", "#b98e5e", n);
      const lx = x % T;
      if (lx === 4 || lx === 11) c = escurecer(c, 0.12);
      if (h < 0.05) c = C("#a07a50");
      return c;
    }
    case BASE.AREIA: return h < 0.1 ? C("#d8c08a") : C("#e6d4a0");
    case BASE.AGUA: return C("#3a9ad0");
    default: {
      // campo: verde na chuva, palha na seca
      let c = chuva ? misturar("#6fae4a", "#8cc25a", n) : misturar("#c7ad6e", "#d6bf82", n);
      if (h < 0.07) c = chuva ? C("#4f9a3c") : C("#a8905a");
      else if (h > 0.95) c = chuva ? C("#a6d870") : C("#e2cf98");
      if (chuva && hash(Math.floor(x / 3), Math.floor(y / 3), 8) < 0.012 && h < 0.5) c = C(["#f06a8a", "#ffd34d", "#ffffff", "#b48cff"][Math.floor(hash(x >> 2, y >> 2, 3) * 4)]);
      return c;
    }
  }
}

export function desenharChao() {
  const W = MW * T, H = MH * T;
  const mk = (chuva) => {
    const pm = new Pixmap(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const tipo = tipoBase(Math.floor(x / T), Math.floor(y / T));
      const c = corChao(tipo, x, y, chuva);
      const i = (y * W + x) * 4;
      pm.d[i] = c[0]; pm.d[i + 1] = c[1]; pm.d[i + 2] = c[2]; pm.d[i + 3] = 255;
    }
    return pm.paraCanvas();
  };
  return { chuva: mk(true), seca: mk(false) };
}

// ---------------------------------------------------------------- Solo
export function soloSprite(tipo, molhado, chuva) {
  return guardado(`solo:${tipo}:${molhado}:${chuva}`, () => spr(16, 16, (pm) => {
    if (tipo === "mato") {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const h = hash(x, y, 31);
        pm.set(x, y, chuva ? (h < 0.5 ? C("#5f9e40") : C("#4f8a36")) : h < 0.5 ? C("#b9a060") : C("#a68c52"));
      }
      for (let i = 0; i < 9; i++) {
        const x = Math.floor(hash(i, 1, 5) * 14) + 1, y = Math.floor(hash(i, 2, 5) * 12) + 3;
        const c = chuva ? C("#3c7a2c") : C("#8a7040");
        pm.set(x, y, c); pm.set(x, y - 1, c); pm.set(x - 1, y - 2, chuva ? C("#7fc050") : C("#cdb070")); pm.set(x + 1, y - 2, chuva ? C("#7fc050") : C("#cdb070"));
      }
      return;
    }
    const base = molhado ? C("#6a4630") : tipo === "preparada" ? C("#a8784c") : C("#b88a5c");
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let c = base;
      if (hash(x, y, 7) < 0.12) c = escurecer(c, 0.12);
      if (tipo === "preparada") {
        if (y % 5 === 1) c = escurecer(base, 0.28);
        else if (y % 5 === 2) c = clarear(base, 0.12);
      }
      if (x === 0 || y === 0) c = clarear(c, 0.08);
      if (x === 15 || y === 15) c = escurecer(c, 0.14);
      pm.set(x, y, c);
    }
  }, false));
}
export function pedraSprite() {
  return guardado("pedra", () => spr(12, 9, (pm) => pm.elipse(6, 5, 5.5, 3.8, (x, y, nx, ny) => (ny < -0.3 ? C("#c8c2b4") : nx > 0.4 ? C("#7f7a70") : C("#a49e92")))));
}
export function palhaSprite() {
  return guardado("palha", () => spr(16, 16, (pm) => {
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(hash(i, 3, 9) * 15), y = Math.floor(hash(i, 4, 9) * 15);
      const c = i % 3 ? C("#e6c36a") : C("#c9a24a");
      pm.set(x, y, c); pm.set(x + 1, y + (i % 2), c);
    }
  }, false));
}
export function gotejoSprite() {
  return guardado("gotejo", () => spr(16, 16, (pm) => {
    for (let x = 0; x < 16; x++) pm.set(x, 13, C("#2a2a30"));
    pm.set(7, 12, C("#2a2a30"));
    pm.set(7, 11, C("#7fd0f0"));
  }, false));
}
export function fertilSprite() {
  return guardado("fertil", () => spr(16, 16, (pm) => {
    for (let i = 0; i < 10; i++) pm.set(Math.floor(hash(i, 5, 2) * 16), Math.floor(hash(i, 6, 2) * 16), C("#3a2418"));
  }, false));
}

// ---------------------------------------------------------------- Culturas
const VERDE = { e: C("#2f7a34"), m: C("#47a043"), c: C("#73c650"), l: C("#b2e673") };

function folhaEm(pm, x, y, cor) {
  pm.set(x, y, cor);
  pm.set(x + 1, y, cor);
}

function desenharCultura(pm, id, est, H) {
  const b = H - 1; // linha do chão
  const s = [0.25, 0.55, 0.85, 1][est];
  switch (id) {
    case "coentro": {
      const n = [2, 4, 7, 9][est];
      for (let i = 0; i < n; i++) {
        const x = 3 + Math.floor(hash(i, 1, 11) * 10), alt = 2 + Math.floor(s * 6 * (0.6 + hash(i, 2, 11) * 0.5));
        for (let k = 0; k < alt; k++) pm.set(x + (k % 3 === 2 ? 1 : 0), b - k, k > alt - 3 ? VERDE.c : VERDE.m);
        pm.set(x - 1, b - alt + 1, VERDE.l);
        pm.set(x + 1, b - alt, VERDE.c);
        if (est === 3 && i % 3 === 0) pm.set(x, b - alt - 1, C("#ffffff"));
      }
      break;
    }
    case "alface": {
      const r = [1.5, 3, 4.5, 6][est];
      pm.elipse(8, b - r * 0.7, r, r * 0.75, (x, y, nx, ny) => (nx * nx + ny * ny < 0.25 ? C("#d8f0a0") : ny < -0.2 ? C("#b2e673") : nx > 0.4 ? C("#5aa847") : C("#8fd060")));
      break;
    }
    case "cebolinha": {
      const n = [2, 3, 5, 6][est];
      for (let i = 0; i < n; i++) {
        const x = 4 + i * 2, alt = Math.round((3 + s * 9) * (0.8 + hash(i, 3, 2) * 0.3));
        for (let k = 0; k < alt; k++) pm.set(x, b - k, k > alt - 2 ? VERDE.c : VERDE.m);
      }
      break;
    }
    case "feijao": {
      const r = [1.5, 3.5, 5, 6][est];
      pm.elipse(8, b - r * 0.8, r, r * 0.8, (x, y, nx, ny) => (hash(x, y, 4) < 0.2 ? VERDE.e : ny < -0.3 ? VERDE.c : VERDE.m));
      if (est === 3) for (const [x, y] of [[4, b - 3], [10, b - 5], [7, b - 7], [12, b - 2]]) { pm.set(x, y, C("#e2c47a")); pm.set(x, y + 1, C("#e2c47a")); pm.set(x, y + 2, C("#b8964a")); }
      break;
    }
    case "milho": {
      const alt = [4, 11, 20, 25][est];
      for (let k = 0; k < alt; k++) { pm.set(7, b - k, VERDE.m); pm.set(8, b - k, VERDE.e); }
      for (let k = 3; k < alt - 1; k += 4) {
        const lado = (k / 4) % 2 ? 1 : -1;
        for (let j = 1; j <= 4; j++) pm.set(8 + lado * j, b - k - (j > 2 ? 1 : 0) + (j > 3 ? 2 : 0), j > 2 ? VERDE.c : VERDE.m);
      }
      if (est >= 2) { pm.rect(9, b - alt + 8, 2, 5, est === 3 ? C("#f1d04b") : C("#9bd46a")); pm.set(9, b - alt + 7, C("#c9a36a")); }
      if (est === 3) { pm.set(7, b - alt, C("#e6c36a")); pm.set(6, b - alt + 1, C("#e6c36a")); pm.set(9, b - alt + 1, C("#e6c36a")); }
      break;
    }
    case "couve": {
      const n = [1, 3, 5, 6][est];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.3, r = 2 + s * 3;
        const cx = 8 + Math.cos(a) * r * 0.9, cy = b - 3 - s * 3 + Math.sin(a) * r * 0.5;
        pm.elipse(cx, cy, 1.5 + s * 1.8, 1.2 + s * 1.3, (x, y, nx) => (Math.abs(nx) < 0.15 ? C("#b8d8b0") : C("#3f7f5a")));
      }
      pm.rect(8, b - 2, 1, 3, C("#5a8a4a"));
      break;
    }
    case "tomate": {
      const alt = [3, 8, 12, 13][est];
      if (est >= 1) pm.rect(11, b - alt - 1, 1, alt + 1, C("#9a6a3a"));
      for (let k = 0; k < alt; k++) { pm.set(8 + (k % 4 < 2 ? 0 : 1), b - k, VERDE.m); if (k % 3 === 0) { pm.set(6, b - k, VERDE.c); pm.set(10, b - k - 1, VERDE.c); } }
      if (est >= 2) for (const [x, y] of [[6, b - 4], [9, b - 7], [7, b - 10]]) { const c = est === 3 ? C("#d0443a") : C("#8fc050"); pm.rect(x, y, 2, 2, c); pm.set(x, y, clarear(c, 0.4)); }
      break;
    }
    case "abobora": case "melancia": {
      const r = [1.5, 4, 6, 7][est];
      for (let i = 0; i < 5 * s + 1; i++) {
        const x = 8 + Math.round(Math.cos(i * 1.7) * r), y = b - 2 + Math.round(Math.sin(i * 1.7) * r * 0.4);
        pm.elipse(x, y - 1, 1.6, 1.3, i % 2 ? VERDE.m : VERDE.c);
      }
      if (est >= 2) {
        const big = est === 3;
        if (id === "abobora") pm.elipse(9, b - 3, big ? 4.2 : 2.2, big ? 3.2 : 1.8, (x, y, nx) => (big ? (Math.abs(nx) < 0.15 || Math.abs(nx - 0.55) < 0.12 ? C("#c96a1e") : C("#ee8a2e")) : C("#8fc050")));
        else pm.elipse(9, b - 3, big ? 4.8 : 2.4, big ? 3.2 : 1.8, (x, y) => (big && (x + Math.floor(y / 2)) % 3 === 0 ? C("#2a6a30") : C("#5aa847")));
        if (big) pm.set(9, b - 7, C("#7a5236"));
      }
      break;
    }
    case "mandioca": {
      const alt = [4, 10, 17, 21][est];
      for (let k = 0; k < alt; k++) { pm.set(7, b - k, C("#9a7a5a")); if (k > alt * 0.4) pm.set(9, b - k + 2, C("#9a7a5a")); }
      for (const [cx, cy] of [[7, b - alt], [9, b - alt + 3], [5, b - alt + 5]].slice(0, est + 1)) {
        for (let a = 0; a < 5; a++) {
          const an = -Math.PI / 2 + (a - 2) * 0.6;
          for (let r = 1; r <= 3; r++) pm.set(cx + Math.round(Math.cos(an) * r), cy + Math.round(Math.sin(an) * r * 0.8) + 2, r === 3 ? VERDE.c : VERDE.m);
        }
      }
      break;
    }
    case "palma": {
      const pads = [[8, b - 3, 2.2, 3]];
      if (est >= 1) pads.push([5, b - 8, 2, 2.8]);
      if (est >= 2) pads.push([11, b - 8, 2, 2.8], [8, b - 12, 1.8, 2.6]);
      if (est >= 3) pads.push([4, b - 13, 1.6, 2.4], [12, b - 13, 1.6, 2.4]);
      for (const [x, y, rx, ry] of pads) pm.elipse(x, y, rx, ry, (px, py, nx, ny) => (hash(px, py, 6) < 0.12 ? C("#e8e8c0") : nx > 0.4 ? C("#4f8a36") : ny < -0.3 ? C("#9ccc68") : C("#7fb04a")));
      if (est === 3) for (const [x, y] of [[8, b - 15], [4, b - 16], [12, b - 16]]) pm.set(x, y, C("#d0443a"));
      break;
    }
    case "acerola": {
      const alt = [5, 12, 20, 22][est];
      for (let k = 0; k < Math.min(alt, 10); k++) { pm.set(7, b - k, C("#7a5236")); pm.set(8, b - k, C("#5a3a22")); }
      const r = [1.5, 3.5, 6, 6.5][est];
      pm.elipse(8, b - alt + r, r, r * 0.85, (x, y, nx, ny) => (ny < -0.3 ? VERDE.c : nx > 0.4 ? VERDE.e : VERDE.m));
      if (est === 3) for (let i = 0; i < 9; i++) pm.set(3 + Math.floor(hash(i, 1, 7) * 10), b - alt + 2 + Math.floor(hash(i, 2, 7) * 9), C("#e2453c"));
      break;
    }
  }
}

export const ALTURA_CULTURA = { milho: 28, mandioca: 24, acerola: 26, palma: 18, tomate: 16 };
export function culturaSprite(id, est, estado = "ok") {
  return guardado(`cult:${id}:${est}:${estado}`, () => {
    const H = ALTURA_CULTURA[id] || 16;
    const pm = new Pixmap(16, H);
    if (estado === "morta") {
      const b = H - 1;
      for (let k = 0; k < Math.min(H - 4, 8 + est * 3); k++) pm.set(8 + (k % 5 === 4 ? 1 : 0), b - k, C("#8a6a40"));
      for (let k = 2; k < 8 + est * 3; k += 3) { pm.set(6, b - k, C("#a8885a")); pm.set(10, b - k - 1, C("#a8885a")); }
    } else desenharCultura(pm, id, est, H);
    if (estado === "murcha") {
      for (let y = 0; y < H; y++) for (let x = 0; x < 16; x++) {
        const c = pm.get(x, y);
        if (c[3]) pm.set(x, y, misturar(c, [196, 160, 80, 255], 0.55));
      }
    }
    pm.contornar(0.5);
    return pm.paraCanvas();
  });
}

// ---------------------------------------------------------------- Árvores da caatinga e decoração
function copa(pm, cx, cy, rx, ry, pal, s, rala = 0) {
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    const d = nx * nx + ny * ny + (hash(x, y, s) - 0.5) * 0.3;
    if (d > 1) continue;
    if (rala && hash(x, y, s + 4) < rala) continue;
    const n = ruido(x * 0.5, y * 0.5, s);
    let i = 1;
    if (ny < -0.35) i = 2;
    if (ny > 0.35 || nx > 0.6) i = 0;
    if (n > 0.7) i = Math.min(3, i + 1);
    pm.set(x, y, pal[i]);
  }
}
export function arvoreSprite(tipo, chuva) {
  return guardado(`arv:${tipo}:${chuva}`, () => spr(40, 44, (pm) => {
    const tr = C("#7a5a40");
    for (let y = 22; y < 43; y++) { pm.set(19, y, clarear(tr, 0.15)); pm.set(20, y, tr); pm.set(21, y, escurecer(tr, 0.3)); }
    // galhos
    for (let k = 0; k < 8; k++) { pm.set(18 - k, 24 - k, tr); pm.set(22 + k, 23 - k, tr); }
    const verde = [C("#2f6a30"), C("#3f8a3c"), C("#6cb04a"), C("#a6d870")];
    if (tipo === "juazeiro") copa(pm, 20, 15, 17, 13, verde, 3); // o juazeiro fica verde mesmo na seca
    else if (chuva) copa(pm, 20, 14, 18, 11, verde, 9);
    else {
      // umbuzeiro perde as folhas na seca: só galhos
      for (let k = 0; k < 14; k++) {
        const a = -Math.PI / 2 + (hash(k, 1, 3) - 0.5) * 2.6;
        let x = 20, y = 22;
        for (let r = 0; r < 12; r++) { x += Math.cos(a) * 1; y += Math.sin(a) * 0.8; pm.set(Math.round(x), Math.round(y), r > 8 ? C("#a08060") : tr); }
      }
      copa(pm, 20, 14, 18, 11, [C("#8a8a50"), C("#a0a060"), C("#b8b070"), C("#c8c080")], 9, 0.85);
    }
  }));
}
export function cactoSprite(v) {
  return guardado(`cacto:${v}`, () => spr(16, 26, (pm) => {
    const c = C("#4f8a46"), cl = C("#7fb86a"), ce = C("#2f5a30");
    if (v === 0) {
      // mandacaru
      pm.rect(6, 4, 4, 22, c); pm.rect(6, 4, 1, 22, cl); pm.rect(9, 4, 1, 22, ce);
      pm.rect(1, 10, 3, 8, c); pm.rect(1, 16, 5, 2, c); pm.rect(12, 7, 3, 9, c); pm.rect(10, 14, 4, 2, c);
      pm.set(7, 3, C("#ffffff")); pm.set(8, 3, C("#f06a8a"));
    } else {
      // xique-xique baixo
      for (let i = 0; i < 4; i++) { const x = 2 + i * 3, h = 8 + (i % 2) * 5; pm.rect(x, 26 - h, 2, h, i % 2 ? c : cl); pm.set(x + 1, 26 - h, ce); }
    }
  }));
}

// ---------------------------------------------------------------- Construções
function parede(pm, x0, y0, w, h, cor) {
  const c = C(cor);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let k = c;
    if (x === w - 1) k = escurecer(c, 0.2);
    if (hash(x0 + x, y0 + y, 4) < 0.05) k = escurecer(c, 0.06);
    pm.set(x0 + x, y0 + y, k);
  }
}
function telhado(pm, x0, y0, w, h, cor, mansarda = true) {
  const c = C(cor);
  for (let y = 0; y < h; y++) {
    const m = mansarda ? Math.max(0, Math.floor((h - y) / 2.5) - 1) : 0;
    for (let x = m; x < w - m; x++) {
      let k = y % 4 === 0 ? escurecer(c, 0.2) : (x + (Math.floor(y / 4) % 2) * 3) % 6 === 0 ? escurecer(c, 0.1) : c;
      if (y < 2) k = clarear(c, 0.2);
      pm.set(x0 + x, y0 + y, k);
    }
  }
  pm.rect(x0, y0 + h, w, 2, escurecer(c, 0.35));
}
function janela(pm, x, y, w, h, acesa) {
  pm.rect(x, y, w, h, C("#5a4632"));
  pm.rect(x + 1, y + 1, w - 2, h - 2, acesa ? C("#ffe37a") : C("#8fc6de"));
  pm.rect(x + 1, y + Math.floor(h / 2), w - 2, 1, C("#5a4632"));
}
export function casaSprite(cor, calha, noite) {
  return guardado(`casa:${cor}:${calha}:${noite}`, () => spr(84, 82, (pm) => {
    parede(pm, 4, 34, 76, 46, cor);
    telhado(pm, 0, 4, 84, 30, "#b5533a");
    if (calha) { pm.rect(0, 36, 84, 2, C("#9aa0a8")); pm.rect(80, 36, 3, 30, C("#9aa0a8")); }
    pm.rect(36, 52, 12, 28, C("#7a4a2e")); pm.rect(37, 53, 10, 26, C("#8f5a36")); pm.set(45, 66, C("#e8c860"));
    janela(pm, 12, 46, 14, 12, noite); janela(pm, 58, 46, 14, 12, noite);
    // varanda e vasos
    pm.rect(4, 78, 76, 2, C("#a8916e"));
    for (const x of [8, 28, 52, 72]) { pm.rect(x, 74, 4, 4, C("#b5653a")); pm.set(x + 1, 73, C("#5aa847")); pm.set(x + 2, 72, C("#f06a8a")); }
  }));
}
export function cisternaSprite(nivel) {
  return guardado(`cist:${Math.round(nivel * 4)}`, () => spr(34, 40, (pm) => {
    // corpo cilíndrico
    for (let y = 12; y < 38; y++) for (let x = 2; x < 32; x++) {
      const nx = (x - 17) / 15;
      let c = C("#e4ddd0");
      if (nx > 0.55) c = C("#b8b0a2");
      else if (nx < -0.6) c = C("#f4efe6");
      if (y % 6 === 0) c = escurecer(c, 0.06);
      pm.set(x, y, c);
    }
    pm.elipse(17, 12, 15, 5, C("#cfc8ba"));
    pm.elipse(17, 12, 12, 3.6, C("#9a9488"));
    pm.rect(14, 6, 6, 4, C("#9a9488"));
    // indicador de nível
    pm.rect(26, 16, 3, 18, C("#3a3e46"));
    const h = Math.round(16 * nivel);
    pm.rect(27, 33 - h, 1, h, C("#5ab4e8"));
  }));
}
export function bancaSprite() {
  return guardado("banca", () => spr(50, 42, (pm) => {
    for (let x = 0; x < 50; x++) for (let y = 0; y < 10; y++) pm.set(x, y, Math.floor(x / 6) % 2 ? C("#f6e27a") : C("#d0443a"));
    for (let x = 0; x < 50; x += 3) pm.set(x + 1, 10, Math.floor(x / 6) % 2 ? C("#f6e27a") : C("#d0443a"));
    pm.rect(2, 10, 2, 30, C("#7a5236")); pm.rect(46, 10, 2, 30, C("#7a5236"));
    pm.rect(0, 26, 50, 8, C("#a8794a")); pm.rect(0, 26, 50, 2, C("#c8995a"));
    // produtos
    const cores = ["#d0443a", "#f1d04b", "#5aa847", "#ee8a2e", "#9bd46a", "#3c9a48"];
    for (let i = 0; i < 6; i++) pm.elipse(6 + i * 7.5, 24, 3, 2.4, C(cores[i]));
  }));
}
export function cacimbaSprite() {
  return guardado("cacimba", () => spr(20, 22, (pm) => {
    pm.elipse(10, 15, 9, 5.5, (x, y, nx, ny) => (ny < -0.2 ? C("#c8c2b4") : C("#9a948a")));
    pm.elipse(10, 14.5, 6.5, 3.4, (x, y, nx, ny) => (ny < -0.3 ? C("#8fd3f0") : C("#3a8ac0")));
    pm.rect(2, 2, 2, 13, C("#7a5236")); pm.rect(16, 2, 2, 13, C("#7a5236"));
    pm.rect(1, 1, 18, 2, C("#8a6a40"));
    pm.rect(9, 3, 1, 8, C("#c8b890"));
    pm.rect(8, 10, 3, 3, C("#9aa0a8"));
  }));
}
export function quadroSprite() {
  return guardado("quadro", () => spr(18, 28, (pm) => {
    pm.rect(3, 14, 2, 14, C("#7a5236")); pm.rect(13, 14, 2, 14, C("#7a5236"));
    pm.rect(0, 2, 18, 14, C("#a8794a")); pm.rect(1, 3, 16, 12, C("#c8a070"));
    for (const [x, y, c] of [[3, 4, "#f7f0da"], [9, 5, "#fff3c4"], [5, 9, "#f7f0da"]]) { pm.rect(x, y, 5, 5, C(c)); pm.set(x + 2, y, C("#d0443a")); }
  }));
}
export function composteiraSprite(p) {
  const massa = p ? Object.values(p.mat).reduce((a, b) => a + b, 0) : 0;
  const nivel = Math.min(3, Math.ceil(massa / 5));
  const fase = !p || massa === 0 ? 0 : p.pronto ? 3 : p.prog > 60 ? 2 : 1;
  return guardado(`comp:${nivel}:${fase}`, () => spr(34, 32, (pm) => {
    // monte de material
    if (nivel > 0) {
      const topo = 26 - nivel * 5;
      for (let y = topo; y < 29; y++) for (let x = 5; x < 29; x++) {
        const d = Math.abs(x - 17) / 12 + (y - topo) / -30;
        if (d > 1 - (y - topo) / 20) continue;
        let c;
        if (fase === 3) c = hash(x, y, 2) < 0.3 ? C("#2a1a10") : C("#3e2818");
        else if (fase === 2) c = hash(x, y, 2) < 0.4 ? C("#4a3020") : C("#6a4a2e");
        else c = (y + Math.floor(x / 5)) % 4 < 2 ? C("#c9a24a") : hash(x, y, 1) < 0.5 ? C("#5aa847") : C("#a07040");
        pm.set(x, y, c);
      }
    }
    // cercado de galhos e varas
    const v = C("#8a6a40");
    for (let x = 2; x < 32; x += 4) pm.rect(x, 12, 2, 18, v);
    for (const y of [15, 22, 28]) pm.rect(1, y, 32, 1, escurecer(v, 0.15));
  }));
}
export function galinheiroSprite() {
  return guardado("galinheiro", () => spr(50, 50, (pm) => {
    // cerca
    for (let x = 1; x < 49; x += 4) pm.rect(x, 18, 1, 30, C("#a8794a"));
    for (const y of [22, 34, 46]) pm.rect(1, y, 48, 1, C("#c8995a"));
    // casinha
    parede(pm, 22, 10, 22, 18, "#e8d0a0");
    telhado(pm, 20, 0, 26, 10, "#b5533a", false);
    pm.rect(30, 18, 6, 10, C("#3a2a20"));
    // comedouro e bebedouro
    pm.rect(6, 40, 8, 3, C("#9a9a96")); pm.rect(30, 40, 8, 3, C("#5ab4e8"));
  }));
}
export function cercadoSprite() {
  return guardado("cercado", () => spr(66, 50, (pm) => {
    for (let x = 1; x < 65; x += 5) pm.rect(x, 10, 2, 38, C("#8a6a40"));
    for (const y of [14, 26, 38, 46]) pm.rect(1, y, 64, 1, C("#a8794a"));
    parede(pm, 42, 6, 20, 14, "#c8a070");
    telhado(pm, 40, 0, 24, 6, "#7a5236", false);
    pm.rect(8, 40, 12, 4, C("#a8794a")); pm.rect(9, 40, 10, 2, C("#7fb04a"));
    pm.rect(28, 40, 8, 4, C("#5ab4e8"));
  }));
}
export function tanqueSprite(nivel, peixes) {
  return guardado(`tanque:${Math.round(nivel / 25)}:${peixes ? 1 : 0}`, () => spr(34, 30, (pm) => {
    pm.elipse(17, 17, 16, 11, C("#7a7a80"));
    pm.elipse(17, 16, 14, 9, C("#4a4a50"));
    if (nivel > 5) pm.elipse(17, 16 + (1 - nivel / 100) * 3, 13 * (0.5 + nivel / 200), 8 * (0.5 + nivel / 200), (x, y, nx, ny) => (ny < -0.4 ? C("#7fc4c0") : C("#3a8a8a")));
    if (peixes) for (const [x, y] of [[12, 15], [20, 18], [16, 13], [23, 14]]) { pm.set(x, y, C("#c8d0d8")); pm.set(x + 1, y, C("#9aa0a8")); }
    pm.rect(30, 6, 2, 14, C("#5a6068")); pm.rect(26, 6, 6, 2, C("#5a6068"));
  }));
}
export function minhocarioSprite() {
  return guardado("minhoc", () => spr(18, 18, (pm) => {
    pm.rect(1, 6, 16, 11, C("#8a5a3a")); pm.rect(1, 4, 16, 3, C("#a8794a"));
    for (let x = 3; x < 16; x += 4) pm.rect(x, 8, 2, 8, C("#6a4228"));
    pm.set(6, 3, C("#e08a8a")); pm.set(7, 3, C("#e08a8a")); pm.set(8, 2, C("#e08a8a"));
  }));
}
export function oficinaSprite() {
  return guardado("oficina", () => spr(34, 38, (pm) => {
    parede(pm, 2, 14, 30, 22, "#c8a070");
    telhado(pm, 0, 2, 34, 12, "#6a6f78", false);
    pm.rect(10, 22, 14, 14, C("#4a3a2e"));
    pm.rect(13, 25, 2, 8, C("#9aa0a8")); pm.rect(12, 25, 4, 2, C("#9aa0a8"));
    pm.rect(19, 26, 1, 8, C("#8a6a40")); pm.rect(17, 25, 5, 2, C("#9aa0a8"));
  }));
}
export function floresSprite() {
  return guardado("flores", () => spr(16, 14, (pm) => {
    pm.rect(1, 10, 14, 4, C("#8a5a3a"));
    for (let i = 0; i < 5; i++) { const x = 2 + i * 3; pm.rect(x, 5, 1, 5, C("#47a043")); pm.set(x, 4, C(["#f06a8a", "#ffd34d", "#b48cff", "#ffffff", "#ee8a2e"][i])); pm.set(x - 1, 4, C("#ffd34d")); }
  }));
}
export function bancoSprite() {
  return guardado("banco", () => spr(16, 12, (pm) => { pm.rect(0, 2, 16, 3, C("#a8794a")); pm.rect(0, 6, 16, 2, C("#c08a52")); pm.rect(2, 8, 2, 4, C("#7a5236")); pm.rect(12, 8, 2, 4, C("#7a5236")); }));
}
export function reservatorioSprite(cheio) {
  return guardado(`res:${Math.round(cheio * 4)}`, () => spr(54, 54, (pm) => {
    pm.elipse(27, 27, 26, 26, (x, y, nx, ny) => (nx * nx + ny * ny > 0.72 ? (ny < 0 ? C("#c8c2b4") : C("#9a948a")) : cheio > 0.05 ? (ny < -0.3 ? C("#8fd3f0") : C("#3a9ad0")) : C("#8a7a60")));
  }, false));
}

// ---------------------------------------------------------------- Animais
export function galinhaSprite(q, cor = "#f2efe6") {
  return guardado(`gal:${q}:${cor}`, () => spr(10, 10, (pm) => {
    const c = C(cor);
    pm.elipse(4.5, 5.5, 3.5, 2.8, c);
    pm.rect(6, 1 + (q ? 1 : 0), 3, 3, c);
    pm.set(9, 2 + (q ? 1 : 0), C("#f1a030"));
    pm.set(7, 0 + (q ? 1 : 0), C("#d0443a"));
    pm.set(7, 2 + (q ? 1 : 0), C("#1a1a1a"));
    pm.set(3, 8, C("#f1a030")); pm.set(5, 8, C("#f1a030"));
  }));
}
export function cabraSprite(q) {
  return guardado(`cabra:${q}`, () => spr(18, 15, (pm) => {
    const c = C("#e8dcc0"), m = C("#8a6a40");
    pm.rect(3, 5, 10, 5, c);
    pm.rect(3, 5, 4, 3, m);
    pm.rect(12, 2, 4, 4, c);
    pm.set(13, 1, C("#5a4a3a")); pm.set(15, 1, C("#5a4a3a"));
    pm.set(15, 3, C("#1a1a1a"));
    pm.set(14, 6, C("#c8b890"));
    for (const x of [4, 6, 10, 12]) pm.rect(x + (q && x % 4 === 0 ? 1 : 0), 10, 1, 4, m);
  }));
}

// ---------------------------------------------------------------- Ícones (12x12)
export function icone(id) {
  return guardado(`ic:${id}`, () => {
    const pm = new Pixmap(12, 12);
    desenharIcone(pm, id);
    pm.contornar(0.6);
    return pm.paraCanvas();
  });
}
function saco(pm, cor, rotulo) {
  pm.rect(2, 3, 8, 8, C(cor)); pm.rect(3, 2, 6, 1, C(cor)); pm.rect(4, 1, 4, 1, escurecer(C(cor), 0.3));
  if (rotulo) pm.rect(4, 6, 4, 3, C(rotulo));
}
function desenharIcone(pm, id) {
  if (id.startsWith("sem_")) {
    const cult = id.slice(4);
    pm.rect(2, 1, 8, 10, C("#f2e6c0"));
    pm.rect(2, 1, 8, 2, C("#c9a36a"));
    const cores = { coentro: "#5aa847", alface: "#9bd46a", feijao: "#c9a36a", cebolinha: "#3f9a46", milho: "#f1d04b", couve: "#2f7a34", tomate: "#d0443a", abobora: "#ee8a2e", melancia: "#3c9a48", mandioca: "#d9b884", palma: "#7fb04a", acerola: "#e2453c" };
    pm.elipse(6, 7, 2.4, 2.4, C(cores[cult] || "#5aa847"));
    return;
  }
  switch (id) {
    case "coentro": case "cebolinha":
      for (let i = 0; i < 4; i++) pm.rect(3 + i * 2, 2 + (i % 2), 1, 7, C(id === "coentro" ? "#5aa847" : "#3f9a46"));
      pm.rect(3, 8, 7, 2, C("#d9b884"));
      if (id === "coentro") for (let i = 0; i < 4; i++) pm.set(2 + i * 2, 2 + (i % 2), C("#9bd46a"));
      break;
    case "alface": pm.elipse(6, 6, 5, 4.5, (x, y, nx, ny) => (nx * nx + ny * ny < 0.3 ? C("#d8f0a0") : C("#8fd060"))); break;
    case "couve": pm.elipse(6, 5, 4.5, 4, C("#3f7f5a")); pm.rect(6, 2, 1, 8, C("#b8d8b0")); break;
    case "feijao": for (let i = 0; i < 3; i++) { pm.rect(2 + i * 3, 2, 2, 8, C("#e2c47a")); pm.set(2 + i * 3, 4, C("#8a5a3a")); pm.set(2 + i * 3, 7, C("#8a5a3a")); } break;
    case "milho": pm.rect(4, 1, 4, 9, C("#f1d04b")); for (let y = 2; y < 10; y += 2) pm.rect(4, y, 4, 1, C("#d9a93a")); pm.rect(2, 4, 2, 7, C("#7fb04a")); pm.rect(8, 5, 2, 6, C("#7fb04a")); break;
    case "tomate": pm.elipse(6, 7, 4.5, 4, (x, y, nx, ny) => (ny < -0.3 && nx < 0 ? C("#f08a7a") : C("#d0443a"))); pm.rect(5, 2, 3, 2, C("#47a043")); break;
    case "abobora": pm.elipse(6, 7, 5, 4, (x, y, nx) => (Math.abs(nx) < 0.15 ? C("#c96a1e") : C("#ee8a2e"))); pm.rect(6, 2, 1, 2, C("#7a5236")); break;
    case "melancia": pm.elipse(6, 7, 5, 4, (x, y, nx, ny) => (ny < -0.1 ? C("#e2453c") : ny < 0.4 ? C("#f2efe6") : C("#3c9a48"))); pm.set(4, 5, C("#1a1a1a")); pm.set(7, 5, C("#1a1a1a")); break;
    case "mandioca": for (let i = 0; i < 9; i++) pm.rect(2 + i, 3 + Math.floor(i / 2), 2, 3, C(i % 3 ? "#8a5a3a" : "#a8794a")); break;
    case "palma": pm.elipse(6, 6, 3.5, 5, (x, y) => (hash(x, y, 3) < 0.15 ? C("#e8e8c0") : C("#7fb04a"))); pm.set(6, 0, C("#d0443a")); break;
    case "acerola": for (const [x, y] of [[4, 6], [7, 7], [5, 9]]) pm.elipse(x, y, 2, 2, C("#e2453c")); pm.rect(5, 2, 1, 4, C("#47a043")); break;
    case "ovo": pm.elipse(6, 6.5, 3.5, 4.5, (x, y, nx, ny) => (ny < -0.3 && nx < 0 ? C("#ffffff") : C("#f2e6c8"))); break;
    case "leite": pm.rect(4, 3, 4, 8, C("#f7f7f2")); pm.rect(5, 1, 2, 2, C("#9aa0a8")); pm.rect(4, 6, 4, 2, C("#3c6fcf")); break;
    case "peixe": pm.elipse(5, 6, 4, 2.6, C("#9aa8b8")); pm.rect(9, 4, 2, 5, C("#7a8898")); pm.set(3, 5, C("#1a1a1a")); break;
    case "composto": saco(pm, "#8a6a40", "#3e2818"); break;
    case "humus": saco(pm, "#7a5236", "#2a1a10"); pm.set(5, 7, C("#e08a8a")); pm.set(6, 7, C("#e08a8a")); break;
    case "adubo": saco(pm, "#3c6fcf", "#f2efe6"); break;
    case "racao": saco(pm, "#d9a93a", "#f2efe6"); break;
    case "palha": for (let i = 0; i < 6; i++) pm.rect(2 + i, 2 + (i % 2), 1, 9, C(i % 2 ? "#e6c36a" : "#c9a24a")); pm.rect(1, 6, 10, 1, C("#8a6a40")); break;
    case "folhas": for (const [x, y] of [[4, 4], [7, 6], [4, 8]]) pm.elipse(x, y, 2.5, 1.6, C("#b07a3a")); break;
    case "galhos": for (let i = 0; i < 9; i++) { pm.set(1 + i, 8 - Math.floor(i / 2), C("#8a6a40")); pm.set(2 + i, 10 - Math.floor(i / 3), C("#6a4a2e")); } break;
    case "restos": for (const [x, y, c] of [[3, 6, "#5aa847"], [7, 5, "#9bd46a"], [5, 8, "#ee8a2e"], [8, 8, "#3f9a46"]]) pm.elipse(x, y, 2, 1.5, C(c)); break;
    case "frutas": pm.elipse(4, 6, 2.5, 2, C("#f1d04b")); pm.elipse(8, 7, 2.5, 2, C("#ee8a2e")); break;
    case "esterco": pm.elipse(6, 8, 4.5, 2.5, C("#6a4a2e")); pm.elipse(6, 6, 3, 2, C("#7a5236")); break;
    case "kitGotejo": pm.elipse(6, 6, 4.5, 4.5, C("#2a2a30")); pm.elipse(6, 6, 2.5, 2.5, C("#5a5a62")); pm.set(10, 10, C("#7fd0f0")); break;
    case "alevinos": pm.rect(2, 2, 8, 9, C("#cfeaf2")); for (const [x, y] of [[4, 5], [6, 8], [7, 4]]) pm.rect(x, y, 2, 1, C("#7a8898")); break;
    case "moeda": pm.elipse(6, 6, 4.5, 4.5, (x, y, nx, ny) => (ny < -0.3 && nx < 0 ? C("#fff3a0") : C("#f4c64a"))); pm.rect(5, 4, 2, 4, C("#c99a20")); break;
    case "agua": pm.elipse(6, 7.5, 3.5, 3.5, C("#4aa8e0")); pm.rect(5, 2, 2, 3, C("#4aa8e0")); pm.set(5, 6, C("#cfeeff")); break;
    case "xp": pm.rect(5, 1, 2, 10, C("#f4c64a")); pm.rect(1, 5, 10, 2, C("#f4c64a")); pm.rect(3, 3, 6, 6, C("#ffe37a")); break;
    // ferramentas
    case "mao": pm.rect(3, 4, 6, 6, C("#e8b48a")); for (let i = 0; i < 4; i++) pm.rect(3 + i + (i > 0 ? i : 0) - i, 1 + (i === 0 ? 2 : 0), 1, 4, C("#e8b48a")); pm.rect(3, 1, 1, 4, C("#e8b48a")); pm.rect(5, 0, 1, 5, C("#e8b48a")); pm.rect(7, 1, 1, 4, C("#e8b48a")); pm.rect(9, 5, 2, 2, C("#e8b48a")); break;
    case "enxada": for (let i = 0; i < 9; i++) pm.set(2 + i, 10 - i, C("#a8794a")); pm.rect(7, 1, 4, 3, C("#9aa0a8")); break;
    case "semente": pm.rect(2, 2, 8, 8, C("#c9a36a")); pm.rect(2, 2, 8, 2, C("#a07a50")); pm.elipse(6, 6.5, 2, 2, C("#5aa847")); break;
    case "regador": pm.rect(2, 4, 6, 6, C("#5a9ad0")); pm.rect(3, 2, 4, 1, C("#5a9ad0")); for (let i = 0; i < 3; i++) pm.set(8 + i, 5 - i, C("#5a9ad0")); pm.set(11, 2, C("#cfeeff")); break;
    case "gotejo": pm.rect(1, 8, 10, 2, C("#2a2a30")); pm.set(6, 7, C("#2a2a30")); pm.set(6, 5, C("#4aa8e0")); pm.set(6, 3, C("#4aa8e0")); break;
    case "construir": pm.rect(1, 5, 10, 6, C("#c8a070")); for (let i = 0; i < 6; i++) { pm.set(i, 5 - i * 0.8 | 0, C("#b5533a")); pm.set(11 - i, 5 - i * 0.8 | 0, C("#b5533a")); } pm.rect(5, 7, 2, 4, C("#7a4a2e")); break;
    case "mochila": pm.rect(2, 3, 8, 8, C("#a8794a")); pm.rect(3, 1, 6, 2, C("#8a6a40")); pm.rect(3, 6, 6, 3, C("#c8995a")); break;
    default: pm.rect(3, 3, 6, 6, C("#9a9a96"));
  }
}
export { criarCanvas };
