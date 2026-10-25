// Raízes do Sertão: início, telas (título, editor, fazenda), opções e laço principal.
import { Tela } from "./tela.js";
import { Entrada } from "./entrada.js";
import { Audio } from "./audio.js";
import { Editor } from "./editor.js";
import { TelaCheia } from "./telacheia.js";
import { Fazenda } from "./fazenda.js";
import { UI } from "./painel.js";
import * as E from "./estado.js";
import * as A from "./arte.js";
import { folhaDeSprites, normalizar, LARG, ALT, DIRECOES } from "./personagem.js";
import { ler, gravar } from "./salvar.js";
import { $, aviso, abrirModal, modalAberto, desenharPrevia, configurarVibracao } from "./ui.js";

const OPCOES_PADRAO = { musica: 45, efeitos: 70, sensibilidade: "normal", tamanho: "m", qualidade: "auto", animacoes: "sim", vibracao: "sim", fps: "nao" };
const NIVEIS = { alta: 1, media: 0.6, baixa: 0.3 };

const tela = new Tela($("tela"));
const entrada = new Entrada($("tela"));
const audio = new Audio();
let opcoes = { ...OPCOES_PADRAO, ...(ler("opcoes") || {}) };
let aparencia = ler("aparencia") ? normalizar(ler("aparencia")) : null;
let estado = "carregando"; // titulo | editor | jogando
let origemEditor = "titulo";
let novaDepoisDoEditor = false;
let nivelAuto = "alta";
let ultimoSalvo = 0;
let partidaAtiva = false; // só salva depois de começar ou continuar uma partida

const ui = new UI({
  audio,
  aoEditar: () => abrirEditor("editar", "jogo"),
  aoTitulo: () => { salvar(true); mostrarTitulo(); },
  aoOpcoes: () => abrirModal("opcoes"),
  aoSalvar: () => salvar(false),
});
const faz = new Fazenda({ tela, entrada, audio, ui });

const editor = new Editor({
  audio,
  aoConfirmar: (ap) => {
    aparencia = ap;
    if (origemEditor === "jogo") {
      faz.definirAparencia(ap);
      aviso("Visual novo! Sua aparência já está na fazenda.");
      mostrarJogo();
    } else if (novaDepoisDoEditor) {
      novaDepoisDoEditor = false;
      comecar(E.novoEstado());
    } else {
      mostrarTitulo();
      aviso("Aparência salva.");
    }
  },
  aoVoltar: () => (origemEditor === "jogo" ? mostrarJogo() : mostrarTitulo()),
});

const telaCheia = new TelaCheia({
  aoMudar: () => tela.reajustar(),
  aoAvisar: (msg, importante) => {
    if (importante) { $("aviso-telacheia-texto").textContent = msg; abrirModal("aviso-telacheia"); }
    else aviso(msg, { dur: 3500 });
  },
});

// ---------------------------------------------------------------- Opções
function aplicarOpcoes() {
  audio.definirVolumes(opcoes.musica / 100, opcoes.efeitos / 100);
  entrada.definirSensibilidade(opcoes.sensibilidade);
  document.documentElement.dataset.tamanho = opcoes.tamanho;
  document.documentElement.classList.toggle("sem-animacao", opcoes.animacoes === "nao");
  configurarVibracao(opcoes.vibracao === "sim");
  $("fps").hidden = opcoes.fps !== "sim";
  faz.qualidade = NIVEIS[opcoes.qualidade === "auto" ? nivelAuto : opcoes.qualidade];
  $("op-musica").value = opcoes.musica;
  $("op-efeitos").value = opcoes.efeitos;
  for (const seg of document.querySelectorAll("#opcoes .segmentado")) for (const b of seg.children) b.setAttribute("aria-pressed", String(opcoes[seg.dataset.op] === b.dataset.v));
  gravar("opcoes", opcoes);
}
$("op-musica").addEventListener("input", (e) => { opcoes.musica = +e.target.value; aplicarOpcoes(); });
$("op-efeitos").addEventListener("input", (e) => { opcoes.efeitos = +e.target.value; aplicarOpcoes(); });
for (const seg of document.querySelectorAll("#opcoes .segmentado")) {
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    opcoes[seg.dataset.op] = b.dataset.v;
    audio.efeito("selecao");
    aplicarOpcoes();
  });
}
for (const b of document.querySelectorAll(".fechar-modal")) b.addEventListener("click", () => { audio.efeito("toque"); b.closest(".modal").hidden = true; });

