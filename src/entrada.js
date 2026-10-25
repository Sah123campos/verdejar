// Entrada unificada: teclado (computador) e toque (celular).
// No toque: um joystick flutuante aparece onde o polegar encosta no cenário;
// um toque rápido no cenário anda até o ponto ou interage com o que foi tocado.
const SENS = { baixa: { raio: 64, morta: 0.22 }, normal: { raio: 50, morta: 0.15 }, alta: { raio: 36, morta: 0.1 } };

export class Entrada {
  constructor(canvas) {
    this.canvas = canvas;
    this.teclas = new Set();
    this.acoes = [];
    this.toque = { x: 0, y: 0 };
    this.toqueRapido = null;
    this.dispositivo = "teclado";
    this.sens = SENS.normal;
    this.ativo = false;
    this.ponteiro = null;
    this.base = document.getElementById("joystick");
    this.pino = document.getElementById("joystick-pino");

    window.addEventListener("keydown", (e) => {
      if (e.target.closest?.("input")) return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (!e.repeat) {
        if (k === "e" || k === " " || k === "enter") this.disparar("interagir");
        if (k === "escape" || k === "p") this.disparar("pausa");
        if (k === "j") this.disparar("diario");
        if (k === "f") this.disparar("telacheia");
        if (/^[1-9]$/.test(k)) this.disparar("ferr" + k); // 1 a 9: ferramentas da barra
      }
      this.teclas.add(k);
      this.mudarDispositivo("teclado");
    });
    window.addEventListener("keyup", (e) => this.teclas.delete(e.key.toLowerCase()));
    window.addEventListener("blur", () => { this.teclas.clear(); this.soltar(); });

    canvas.addEventListener("pointerdown", (e) => this.inicio(e));
    window.addEventListener("pointermove", (e) => this.mover(e), { passive: false });
    window.addEventListener("pointerup", (e) => this.fim(e));
    window.addEventListener("pointercancel", (e) => this.fim(e, true));
    window.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") this.mudarDispositivo("toque"); }, true);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  definirSensibilidade(n) {
    this.sens = SENS[n] || SENS.normal;
  }

  mudarDispositivo(d) {
    if (this.dispositivo === d) return;
    this.dispositivo = d;
    document.documentElement.classList.toggle("modo-toque", d === "toque");
  }

  disparar(a) {
    this.acoes.push(a);
  }

  consumir() {
    const a = this.acoes;
    this.acoes = [];
    return a;
  }

  inicio(e) {
    if (!this.ativo || this.ponteiro !== null) return;
    e.preventDefault();
    this.ponteiro = e.pointerId;
    this.centro = { x: e.clientX, y: e.clientY };
    this.t0 = performance.now();
    this.arrastou = false;
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* ok */ }
  }

  mover(e) {
    if (e.pointerId !== this.ponteiro) return;
    e.preventDefault();
    let dx = e.clientX - this.centro.x, dy = e.clientY - this.centro.y;
    const d = Math.hypot(dx, dy);
    const raio = this.sens.raio;
    if (!this.arrastou && d > 10) {
      this.arrastou = true;
      this.toqueRapido = null;
      this.base.style.left = `${this.centro.x}px`;
      this.base.style.top = `${this.centro.y}px`;
      this.base.hidden = false;
    }
    if (!this.arrastou) return;
    // joystick "flutuante": se o dedo vai longe, a base acompanha
    if (d > raio * 1.5) {
      const ex = d - raio * 1.5;
      this.centro.x += (dx / d) * ex;
      this.centro.y += (dy / d) * ex;
      this.base.style.left = `${this.centro.x}px`;
      this.base.style.top = `${this.centro.y}px`;
      dx = e.clientX - this.centro.x;
      dy = e.clientY - this.centro.y;
    }
    const lim = Math.min(1, 44 / Math.max(1, Math.hypot(dx, dy)));
    this.pino.style.transform = `translate(${dx * lim}px, ${dy * lim}px)`;
    let x = dx / raio, y = dy / raio;
    const m = Math.hypot(x, y);
    if (m < this.sens.morta) { x = 0; y = 0; }
    else if (m > 1) { x /= m; y /= m; }
    this.toque.x = x;
    this.toque.y = y;
  }

  fim(e, cancelado) {
    if (e.pointerId !== this.ponteiro) return;
    if (!this.arrastou && !cancelado && performance.now() - this.t0 < 350) {
      this.toqueRapido = { x: e.clientX, y: e.clientY };
    }
    this.soltar();
  }

  soltar() {
    this.ponteiro = null;
    this.arrastou = false;
    if (this.base) this.base.hidden = true;
    if (this.pino) this.pino.style.transform = "translate(0,0)";
    this.toque.x = 0;
    this.toque.y = 0;
  }

  direcao() {
    let x = 0, y = 0;
    const t = this.teclas;
    if (t.has("a") || t.has("arrowleft")) x -= 1;
    if (t.has("d") || t.has("arrowright")) x += 1;
    if (t.has("w") || t.has("arrowup")) y -= 1;
    if (t.has("s") || t.has("arrowdown")) y += 1;
    if (x || y) {
      const m = Math.hypot(x, y);
      return { x: x / m, y: y / m };
    }
    return { x: this.toque.x, y: this.toque.y };
  }
}
