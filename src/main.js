// Início do jogo: carregamento, telas (título, editor, jogo), HUD, opções e laço principal.
import { Tela, Jogo, MISSOES } from "./jogo.js";
import { Entrada } from "./entrada.js";
import { Audio } from "./audio.js";
import { Editor } from "./editor.js";
import { TelaCheia } from "./telacheia.js";
import { folhaDeSprites, normalizar, LARG, ALT, DIRECOES } from "./personagem.js";
import { iconeLixo } from "./mundo.js";
import { ler, gravar, apagar } from "./salvar.js";
import { $, aviso, abrirModal, fecharModal, modalAberto, desenharPrevia, configurarVibracao, vibrar } from "./ui.js";

const OPCOES_PADRAO = { musica: 45, efeitos: 70, sensibilidade: "normal", tamanho: "m", mao: "dir", qualidade: "auto", vibracao: "sim", fps: "nao" };
const NIVEIS = { alta: 1, media: 0.6, baixa: 0.3 };

const tela = new Tela($("tela"));
const entrada = new Entrada($("tela"));
const audio = new Audio();
let opcoes = { ...OPCOES_PADRAO, ...(ler("opcoes") || {}) };
let aparencia = ler("aparencia") ? normalizar(ler("aparencia")) : null;
let origemEditor = "titulo";
let nivelAuto = "alta";

const jogo = new Jogo({
  tela, entrada, audio,
  aoAbrirEditor: (modo) => abrirEditor(modo, "jogo"),
  aoFim: () => mostrarFim(),
});

const editor = new Editor({
  audio,
  aoConfirmar: (ap, modo) => {
    aparencia = ap;
    jogo.definirAparencia(ap);
    if (origemEditor === "jogo") {
      jogo.visualTrocado();
      aviso("Visual novo! Sua aparência já está no jogo.");
      jogo.estado = "jogando";
      mostrarJogo();
    } else if (modo === "criar") {
      comecarPartida();
    } else {
      mostrarTitulo();
      aviso("Aparência salva.");
    }
  },
  aoVoltar: () => {
    if (origemEditor === "jogo") {
      jogo.estado = "jogando";
      mostrarJogo();
    } else mostrarTitulo();
  },
});

const telaCheia = new TelaCheia({
  aoMudar: () => tela.reajustar(),
  aoAvisar: (msg, importante) => {
    if (importante) {
      $("aviso-telacheia-texto").textContent = msg;
      abrirModal("aviso-telacheia");
    } else aviso(msg, { dur: 3500 });
  },
});

// ---------------------------------------------------------------- Opções
function aplicarOpcoes() {
  audio.definirVolumes(opcoes.musica / 100, opcoes.efeitos / 100);
  entrada.definirSensibilidade(opcoes.sensibilidade);
  document.documentElement.dataset.tamanho = opcoes.tamanho;
  document.documentElement.classList.toggle("mao-esq", opcoes.mao === "esq");
  configurarVibracao(opcoes.vibracao === "sim");
  $("fps").hidden = opcoes.fps !== "sim";
  jogo.qualidade = NIVEIS[opcoes.qualidade === "auto" ? nivelAuto : opcoes.qualidade];
  $("op-musica").value = opcoes.musica;
  $("op-efeitos").value = opcoes.efeitos;
  for (const seg of document.querySelectorAll(".segmentado")) {
    for (const b of seg.children) b.setAttribute("aria-pressed", String(opcoes[seg.dataset.op] === b.dataset.v));
  }
  gravar("opcoes", opcoes);
}
$("op-musica").addEventListener("input", (e) => { opcoes.musica = +e.target.value; aplicarOpcoes(); });
$("op-efeitos").addEventListener("input", (e) => { opcoes.efeitos = +e.target.value; aplicarOpcoes(); });
$("op-efeitos").addEventListener("change", () => audio.efeito("selecao"));
for (const seg of document.querySelectorAll(".segmentado")) {
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    opcoes[seg.dataset.op] = b.dataset.v;
    audio.efeito("selecao");
    aplicarOpcoes();
  });
}
$("op-apagar").addEventListener("click", () => {
  if (!confirm("Apagar o progresso da vila? Sua aparência continua salva.")) return;
  jogo.apagarProgresso();
  aviso("Progresso apagado.");
  atualizarBotaoJogar();
});
for (const b of document.querySelectorAll(".fechar-modal")) {
  b.addEventListener("click", () => {
    audio.efeito("toque");
    const m = b.closest(".modal");
    m.hidden = true;
    if (m.id === "opcoes" && jogo.estado === "pausa") abrirModal("pausa");
  });
}

