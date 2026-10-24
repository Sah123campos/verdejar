// Minijogo do Ecoponto: separar o lixo da sacola nas cinco lixeiras da coleta seletiva.
// Funciona com toque (tocar no item e depois na lixeira) ou arrastando.
import { CATEGORIAS, LIXOS, iconeLixo } from "./mundo.js";
import { $, abrirModal, fecharModal, vibrar } from "./ui.js";

export function abrirTriagem(itens, { audio, aoAcertar, aoTerminar }) {
  const caixaItens = $("triagem-itens");
  const caixaLix = $("triagem-lixeiras");
  const dica = $("triagem-dica");
  caixaItens.replaceChildren();
  caixaLix.replaceChildren();
  dica.textContent = "";
  let escolhido = null;
  let restantes = itens.length;
  let erros = 0;
  const errados = new Set();

  const lixeiras = CATEGORIAS.map((c) => {
    const b = document.createElement("button");
    b.className = "lixeira";
    b.style.background = c.cor;
    b.dataset.cat = c.id;
    b.textContent = c.nome;
    b.addEventListener("click", () => { if (escolhido) soltarEm(escolhido, c.id); });
    caixaLix.append(b);
    return b;
  });

  function soltarEm(el, cat) {
    const tipo = el.dataset.tipo;
    const info = LIXOS[tipo];
    const lix = lixeiras.find((l) => l.dataset.cat === cat);
    if (info.cat === cat) {
      audio.efeito("certo");
      vibrar(12);
      lix.classList.remove("acertou");
      void lix.offsetWidth;
      lix.classList.add("acertou");
      dica.textContent = `Isso! ${info.nome} vai no ${CATEGORIAS.find((c) => c.id === cat).nome.toLowerCase()}. ${info.fato}`;
      el.remove();
      escolhido = null;
      restantes--;
      aoAcertar(tipo, !errados.has(el));
      if (restantes === 0) {
        setTimeout(() => {
          fecharModal("triagem");
          aoTerminar(erros);
        }, 1400);
      }
    } else {
      erros++;
      errados.add(el);
      audio.efeito("errado");
      vibrar([20, 40, 20]);
      el.classList.remove("errou");
      void el.offsetWidth;
      el.classList.add("errou");
      const certa = CATEGORIAS.find((c) => c.id === info.cat);
      dica.textContent = `Quase! ${info.nome} não é ${CATEGORIAS.find((c) => c.id === cat).nome.toLowerCase()}. Dica: procure a lixeira ${corNome(certa.id)}.`;
    }
  }

  for (const tipo of itens) {
    const el = document.createElement("button");
    el.className = "item-lixo";
    el.dataset.tipo = tipo;
    const cv = document.createElement("canvas");
    cv.width = 12;
    cv.height = 12;
    cv.getContext("2d").drawImage(iconeLixo(tipo), 0, 0);
    const s = document.createElement("span");
    s.textContent = LIXOS[tipo].nome;
    el.append(cv, s);
    caixaItens.append(el);

    // tocar para escolher
    el.addEventListener("click", () => {
      if (el.dataset.arrastou) { delete el.dataset.arrastou; return; }
      for (const o of caixaItens.children) o.classList.remove("escolhido");
      escolhido = el;
      el.classList.add("escolhido");
      audio.efeito("toque");
      dica.textContent = `${LIXOS[tipo].nome}: em qual lixeira vai?`;
    });
    // arrastar
    let ini = null, clone = null;
    el.addEventListener("pointerdown", (e) => {
      ini = { x: e.clientX, y: e.clientY, id: e.pointerId };
      try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
    });
    el.addEventListener("pointermove", (e) => {
      if (!ini || e.pointerId !== ini.id) return;
      if (!clone && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) > 12) {
        clone = el.cloneNode(true);
        clone.classList.add("arrastando");
        document.body.append(clone);
      }
      if (clone) {
        clone.style.left = `${e.clientX - 35}px`;
        clone.style.top = `${e.clientY - 35}px`;
        const alvo = document.elementFromPoint(e.clientX, e.clientY)?.closest(".lixeira");
        for (const l of lixeiras) l.classList.toggle("alvo", l === alvo);
      }
    });
    const fim = (e) => {
      if (!ini || e.pointerId !== ini.id) return;
      ini = null;
      if (clone) {
        clone.remove();
        clone = null;
        el.dataset.arrastou = "1";
        setTimeout(() => delete el.dataset.arrastou, 50);
        for (const l of lixeiras) l.classList.remove("alvo");
        const alvo = document.elementFromPoint(e.clientX, e.clientY)?.closest(".lixeira");
        if (alvo) soltarEm(el, alvo.dataset.cat);
      }
    };
    el.addEventListener("pointerup", fim);
    el.addEventListener("pointercancel", fim);
  }
  abrirModal("triagem");
}

function corNome(cat) {
  return { papel: "azul", plastico: "vermelha", metal: "amarela", vidro: "verde", organico: "marrom" }[cat];
}
