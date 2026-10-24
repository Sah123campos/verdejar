// Pequenos utilitários de interface: avisos rápidos e modais.
export const $ = (id) => document.getElementById(id);

let timerAviso = 0;
export function aviso(texto, { dur = 2600, acao = null } = {}) {
  const el = $("aviso");
  clearTimeout(timerAviso);
  el.replaceChildren();
  const s = document.createElement("span");
  s.textContent = texto;
  el.append(s);
  if (acao) {
    const b = document.createElement("button");
    b.textContent = acao.rotulo;
    b.addEventListener("click", () => {
      el.hidden = true;
      acao.fn();
    });
    el.append(b);
  }
  el.hidden = false;
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
  timerAviso = setTimeout(() => (el.hidden = true), dur);
}

export function abrirModal(id) {
  $(id).hidden = false;
  const foco = $(id).querySelector(".btn-principal, button");
  if (foco && matchMedia("(pointer: fine)").matches) foco.focus({ preventScroll: true });
}
export function fecharModal(id) {
  $(id).hidden = true;
}
export function modalAberto() {
  return [...document.querySelectorAll(".modal")].some((m) => !m.hidden);
}

let vibrarAtivo = true;
export function configurarVibracao(v) {
  vibrarAtivo = v;
}
export function vibrar(ms = 10) {
  if (!vibrarAtivo || !navigator.vibrate) return;
  try {
    navigator.vibrate(ms);
  } catch {
    /* sem vibração */
  }
}

// Desenha um personagem parado num canvas pequeno (prévia), com sombra no chão.
export function desenharPrevia(canvas, folha, dir, quadro, LARG, ALT, DIRECOES) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, base = canvas.height - 3;
  ctx.fillStyle = "rgba(20,40,20,0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, base, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const j = Math.max(0, DIRECOES.indexOf(dir));
  ctx.drawImage(folha, quadro * LARG, j * ALT, LARG, ALT, Math.round(cx - LARG / 2), base - ALT + 1, LARG, ALT);
}