// ---------------------------------------------------------------- Telas
function esconderTudo() {
  for (const id of ["carregando", "titulo", "hud", "toque", "dialogo"]) $(id).hidden = true;
  for (const m of document.querySelectorAll(".modal")) m.hidden = true;
}

function atualizarBotaoJogar() {
  const p = ler("progresso");
  $("btn-jogar").textContent = aparencia && p && p.tempo > 5 ? "Continuar" : "Jogar";
}

function mostrarTitulo() {
  esconderTudo();
  editor.fechar();
  jogo.estado = "titulo";
  entrada.ativo = false;
  $("titulo").hidden = false;
  atualizarBotaoJogar();
  $("btn-aparencia").textContent = aparencia ? "Meu personagem" : "Criar personagem";
}

function mostrarJogo() {
  esconderTudo();
  $("hud").hidden = false;
  $("toque").hidden = false;
  entrada.ativo = true;
  atualizarHud(true);
}

function abrirEditor(modo, origem) {
  origemEditor = origem;
  if (origem === "jogo") {
    jogo.estado = "editor";
    entrada.ativo = false;
    entrada.soltar();
  }
  esconderTudo();
  editor.abrir(modo, aparencia);
}

function comecarPartida() {
  mostrarJogo();
  jogo.definirAparencia(aparencia);
  jogo.iniciarPartida();
  audio.iniciarMusica();
}

$("btn-jogar").addEventListener("click", () => {
  audio.destravar();
  audio.efeito("abrir");
  if (!aparencia) abrirEditor("criar", "titulo");
  else comecarPartida();
});
$("btn-aparencia").addEventListener("click", () => {
  audio.destravar();
  audio.efeito("abrir");
  abrirEditor(aparencia ? "editar" : "criar", "titulo");
});
$("btn-opcoes-titulo").addEventListener("click", () => { audio.destravar(); audio.efeito("abrir"); abrirModal("opcoes"); });

// ---------------------------------------------------------------- HUD e menus
$("btn-pausa").addEventListener("click", () => abrirPausa());
$("btn-diario").addEventListener("click", () => abrirDiario());
$("pausa-continuar").addEventListener("click", () => fecharPausa());
$("pausa-aparencia").addEventListener("click", () => { fecharModal("pausa"); jogo.estado = "jogando"; abrirEditor("editar", "jogo"); });
$("pausa-opcoes").addEventListener("click", () => { fecharModal("pausa"); abrirModal("opcoes"); });
$("pausa-titulo").addEventListener("click", () => { jogo.salvar(); audio.pararMusica(); mostrarTitulo(); });
$("fim-continuar").addEventListener("click", () => { fecharModal("fim"); audio.efeito("toque"); });
$("dialogo").addEventListener("click", () => entrada.disparar("interagir"));

const btnAcao = $("btn-acao");
btnAcao.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  btnAcao.classList.add("pressionado");
  entrada.disparar("interagir");
  vibrar(8);
});
const soltarAcao = () => btnAcao.classList.remove("pressionado");
btnAcao.addEventListener("pointerup", soltarAcao);
btnAcao.addEventListener("pointerleave", soltarAcao);
btnAcao.addEventListener("contextmenu", (e) => e.preventDefault());

function abrirPausa() {
  if (jogo.estado !== "jogando" || jogo.dialogo) return;
  audio.efeito("abrir");
  jogo.pausar(true);
  const folha = folhaDeSprites(aparencia);
  desenharPrevia($("perfil-canvas"), folha, "baixo", 0, LARG, ALT, DIRECOES);
  $("perfil-nome").textContent = aparencia.nome || "Sem nome";
  preencherStats($("perfil-stats"));
  abrirModal("pausa");
}
function fecharPausa() {
  fecharModal("pausa");
  audio.efeito("toque");
  jogo.pausar(false);
}