// Botão "Usar": aplica a ferramenta no canteiro à frente (para quem anda arrastando o dedo)
$("btn-usar").addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); if (estado === "jogando" && !faz.pausado) faz.interagirFrente(); });
$("btn-usar").addEventListener("contextmenu", (ev) => ev.preventDefault());

// ícones fixos do HUD
for (const c of document.querySelectorAll("canvas[data-ic]")) {
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.drawImage(A.icone(c.dataset.ic), 0, 0);
}

// ---------------------------------------------------------------- Telas
function esconderTudo() {
  for (const id of ["carregando", "titulo", "hud", "toque", "dialogo", "folha"]) $(id).hidden = true;
  for (const m of document.querySelectorAll(".modal")) m.hidden = true;
  ui.folhaAtual = null;
  ui.dialogo = null;
}

function mostrarTitulo() {
  esconderTudo();
  editor.fechar();
  estado = "titulo";
  entrada.ativo = false;
  $("titulo").hidden = false;
  const tem = E.existeSave();
  $("btn-continuar").hidden = !tem;
  $("btn-nova").classList.toggle("btn-principal", !tem);
  $("btn-aparencia").textContent = aparencia ? "Meu personagem" : "Criar personagem";
  // fundo do título: uma fazenda de exemplo
  if (!faz.e) faz.iniciar(E.carregar() || E.novoEstado(), aparencia || normalizar({}));
}

function mostrarJogo() {
  esconderTudo();
  estado = "jogando";
  $("hud").hidden = false;
  $("toque").hidden = false;
  entrada.ativo = true;
  ui.atualizarHud(true);
}

function abrirEditor(modo, origem) {
  origemEditor = origem;
  estado = "editor";
  entrada.ativo = false;
  entrada.soltar();
  esconderTudo();
  editor.abrir(modo, aparencia);
}

function comecar(est) {
  partidaAtiva = true;
  faz.iniciar(est, aparencia);
  ui.ligar(faz);
  mostrarJogo();
  audio.iniciarMusica();
  salvar(true);
  if (!est.tutorialVisto) {
    est.tutorialVisto = true;
    setTimeout(() => ui.falar([
      { quem: "zefa", texto: "Bem-vindo à roça, {nome}! Eu sou a Vó Zefa." },
      { quem: "zefa", texto: "É assim: escolha uma ferramenta na barra de baixo e toque no quadrado do chão. Você vai andando até lá e faz o serviço sozinho." },
      { quem: "zefa", texto: "Para plantar: Enxada na terra, depois Plantar, depois Regar. Quando aparecer uma estrela amarela, colha com a Mão." },
      { quem: "zefa", texto: "Água aqui é contada! O regador enche na cisterna, ao lado da casa. Se ela secar, a cacimba perto da estrada dá água de graça um pouco por dia, e a chuva enche a cisterna." },
      { quem: "zefa", texto: "Comece pela Enxada nos quadrados amarelos, perto da cerca." },
    ], () => salvar(true)), 600);
  }
}

$("btn-continuar").addEventListener("click", () => {
  audio.destravar();
  const est = E.carregar();
  if (!est) { aviso("Não encontrei a fazenda salva."); return; }
  if (!aparencia) { novaDepoisDoEditor = false; abrirEditor("criar", "titulo"); return; }
  comecar(est);
});
$("btn-nova").addEventListener("click", () => {
  audio.destravar();
  if (E.existeSave() && !confirm("Começar uma fazenda nova? A fazenda salva será substituída.")) return;
  if (!aparencia) { novaDepoisDoEditor = true; abrirEditor("criar", "titulo"); return; }
  comecar(E.novoEstado());
});
$("btn-aparencia").addEventListener("click", () => { audio.destravar(); abrirEditor(aparencia ? "editar" : "criar", "titulo"); });
$("btn-opcoes-titulo").addEventListener("click", () => { audio.destravar(); abrirModal("opcoes"); });

