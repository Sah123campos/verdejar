// Tela de criação e personalização do personagem.
// Prévia atualizada a cada escolha, giro em 4 direções (botões ou arrastando),
// miniaturas que mostram a peça já no seu personagem, e salvamento local.
import * as P from "./personagem.js";
import { folhaDeSprites, desenharQuadro, LARG, ALT, DIRECOES } from "./personagem.js";
import { ler, gravar } from "./salvar.js";
import { $, aviso, abrirModal, fecharModal, desenharPrevia, vibrar } from "./ui.js";

const ABAS = [
  { id: "visuais", nome: "Visuais" },
  { id: "estilos", nome: "Estilos" },
  { id: "corpo", nome: "Corpo e rosto" },
  { id: "cabelos", nome: "Cabelos" },
  { id: "roupas", nome: "Roupas" },
  { id: "calcados", nome: "Calçados" },
  { id: "acessorios", nome: "Acessórios" },
  { id: "cores", nome: "Cores" },
];

// Recortes do sprite (x, y, largura, altura) usados nas miniaturas.
const RECORTE = {
  corpo: [0, 0, 24, 32],
  cabeca: [2, 0, 20, 19],
  rosto: [5, 3, 14, 12],
  tronco: [2, 12, 20, 19],
  pernas: [3, 18, 18, 14],
  pes: [4, 22, 16, 10],
  pescoco: [5, 9, 14, 13],
};

const GIRO = ["baixo", "dir", "cima", "esq"];