function preencherStats(ul) {
  const p = jogo.p;
  const min = Math.floor(p.tempo / 60);
  const precisao = p.separados ? Math.round((p.acertosPrimeira / p.separados) * 100) : 0;
  const linhas = [
    ["Vida da vila", `${Math.round(jogo.eco() * 100)}%`],
    ["Lixo separado", `${p.separados} itens (${precisao}% de primeira)`],
    ["Árvores plantadas", p.plantadas.length],
    ["Água poupada", `cerca de ${p.consertos.length * 45} L por dia`],
    ["Energia limpa", `${p.paineis.length} painéis · ${p.apagadas.length} lâmpadas apagadas`],
    ["Trocas de visual", p.trocasVisual],
    ["Tempo de jogo", `${min} min`],
  ];
  ul.replaceChildren(...linhas.map(([a, b]) => {
    const li = document.createElement("li");
    const s1 = document.createElement("span");
    s1.textContent = a;
    const s2 = document.createElement("b");
    s2.textContent = b;
    li.append(s1, s2);
    return li;
  }));
}

function abrirDiario() {
  if (jogo.estado !== "jogando" || jogo.dialogo) return;
  audio.efeito("abrir");
  jogo.entrada.soltar();
  const ul = $("diario-lista");
  ul.replaceChildren();
  for (const m of MISSOES) {
    const v = jogo.progressoMissao(m);
    const li = document.createElement("li");
    if (v >= m.total) li.className = "feita";
    const b = document.createElement("b");
    b.textContent = `${m.nome} — ${v}/${m.total}`;
    const s = document.createElement("span");
    s.textContent = m.desc;
    const pr = document.createElement("div");
    pr.className = "progresso";
    const i = document.createElement("i");
    i.style.width = `${(v / m.total) * 100}%`;
    pr.append(i);
    li.append(b, s, pr);
    ul.append(li);
  }
  const extra = document.createElement("li");
  if (jogo.p.trocasVisual > 0) extra.className = "feita";
  const b = document.createElement("b");
  b.textContent = "Estilo circular (opcional)";
  const s = document.createElement("span");
  s.textContent = "Visite o Brechó Circular e renove o visual sem comprar nada novo.";
  extra.append(b, s);
  ul.append(extra);
  abrirModal("diario");
}

function mostrarFim() {
  const folha = folhaDeSprites(aparencia);
  desenharPrevia($("fim-canvas"), folha, "baixo", 0, LARG, ALT, DIRECOES);
  preencherStats($("fim-stats"));
  abrirModal("fim");
}

let ultimoHud = 0;
let invAnterior = "";
function atualizarHud(forcar) {
  const agora = performance.now();
  if (!forcar && agora - ultimoHud < 200) return;
  ultimoHud = agora;
  const e = Math.round(jogo.eco() * 100);
  $("hud-eco").style.width = `${e}%`;
  $("hud-eco-txt").textContent = `${e}%`;
  const obj = jogo.objetivo ?? jogo.objetivoAtual();
  const txt = obj ? obj.texto : e >= 100 ? "A vila está viva! Explore à vontade." : "";
  if ($("hud-missao").dataset.t !== txt) {
    $("hud-missao").dataset.t = txt;
    $("hud-missao").innerHTML = txt; // textos fixos do próprio jogo
  }
  const p = jogo.p;
  const inv = `${p.sacola.length}|${p.mudas}|${p.paineisInv}|${p.ferramenta}`;
  if (inv !== invAnterior) {
    invAnterior = inv;
    const box = $("hud-inv");
    box.replaceChildren();
    const chip = (icone, texto, rotulo) => {
      const s = document.createElement("span");
      s.setAttribute("aria-label", rotulo);
      if (icone) { const c = document.createElement("canvas"); c.width = 12; c.height = 12; c.getContext("2d").drawImage(icone, 0, 0); s.append(c); }
      s.append(texto);
      box.append(s);
    };
    chip(iconeLixo("sacola"), `${p.sacola.length}/6`, "Sacola");
    if (p.mudas) chip(null, `Mudas ${p.mudas}`, "Mudas");
    if (p.paineisInv) chip(null, `Painéis ${p.paineisInv}`, "Painéis");
  }
  const f = jogo.foco;
  btnAcao.classList.toggle("inativo", !f);
  $("btn-acao-texto").textContent = f ? f.rotulo : "Interagir";
}