function salvar(forcar) {
  if (!partidaAtiva || !faz.e) return;
  if (estado !== "jogando" && !forcar) return;
  const agora = performance.now();
  if (!forcar && agora - ultimoSalvo < 1500) return;
  ultimoSalvo = agora;
  E.salvarEstado(faz.e);
}

// ---------------------------------------------------------------- Laço
let anterior = performance.now();
let acumFps = 0, quadros = 0, janelaQ = 0, media = 0, tSalvar = 0;
function laco(agora) {
  const dt = Math.min(0.05, (agora - anterior) / 1000);
  anterior = agora;
  if (estado === "jogando" || estado === "titulo") {
    faz.pausado = estado !== "jogando" || ui.aberto || modalAberto() || !!faz.colocando;
    if (faz.colocando) faz.pausado = true;
    const r = faz.atualizar(estado === "jogando" ? dt : 0);
    if (estado === "titulo") { faz.cam.x += Math.sin(agora / 6000) * 0.15; faz.cam.y += Math.cos(agora / 7000) * 0.1; }
    if (estado === "jogando") {
      if (r.eventos?.length) ui.eventos(r.eventos);
      for (const a of r.acoes || []) {
        if (a === "pausa") { if (ui.folhaAtual) ui.fecharFolha(); else ui.abrir({ tipo: "menu" }); }
        if (a === "telacheia") telaCheia.alternar();
        if (a === "interagir" && ui.dialogo) ui.avancarDialogo();
        if (a.startsWith("ferr") && !ui.folhaAtual && !ui.dialogo) {
          const visiveis = [...document.querySelectorAll(".ferr")].filter((b) => !b.hidden);
          const b = visiveis[Number(a.slice(4)) - 1];
          if (b) ui.escolherFerramenta(b.dataset.f);
        }
      }
      ui.atualizarHud(false);
      tSalvar += dt;
      if (tSalvar > 5) { tSalvar = 0; salvar(true); }
    }
    faz.desenhar();
  }
  if (estado === "titulo" && aparencia) desenharPrevia($("titulo-canvas"), folhaDeSprites(aparencia), "baixo", Math.floor(agora / 600) % 2, LARG, ALT, DIRECOES);
  acumFps += dt;
  quadros++;
  if (acumFps >= 1) {
    const fps = quadros / acumFps;
    $("fps").textContent = `${Math.round(fps)} fps · ${tela.w}×${tela.h} ×${tela.escala}`;
    if (opcoes.qualidade === "auto" && estado === "jogando") {
      media = media ? media * 0.6 + fps * 0.4 : fps;
      if (++janelaQ >= 3) {
        janelaQ = 0;
        const ordem = ["baixa", "media", "alta"];
        let i = ordem.indexOf(nivelAuto);
        if (media < 40 && i > 0) i--;
        else if (media > 57 && i < 2) i++;
        nivelAuto = ordem[i];
        faz.qualidade = NIVEIS[nivelAuto];
      }
    }
    acumFps = 0;
    quadros = 0;
  }
  requestAnimationFrame(laco);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { salvar(true); audio.pausarTudo(true); }
  else audio.pausarTudo(false);
});
window.addEventListener("pagehide", () => salvar(true));
window.addEventListener("pointerdown", () => audio.destravar(), { once: true, capture: true });
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());

async function iniciar() {
  aplicarOpcoes();
  const barra = $("carregando-barra");
  const passo = (v, t) => new Promise((r) => { barra.style.width = `${v * 100}%`; $("carregando-texto").textContent = t; setTimeout(r, 0); });
  await passo(0.2, "Preparando a terra…");
  faz.preparar();
  await passo(0.7, "Chamando a vizinhança…");
  for (const id of ["coentro", "alface", "feijao", "milho"]) for (let k = 0; k < 4; k++) A.culturaSprite(id, k);
  await passo(1, "Pronto!");
  requestAnimationFrame(laco);
  mostrarTitulo();
  if ("serviceWorker" in navigator && location.protocol !== "file:" && !new URLSearchParams(location.search).has("semsw")) navigator.serviceWorker.register("sw.js").catch(() => {});
}
iniciar().catch((err) => {
  $("carregando-texto").textContent = "Não foi possível carregar o jogo. Atualize a página.";
  console.error(err);
});

window.__raizes = { faz, ui, tela, editor, telaCheia, entrada, E };
