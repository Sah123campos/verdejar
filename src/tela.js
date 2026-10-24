// Tela: o jogo é desenhado em baixa resolução ("pixels de arte") e ampliado por um
// fator inteiro, para os pixels ficarem nítidos. Reajusta ao girar o celular e ao
// entrar ou sair da tela cheia.
const ALVO = 210; // menor lado da tela, em pixels de arte

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