// ---------------------------------------------------------------- Laço
let anterior = performance.now();
let acumFps = 0, quadros = 0, janelaQ = 0, piorMedio = 0;
function laco(agora) {
  const dt = Math.min(0.05, (agora - anterior) / 1000);
  anterior = agora;
  const acoes = jogo.atualizar(dt) || [];
  for (const a of acoes) {
    if (a === "pausa") {
      if (!$("pausa").hidden) fecharPausa();
      else if (!modalAberto()) abrirPausa();
    }
    if (a === "diario") { if (!$("diario").hidden) fecharModal("diario"); else if (!modalAberto()) abrirDiario(); }
    if (a === "telacheia") telaCheia.alternar();
  }
  if (jogo.estado !== "editor") jogo.desenhar();
  if (jogo.estado === "jogando") atualizarHud(false);
  if (jogo.estado === "titulo" && aparencia && !$("titulo").hidden) {
    desenharPrevia($("titulo-canvas"), folhaDeSprites(aparencia), "baixo", Math.floor(agora / 600) % 2, LARG, ALT, DIRECOES);
  }
  // FPS e qualidade automática
  acumFps += dt;
  quadros++;
  if (acumFps >= 1) {
    const fps = quadros / acumFps;
    $("fps").textContent = `${Math.round(fps)} fps · ${tela.w}×${tela.h} ×${tela.escala}`;
    if (opcoes.qualidade === "auto" && jogo.estado === "jogando") {
      janelaQ++;
      piorMedio = piorMedio ? piorMedio * 0.6 + fps * 0.4 : fps;
      if (janelaQ >= 3) {
        janelaQ = 0;
        const ordem = ["baixa", "media", "alta"];
        let i = ordem.indexOf(nivelAuto);
        if (piorMedio < 40 && i > 0) i--;
        else if (piorMedio > 57 && i < 2) i++;
        if (ordem[i] !== nivelAuto) { nivelAuto = ordem[i]; jogo.qualidade = NIVEIS[nivelAuto]; }
      }
    }
    acumFps = 0;
    quadros = 0;
  }
  requestAnimationFrame(laco);
}

// pausa automática ao sair do app/aba
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    jogo.salvar();
    if (jogo.estado === "jogando" && !jogo.dialogo && !modalAberto()) abrirPausa();
    audio.pausarTudo(true);
  } else audio.pausarTudo(false);
});
window.addEventListener("pagehide", () => jogo.salvar());
// primeiro toque libera o áudio
window.addEventListener("pointerdown", () => audio.destravar(), { once: true, capture: true });
// impede gestos de zoom/rolagem acidentais durante a partida
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());

// ---------------------------------------------------------------- Início
async function iniciar() {
  aplicarOpcoes();
  const barra = $("carregando-barra");
  await jogo.preparar((v, txt) => {
    barra.style.width = `${Math.round(v * 100)}%`;
    $("carregando-texto").textContent = txt;
  });
  if (aparencia) jogo.definirAparencia(aparencia);
  barra.style.width = "100%";
  requestAnimationFrame(laco);
  setTimeout(mostrarTitulo, 150);
  if ("serviceWorker" in navigator && location.protocol !== "file:" && !new URLSearchParams(location.search).has("semsw")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
iniciar().catch((e) => {
  $("carregando-texto").textContent = "Não foi possível carregar o jogo. Atualize a página.";
  console.error(e);
});

// Atalhos para testes automatizados
window.__verdejar = { jogo, editor, tela, telaCheia, entrada };
void apagar;