export class Editor {
  constructor({ audio, aoConfirmar, aoVoltar }) {
    this.audio = audio;
    this.aoConfirmar = aoConfirmar;
    this.aoVoltar = aoVoltar;
    this.ap = { ...P.APARENCIA_INICIAL };
    this.aba = "visuais";
    this.giro = 0;
    this.andando = false;
    this.modo = "criar";
    this.raf = 0;

    this.canvas = $("ed-canvas");
    this.painel = $("ed-painel");
    this.montarAbas();

    $("ed-girar-esq").addEventListener("click", () => this.girar(-1));
    $("ed-girar-dir").addEventListener("click", () => this.girar(1));
    $("ed-andar").addEventListener("click", () => {
      this.andando = !this.andando;
      $("ed-andar").setAttribute("aria-pressed", String(this.andando));
      this.audio.efeito("toque");
    });
    $("ed-nome").addEventListener("input", (e) => {
      this.ap.nome = e.target.value.slice(0, 14);
      this.guardarRascunho();
    });
    $("ed-nome").addEventListener("keydown", (e) => { if (e.key === "Enter") e.target.blur(); });
    $("ed-aleatorio").addEventListener("click", () => this.aleatorio());
    $("ed-restaurar").addEventListener("click", () => this.restaurar());
    $("ed-salvar").addEventListener("click", () => this.salvar(true));
    $("ed-confirmar").addEventListener("click", () => this.confirmar());
    $("ed-voltar").addEventListener("click", () => this.voltar());
    $("conf-editar").addEventListener("click", () => {
      this.audio.efeito("toque");
      fecharModal("confirmar");
    });
    $("conf-ok").addEventListener("click", () => {
      fecharModal("confirmar");
      this.finalizar();
    });

    // Arrastar na prévia gira o personagem.
    const palco = $("ed-palco");
    let x0 = null, acum = 0;
    palco.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      x0 = e.clientX;
      acum = 0;
      try { palco.setPointerCapture(e.pointerId); } catch { /* ok */ }
    });
    palco.addEventListener("pointermove", (e) => {
      if (x0 === null) return;
      acum += e.clientX - x0;
      x0 = e.clientX;
      while (Math.abs(acum) > 36) {
        this.girar(acum > 0 ? -1 : 1, true);
        acum -= Math.sign(acum) * 36;
      }
    });
    const solta = () => (x0 = null);
    palco.addEventListener("pointerup", solta);
    palco.addEventListener("pointercancel", solta);
  }

  abrir(modo, aparencia) {
    this.modo = modo;
    const salva = aparencia || ler("aparencia");
    const rasc = ler("rascunho");
    this.original = P.normalizar(salva || P.APARENCIA_INICIAL);
    this.ap = P.normalizar(rasc && modo === "criar" ? rasc : this.original);
    if (rasc && modo === "criar" && JSON.stringify(P.normalizar(rasc)) !== JSON.stringify(this.original)) {
      setTimeout(() => aviso("Rascunho recuperado: continue de onde parou."), 300);
    }
    $("ed-titulo").textContent = modo === "brecho" ? "Brechó Circular" : modo === "editar" ? "Editar aparência" : "Crie seu personagem";
    $("ed-confirmar-texto").textContent = modo === "criar" ? "Confirmar" : "Vestir";
    $("ed-nome").value = this.ap.nome;
    $("editor").hidden = false;
    this.giro = 0;
    this.trocarAba(modo === "brecho" ? "roupas" : modo === "criar" ? "visuais" : this.aba);
    this.atualizarPrevia(false);
    cancelAnimationFrame(this.raf);
    const laco = (t) => {
      this.desenhar(t);
      this.raf = requestAnimationFrame(laco);
    };
    this.raf = requestAnimationFrame(laco);
  }

  fechar() {
    $("editor").hidden = true;
    cancelAnimationFrame(this.raf);
  }

  montarAbas() {
    const nav = $("ed-abas");
    for (const a of ABAS) {
      const b = document.createElement("button");
      b.className = "aba";
      b.role = "tab";
      b.dataset.aba = a.id;
      b.textContent = a.nome;
      b.addEventListener("click", () => {
        this.audio.efeito("toque");
        this.trocarAba(a.id);
      });
      nav.append(b);
    }
  }

  trocarAba(id) {
    this.aba = id;
    for (const b of $("ed-abas").children) {
      const sel = b.dataset.aba === id;
      b.setAttribute("aria-selected", String(sel));
      if (sel) b.scrollIntoView({ inline: "nearest", block: "nearest" });
    }
    this.painel.scrollTop = 0;
    this.montarPainel();
    if (this.folha) this.atualizarPrevia(false);
  }

  // ---------------------------------------------------------- Painel de opções
  montarPainel() {
    const rolagem = this.painel.scrollTop;
    const p = this.painel;
    p.replaceChildren();
    const ap = this.ap;
    switch (this.aba) {
      case "visuais":
        p.append(this.nota("Escolha um visual para começar. Depois, mude corpo, cabelo, roupas e cores como quiser."));
        p.append(this.secaoVisuais());
        break;
      case "estilos":
        p.append(this.nota("Estilos prontos trocam só as roupas e acessórios. Depois, misture as peças como quiser."));
        p.append(this.secaoEstilos());
        break;
      case "corpo":
        p.append(this.secaoCores("Tom de pele", P.PELES, "pele"));
        p.append(this.secaoMini("Formato do corpo", P.CORPOS, "corpo", "corpo"));
        p.append(this.secaoMini("Formato do rosto", P.ROSTOS, "rosto", "rosto"));
        p.append(this.secaoMini("Olhos", P.OLHOS, "olhos", "rosto"));
        p.append(this.secaoCores("Cor dos olhos", P.CORES_OLHOS, "corOlhos"));
        p.append(this.secaoDetalhes());
        break;
      case "cabelos":
        p.append(this.secaoMini("Corte", P.CABELOS, "cabelo", "cabeca", { semChapeu: true }));
        p.append(this.secaoCores("Cor do cabelo", P.CORES_CABELO, "corCabelo"));
        break;
      case "roupas": {
        p.append(this.secaoMini("Parte de cima", P.PARTES_CIMA, "cima", "tronco"));
        p.append(this.secaoCores("Cor principal", P.CORES_ROUPA, "corCima"));
        const c = P.acharCima(ap.cima);
        p.append(this.secaoCores(c.usaCor2 ? "Cor do detalhe" : "Cor da estampa", P.CORES_ROUPA, "cor2Cima"));
        p.append(this.secaoMini("Estampa", P.ESTAMPAS, "estampaCima", "tronco"));
        p.append(this.secaoMateriais("Material da parte de cima", "materialCima"));
        const sec = this.secaoMini("Parte de baixo", P.PARTES_BAIXO, "baixo", "pernas");
        if (c.cobrePernas) sec.prepend(this.nota("A jardineira já cobre as pernas. A parte de baixo escolhida volta quando você trocar a peça de cima."));
        p.append(sec);
        p.append(this.secaoCores("Cor da parte de baixo", P.CORES_ROUPA, "corBaixo"));
        p.append(this.secaoMini("Estampa da parte de baixo", P.ESTAMPAS, "estampaBaixo", "pernas"));
        p.append(this.secaoMateriais("Material da parte de baixo", "materialBaixo"));
        break;
      }
      case "calcados":
        p.append(this.secaoMini("Modelo", P.CALCADOS, "calcado", "pes"));
        p.append(this.secaoCores("Cor", P.CORES_ROUPA, "corCalcado"));
        break;
      case "acessorios":
        p.append(this.secaoMini("Cabeça", P.ACESS_CABECA, "cabeca", "cabeca"));
        if (ap.cabeca !== "nenhum") p.append(this.secaoCores("Cor do acessório de cabeça", P.CORES_ROUPA, "corCabeca"));
        p.append(this.secaoMini("Rosto", P.ACESS_ROSTO, "rostoAc", "rosto"));
        p.append(this.secaoMini("Pescoço", P.ACESS_PESCOCO, "pescoco", "pescoco"));
        if (ap.pescoco === "cachecol" || ap.pescoco === "bandana") p.append(this.secaoCores("Cor do acessório de pescoço", P.CORES_ROUPA, "corPescoco"));
        p.append(this.secaoMini("Costas", P.ACESS_COSTAS, "costas", "corpo", { dir: "cima" }));
        if (ap.costas !== "nenhum") p.append(this.secaoCores("Cor da mochila ou bolsa", P.CORES_ROUPA, "corCostas"));
        break;
      case "cores":
        p.append(this.secaoCores("Pele", P.PELES, "pele"));
        p.append(this.secaoCores("Cabelo", P.CORES_CABELO, "corCabelo"));
        p.append(this.secaoCores("Olhos", P.CORES_OLHOS, "corOlhos"));
        p.append(this.secaoCores("Parte de cima", P.CORES_ROUPA, "corCima"));
        p.append(this.secaoCores("Detalhe da parte de cima", P.CORES_ROUPA, "cor2Cima"));
        p.append(this.secaoCores("Parte de baixo", P.CORES_ROUPA, "corBaixo"));
        p.append(this.secaoCores("Calçados", P.CORES_ROUPA, "corCalcado"));
        p.append(this.secaoCores("Acessório de cabeça", P.CORES_ROUPA, "corCabeca"));
        p.append(this.secaoCores("Acessório de pescoço", P.CORES_ROUPA, "corPescoco"));
        p.append(this.secaoCores("Mochila ou bolsa", P.CORES_ROUPA, "corCostas"));
        break;
    }
    this.painel.scrollTop = rolagem;
  }

  nota(t) {
    const n = document.createElement("p");
    n.className = "nota";
    n.textContent = t;
    return n;
  }

  secao(titulo, extra) {
    const s = document.createElement("section");
    s.className = "secao";
    const h = document.createElement("h3");
    h.textContent = titulo;
    if (extra) {
      const sm = document.createElement("small");
      sm.textContent = extra;
      h.append(sm);
    }
    s.append(h);
    return s;
  }

  miniatura(ap, recorte, dir = "baixo") {
    const [x, y, w, h] = RECORTE[recorte];
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.style.objectFit = "contain";
    const pm = desenharQuadro(ap, dir, 0);
    c.getContext("2d").putImageData(new ImageData(pm.d, pm.w, pm.h), -x, -y, x, y, w, h);
    return c;
  }

  botaoOpcao(rotulo, selecionado, aoEscolher, canvas, extra) {
    const b = document.createElement("button");
    b.className = "opcao";
    b.setAttribute("aria-pressed", String(selecionado));
    if (canvas) b.append(canvas);
    const s = document.createElement("span");
    s.textContent = rotulo;
    b.append(s);
    if (extra) {
      const e = document.createElement("span");
      e.className = "eco";
      e.textContent = extra;
      b.append(e);
    }
    b.addEventListener("click", aoEscolher);
    return b;
  }

  secaoMini(titulo, lista, chave, recorte, opts = {}) {
    const atual = lista.find((o) => o.id === this.ap[chave]);
    const s = this.secao(titulo, atual?.nome);
    const g = document.createElement("div");
    g.className = "grade";
    for (const o of lista) {
      const ap2 = { ...this.ap, [chave]: o.id };
      if (opts.semChapeu) ap2.cabeca = "nenhum"; // para o corte aparecer inteiro
      // Para ver bem a estampa, a miniatura mostra a peça com estampa mesmo se a cor 2 for igual.
      const b = this.botaoOpcao(o.nome, this.ap[chave] === o.id, () => this.mudar({ [chave]: o.id }), this.miniatura(ap2, recorte, opts.dir));
      g.append(b);
    }
    s.append(g);
    return s;
  }

  secaoDetalhes() {
    const s = this.secao("Detalhes", "toque para ligar ou desligar");
    const g = document.createElement("div");
    g.className = "grade";
    for (const d of P.DETALHES) {
      const tem = this.ap.detalhes.includes(d.id);
      const ap2 = { ...this.ap, detalhes: [...new Set([...this.ap.detalhes, d.id])] };
      g.append(
        this.botaoOpcao(d.nome, tem, () => {
          const det = tem ? this.ap.detalhes.filter((x) => x !== d.id) : [...this.ap.detalhes, d.id];
          this.mudar({ detalhes: det });
        }, this.miniatura(ap2, "rosto")),
      );
    }
    s.append(g);
    return s;
  }

  secaoCores(titulo, paleta, chave) {
    const s = this.secao(titulo);
    const g = document.createElement("div");
    g.className = "cores";
    paleta.forEach((cor, i) => {
      const b = document.createElement("button");
      b.className = "cor";
      b.style.background = cor;
      b.setAttribute("aria-label", `${titulo}: opção ${i + 1}`);
      b.setAttribute("aria-pressed", String(this.ap[chave].toLowerCase() === cor.toLowerCase()));
      b.addEventListener("click", () => this.mudar({ [chave]: cor }));
      g.append(b);
    });
    s.append(g);
    return s;
  }

  secaoMateriais(titulo, chave) {
    const s = this.secao(titulo);
    const g = document.createElement("div");
    g.className = "grade grande";
    for (const m of P.MATERIAIS) {
      const b = document.createElement("button");
      b.className = "opcao material";
      b.setAttribute("aria-pressed", String(this.ap[chave] === m.id));
      const t = document.createElement("b");
      t.textContent = m.nome;
      const i = document.createElement("span");
      i.textContent = m.info;
      b.append(t, i);
      b.addEventListener("click", () => this.mudar({ [chave]: m.id }));
      g.append(b);
    }
    s.append(g);
    return s;
  }

  secaoVisuais() {
    const s = this.secao("Visuais");
    const g = document.createElement("div");
    g.className = "grade grande";
    for (const v of P.VISUAIS) {
      const ap2 = P.normalizar({ ...v.v, nome: this.ap.nome });
      const igual = Object.entries(v.v).every(([k, x]) => JSON.stringify(this.ap[k]) === JSON.stringify(x));
      g.append(this.botaoOpcao(v.nome, igual, () => this.mudar({ ...P.APARENCIA_INICIAL, ...v.v, nome: this.ap.nome }), this.miniatura(ap2, "corpo")));
    }
    s.append(g);
    return s;
  }

  secaoEstilos() {
    const s = this.secao("Estilos");
    const g = document.createElement("div");
    g.className = "grade grande";
    for (const e of P.ESTILOS) {
      const ap2 = { ...this.ap, ...e.v };
      const igual = Object.entries(e.v).every(([k, v]) => this.ap[k] === v);
      g.append(this.botaoOpcao(e.nome, igual, () => this.mudar({ ...e.v }), this.miniatura(ap2, "corpo")));
    }
    s.append(g);
    return s;
  }

  // ---------------------------------------------------------- Ações
  mudar(parcial) {
    this.ap = P.normalizar({ ...this.ap, ...parcial });
    this.audio.efeito("selecao");
    vibrar(6);
    this.guardarRascunho();
    this.atualizarPrevia(true);
    this.montarPainel();
  }

  guardarRascunho() {
    clearTimeout(this.tRasc);
    this.tRasc = setTimeout(() => gravar("rascunho", this.ap), 250);
  }

  girar(d, silencioso) {
    this.giro = (this.giro + d + 4) % 4;
    if (!silencioso) vibrar(5);
    this.audio.efeito("girar");
  }

  aleatorio() {
    const nome = this.ap.nome;
    this.ap = P.normalizar({ ...P.aleatoria(), nome });
    this.audio.efeito("dado");
    vibrar(15);
    this.guardarRascunho();
    this.atualizarPrevia(true);
    this.montarPainel();
  }

  restaurar() {
    const antes = this.ap;
    this.ap = P.normalizar({ ...P.APARENCIA_INICIAL, nome: antes.nome });
    this.audio.efeito("abrir");
    this.guardarRascunho();
    this.atualizarPrevia(true);
    this.montarPainel();
    aviso("Aparência inicial restaurada.", {
      dur: 5000,
      acao: { rotulo: "Desfazer", fn: () => { this.ap = antes; this.guardarRascunho(); this.atualizarPrevia(true); this.montarPainel(); } },
    });
  }

  salvar(comAviso) {
    const ok = gravar("aparencia", this.ap);
    gravar("rascunho", this.ap);
    this.original = { ...this.ap };
    if (comAviso) {
      this.audio.efeito("salvar");
      aviso(ok ? "Aparência salva neste aparelho." : "Não foi possível salvar (armazenamento bloqueado). Ela vale até fechar a página.");
    }
    return ok;
  }

  confirmar() {
    this.audio.efeito("abrir");
    if (this.modo === "criar") {
      const folha = folhaDeSprites(this.ap);
      desenharPrevia($("conf-canvas"), folha, "baixo", 0, LARG, ALT, DIRECOES);
      $("conf-nome").textContent = this.ap.nome || "Sem nome (você pode escolher depois)";
      abrirModal("confirmar");
    } else {
      this.finalizar();
    }
  }

  finalizar() {
    this.salvar(false);
    this.audio.efeito("missao");
    this.fechar();
    this.aoConfirmar(this.ap, this.modo);
  }

  voltar() {
    this.audio.efeito("toque");
    const mudou = JSON.stringify(this.ap) !== JSON.stringify(this.original);
    this.fechar();
    if (mudou) aviso("Rascunho guardado. Toque em Salvar ou Confirmar para usar este visual.", { dur: 3500 });
    this.aoVoltar(this.modo);
  }

  atualizarPrevia(pulo) {
    this.folha = folhaDeSprites(this.ap);
    const m = P.acharMaterial(this.ap.materialCima);
    const selo = $("ed-material");
    selo.hidden = this.aba !== "roupas";
    selo.textContent = `${m.nome}: ${m.info}`;
    if (pulo) {
      this.canvas.classList.remove("pulo");
      void this.canvas.offsetWidth;
      this.canvas.classList.add("pulo");
    }
  }

  desenhar(t) {
    if (!this.folha) return;
    const q = this.andando ? 2 + (Math.floor(t / 150) % 4) : Math.floor(t / 600) % 2;
    desenharPrevia(this.canvas, this.folha, GIRO[this.giro], q, LARG, ALT, DIRECOES);
  }
}
