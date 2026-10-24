// Tela cheia sem travar a orientação: o jogador continua usando o celular em pé
// ou deitado, como preferir. Quando o navegador não permite (iPhone, por exemplo),
// entra num "modo ampliado" e explica como instalar o jogo na tela inicial.
const doc = document;

export function emTelaCheia() {
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
}

// Aberto pela tela inicial (PWA). Atenção: durante a tela cheia pedida pela página,
// o Chrome também responde "display-mode: fullscreen", então isso não conta.
export function instaladoComoApp() {
  if (emTelaCheia()) return false;
  return (
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.matchMedia?.("(display-mode: standalone)").matches ||
    navigator.standalone === true
  );
}

export function apiDisponivel() {
  const el = doc.documentElement;
  const temMetodo = !!(el.requestFullscreen || el.webkitRequestFullscreen);
  const permitido = doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? temMetodo;
  return temMetodo && permitido !== false;
}

const ehIOS = () => /iP(hone|od|ad)/.test(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in doc);

export class TelaCheia {
  constructor({ aoMudar, aoAvisar }) {
    this.aoMudar = aoMudar;
    this.aoAvisar = aoAvisar;
    this.ampliado = false;
    const mudou = () => this.atualizar();
    doc.addEventListener("fullscreenchange", mudou);
    doc.addEventListener("webkitfullscreenchange", mudou);
    doc.addEventListener("fullscreenerror", () => this.falhou());
    doc.addEventListener("webkitfullscreenerror", () => this.falhou());
    doc.addEventListener("click", (e) => {
      const b = e.target.closest?.(".btn-telacheia");
      if (b) this.alternar();
    });
    this.atualizar();
  }

  ativo() {
    return emTelaCheia() || this.ampliado || instaladoComoApp();
  }

  async alternar() {
    if (emTelaCheia()) return this.sair();
    if (this.ampliado) {
      this.ampliado = false;
      this.atualizar();
      return;
    }
    if (instaladoComoApp()) {
      this.aoAvisar("O jogo já está aberto como aplicativo, ocupando a tela inteira.");
      return;
    }
    if (!apiDisponivel()) return this.falhou();
    const el = doc.documentElement;
    try {
      // navigationUI: "hide" pede para esconder as barras do navegador quando possível.
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
      else el.webkitRequestFullscreen();
    } catch {
      this.falhou();
    }
  }

  async sair() {
    try {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else doc.webkitExitFullscreen?.();
    } catch {
      /* já saiu */
    }
  }

  falhou() {
    // Alternativa: modo ampliado (esconde o que não é essencial) + instrução de instalação.
    this.ampliado = true;
    this.atualizar();
    const msg = ehIOS()
      ? "O Safari do iPhone não deixa páginas comuns ocuparem a tela inteira. Ativamos o modo ampliado. Para jogar em tela cheia de verdade, toque em Compartilhar e depois em “Adicionar à Tela de Início”: o Raízes do Sertão abre como aplicativo, sem barras, em pé ou deitado."
      : "Este navegador não permitiu a tela cheia agora. Ativamos o modo ampliado. Você também pode instalar o jogo pelo menu do navegador (“Instalar app” ou “Adicionar à tela inicial”) para abri-lo sem barras.";
    this.aoAvisar(msg, true);
  }

  atualizar() {
    const ativo = this.ativo();
    doc.documentElement.classList.toggle("em-telacheia", ativo);
    doc.documentElement.classList.toggle("modo-ampliado", this.ampliado);
    for (const b of doc.querySelectorAll(".btn-telacheia")) {
      b.setAttribute("aria-label", ativo ? "Sair da tela cheia" : "Tela cheia");
      b.setAttribute("aria-pressed", String(ativo));
      b.hidden = instaladoComoApp();
    }
    this.aoMudar?.(ativo);
  }
}
