// Ferramentas de pixel art: cores, ruído e Pixmap (imagem pequena editável pixel a pixel).
// Toda a arte do jogo é desenhada por código a partir destas funções.

export function criarCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

const cache = new Map();
export function rgb(e) {
  if (Array.isArray(e)) return e;
  let c = cache.get(e);
  if (c) return c;
  let h = String(e).replace("#", "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h, 16) || 0;
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  cache.set(e, c);
  return c;
}

export function misturar(a, b, t) {
  a = rgb(a);
  b = rgb(b);
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    a[3] ?? 255,
  ];
}

// Sombras puxam para um azul-arroxeado e luzes para um amarelo quente.
const SOMBRA = [30, 22, 54, 255];
const LUZ = [255, 246, 214, 255];
export const escurecer = (c, f = 0.25) => misturar(c, SOMBRA, f);
export const clarear = (c, f = 0.2) => misturar(c, LUZ, f);
export function comAlfa(c, a) {
  c = rgb(c);
  return [c[0], c[1], c[2], Math.round(a * 255)];
}
export function css(c, a) {
  c = rgb(c);
  return `rgba(${c[0]},${c[1]},${c[2]},${a ?? (c[3] ?? 255) / 255})`;
}
export function hexValido(h) {
  return typeof h === "string" && /^#[0-9a-fA-F]{6}$/.test(h);
}

export function hash(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function semente(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function suave(t) {
  return t * t * (3 - 2 * t);
}
export function ruido(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = suave(x - xi), yf = suave(y - yi);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

export class Pixmap {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  set(x, y, c) {
    x |= 0;
    y |= 0;
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const a = c[3] ?? 255;
    if (a >= 255) {
      this.d[i] = c[0];
      this.d[i + 1] = c[1];
      this.d[i + 2] = c[2];
      this.d[i + 3] = 255;
    } else if (a > 0) {
      const t = a / 255, da = this.d[i + 3] / 255;
      const oa = t + da * (1 - t);
      this.d[i] = (c[0] * t + this.d[i] * da * (1 - t)) / oa;
      this.d[i + 1] = (c[1] * t + this.d[i + 1] * da * (1 - t)) / oa;
      this.d[i + 2] = (c[2] * t + this.d[i + 2] * da * (1 - t)) / oa;
      this.d[i + 3] = oa * 255;
    }
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  }
  alfa(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  elipse(cx, cy, rx, ry, cor) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) this.set(x, y, typeof cor === "function" ? cor(x, y, nx, ny) : cor);
      }
  }
  // Contorno escuro de 1px em volta do que já foi desenhado (deixa os sprites legíveis em qualquer fundo).
  contornar(forca = 0.62) {
    const add = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.alfa(x, y) > 0) continue;
        let viz = null;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          if (this.alfa(x + dx, y + dy) > 200) {
            viz = this.get(x + dx, y + dy);
            break;
          }
        }
        if (viz) add.push([x, y, misturar(viz, [24, 16, 34, 255], forca)]);
      }
    for (const [x, y, c] of add) this.set(x, y, c);
  }
  espelhar() {
    const o = new Pixmap(this.w, this.h);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const s = (y * this.w + x) * 4, t = (y * this.w + (this.w - 1 - x)) * 4;
        for (let k = 0; k < 4; k++) o.d[t + k] = this.d[s + k];
      }
    return o;
  }
  paraCanvas() {
    const c = criarCanvas(this.w, this.h);
    this.desenharEm(c.getContext("2d"), 0, 0);
    return c;
  }
  desenharEm(ctx, x, y) {
    ctx.putImageData(new ImageData(this.d, this.w, this.h), x, y);
  }
}

// Máscara binária simples para montar formas e depois pintar com sombreamento automático.
export class Mascara {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h);
  }
  add(x, y) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = 1;
    return this;
  }
  del(x, y) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = 0;
    return this;
  }
  tem(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.d[y * this.w + x] === 1;
  }
  rect(x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.add(x + i, y + j);
    return this;
  }
  linha(y, x0, x1) {
    for (let x = x0; x <= x1; x++) this.add(x, y);
    return this;
  }
  fn(f) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (f(x, y)) this.add(x, y);
    return this;
  }
  vazia() {
    return !this.d.some((v) => v);
  }
  *pontos() {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.d[y * this.w + x]) yield [x, y];
  }
}
