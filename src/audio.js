// Áudio sintetizado no navegador (sem arquivos): efeitos curtos e uma trilha
// leve em escala pentatônica que ganha instrumentos conforme a vila revive.
export class Audio {
  constructor() {
    this.ctx = null;
    this.volMusica = 0.5;
    this.volEfeitos = 0.7;
    this.vida = 0;
    this.tocando = false;
    this.passo = 0;
    this.proximo = 0;
  }

  // Navegadores só liberam o som depois de um toque/clique.
  destravar() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    this.mestre = this.ctx.createGain();
    this.mestre.connect(this.ctx.destination);
    this.gMusica = this.ctx.createGain();
    this.gMusica.gain.value = this.volMusica * 0.35;
    this.gMusica.connect(this.mestre);
    this.gEfeitos = this.ctx.createGain();
    this.gEfeitos.gain.value = this.volEfeitos;
    this.gEfeitos.connect(this.mestre);
  }

  definirVolumes(m, e) {
    this.volMusica = m;
    this.volEfeitos = e;
    if (this.gMusica) this.gMusica.gain.value = m * 0.35;
    if (this.gEfeitos) this.gEfeitos.gain.value = e;
  }

  pausarTudo(p) {
    if (!this.ctx) return;
    if (p) this.ctx.suspend().catch(() => {});
    else this.ctx.resume().catch(() => {});
  }

  nota(freq, ini, dur, tipo = "square", vol = 0.2, destino = this.gEfeitos, glide = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + ini;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(destino);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  ruido(ini, dur, vol = 0.15, filtro = 1200) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + ini;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filtro;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    s.connect(f).connect(g).connect(this.gEfeitos);
    s.start(t);
  }

  efeito(nome) {
    if (!this.ctx || this.volEfeitos <= 0) return;
    switch (nome) {
      case "toque": this.nota(880, 0, 0.05, "square", 0.08); break;
      case "selecao": this.nota(660, 0, 0.06, "square", 0.1); this.nota(990, 0.05, 0.08, "square", 0.08); break;
      case "girar": this.nota(520, 0, 0.07, "triangle", 0.12, undefined, 200); break;
      case "dado": for (let i = 0; i < 5; i++) this.nota(300 + Math.random() * 600, i * 0.04, 0.05, "square", 0.07); break;
      case "pegar": this.nota(740, 0, 0.07, "square", 0.12); this.nota(1100, 0.06, 0.1, "square", 0.1); break;
      case "cheio": this.nota(220, 0, 0.15, "square", 0.12); this.nota(180, 0.12, 0.2, "square", 0.1); break;
      case "certo": [523, 659, 784].forEach((f, i) => this.nota(f, i * 0.07, 0.14, "triangle", 0.16)); break;
      case "errado": this.nota(200, 0, 0.18, "sawtooth", 0.08, undefined, -60); break;
      case "plantar": this.ruido(0, 0.18, 0.12, 700); this.nota(392, 0.12, 0.12, "triangle", 0.14); this.nota(587, 0.22, 0.18, "triangle", 0.14); break;
      case "consertar": for (let i = 0; i < 3; i++) this.ruido(i * 0.09, 0.05, 0.2, 3000); this.nota(660, 0.3, 0.15, "triangle", 0.12); break;
      case "desligar": this.nota(600, 0, 0.12, "square", 0.1, undefined, -400); break;
      case "instalar": [392, 523, 659, 784, 1046].forEach((f, i) => this.nota(f, i * 0.06, 0.12, "square", 0.08)); break;
      case "missao": [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.nota(f, i * 0.1, 0.2, "triangle", 0.17)); break;
      case "dialogo": this.nota(480 + Math.random() * 80, 0, 0.03, "square", 0.04); break;
      case "passo": this.ruido(0, 0.04, 0.03, 500); break;
      case "abrir": this.nota(440, 0, 0.08, "triangle", 0.12, undefined, 300); break;
      case "enxada": this.ruido(0, 0.08, 0.22, 900); this.nota(150, 0, 0.08, "triangle", 0.1); break;
      case "regar": this.ruido(0, 0.3, 0.1, 2600); break;
      case "colher": [660, 880, 1100].forEach((f, i) => this.nota(f, i * 0.05, 0.08, "triangle", 0.13)); break;
      case "moeda": this.nota(988, 0, 0.06, "square", 0.08); this.nota(1319, 0.06, 0.14, "square", 0.08); break;
      case "salvar": this.nota(784, 0, 0.08, "triangle", 0.14); this.nota(1175, 0.08, 0.16, "triangle", 0.14); break;
    }
  }

  // Trilha: um sequenciador simples agendado com antecedência.
  iniciarMusica() {
    if (!this.ctx || this.tocando) return;
    this.tocando = true;
    this.proximo = this.ctx.currentTime + 0.1;
    const laco = () => {
      if (!this.tocando || !this.ctx) return;
      while (this.proximo < this.ctx.currentTime + 0.3) {
        this.tocarPasso(this.passo, this.proximo - this.ctx.currentTime);
        this.passo = (this.passo + 1) % 64;
        this.proximo += 0.25;
      }
      this.timer = setTimeout(laco, 90);
    };
    laco();
  }

  pararMusica() {
    this.tocando = false;
    clearTimeout(this.timer);
  }

  tocarPasso(p, t) {
    if (t < 0 || this.volMusica <= 0) return;
    const escala = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
    const acordes = [[0, 2, 4], [3, 5, 7], [4, 6, 1], [2, 4, 6]];
    const ac = acordes[Math.floor(p / 16) % 4];
    // baixo
    if (p % 8 === 0) this.nota(escala[ac[0]] / 2, t, 0.9, "triangle", 0.22, this.gMusica);
    // melodia suave
    const mel = [0, -1, 2, -1, 1, -1, 2, 0, -1, 1, -1, 2, 1, -1, 0, -1];
    const m = mel[p % 16];
    if (m >= 0 && (p % 32 < 16 || this.vida > 0.3)) this.nota(escala[ac[m]] * 2, t, 0.35, "sine", 0.12, this.gMusica);
    // brilho que aparece com a vila mais viva
    if (this.vida > 0.55 && p % 4 === 2) this.nota(escala[ac[(p / 4) % 3 | 0]] * 4, t, 0.12, "triangle", 0.04, this.gMusica);
    if (this.vida > 0.8 && p % 2 === 1) this.nota(escala[(p * 3) % 8] * 2, t, 0.08, "square", 0.015, this.gMusica);
  }
}
