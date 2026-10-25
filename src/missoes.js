// Missões da comunidade: cada uma tem quem pede, etapas verificáveis, recompensa e
// o que se aprende. As etapas usam o próprio estado da fazenda (nada é só texto).
import * as E from "./estado.js";
import { CULTURAS } from "./dados.js";
import { matoNaMandala, diversidadeMandala, adubadosMandala, avaliarPreparo } from "./acoes.js";
import { massaPilha, cnPilha } from "./simulacao.js";

export const PESSOAS = {
  zefa: { nome: "Vó Zefa", ap: { pele: "#a86a3c", corpo: "curvas", rosto: "redondo", olhos: "serenos", detalhes: ["bochechas"], cabelo: "coque", corCabelo: "#ecebe6", cima: "vestido", corCima: "#3c6fcf", cor2Cima: "#f1d04b", estampaCima: "chita", baixo: "saiaLonga", corBaixo: "#3c6fcf", calcado: "sandalias", corCalcado: "#7a5236", cabeca: "chapeuPalha", corCabeca: "#d0443a", rostoAc: "oculos" } },
  ana: { nome: "Técnica Ana", ap: { pele: "#6d3e22", corpo: "curvas", rosto: "oval", olhos: "cilios", cabelo: "trancas", corCabelo: "#1f1a1c", cima: "colete", corCima: "#2d7a37", cor2Cima: "#f2efe6", baixo: "calca", corBaixo: "#7a5236", materialBaixo: "canhamo", calcado: "botas", corCalcado: "#3e4147", cabeca: "bone", corCabeca: "#2d7a37", costas: "mochila", corCostas: "#d9a93a" } },
  raimundo: { nome: "Seu Raimundo", ap: { pele: "#c4844f", corpo: "largo", rosto: "quadrado", olhos: "pontos", detalhes: ["bigode"], cabelo: "curto", corCabelo: "#a9a7a3", cima: "flanela", corCima: "#3c6fcf", cor2Cima: "#24252a", baixo: "calca", corBaixo: "#4a6fa5", calcado: "botaCano", corCalcado: "#7a5236", cabeca: "chapeuVaqueiro", corCabeca: "#b07a3a" } },
  rita: { nome: "Dona Rita", ap: { pele: "#eab58c", corpo: "reto", rosto: "oval", olhos: "alegres", detalhes: ["sardas"], cabelo: "chanel", corCabelo: "#a8461f", cima: "avental", corCima: "#d0443a", cor2Cima: "#f2efe6", estampaCima: "chita", baixo: "saia", corBaixo: "#4d6b3a", calcado: "sandalias", corCalcado: "#c0663f", cabeca: "lenco", corCabeca: "#f1d04b" } },
  joaquim: { nome: "Técnico Joaquim", ap: { pele: "#52301b", corpo: "largo", rosto: "longo", olhos: "pontos", detalhes: ["barba"], cabelo: "degrade", corCabelo: "#1f1a1c", cima: "camisa", corCima: "#f2efe6", cor2Cima: "#2d7a37", baixo: "calca", corBaixo: "#2b3a66", calcado: "botas", corCalcado: "#3e4147", cabeca: "chapeuBalde", corCabeca: "#b9a173", costas: "mochila", corCostas: "#2d7a37" } },
};
// onde cada pessoa fica (em tiles)
export const POSICOES = { zefa: [14.2, 8.4], ana: [11.5, 9.6], raimundo: [17.6, 10.4], rita: [9.2, 8.2], joaquim: [24.5, 9.6] };

const P = (e, k) => e.missoes.passos[k] || 0;
const temC = (e, tipo) => e.construcoes.some((c) => c.tipo === tipo);
const pilha = (e) => e.construcoes.find((c) => c.tipo === "composteira")?.pilha;

export const MISSOES = [
  {
    id: "primeirosPassos", pessoa: "zefa", nivel: 1, titulo: "Primeiros passos na roça",
    aprende: "Cada planta precisa de solo preparado, água e tempo.",
    intro: ["Bom dia, {nome}! Essa terra foi do seu bisavô. Tá precisando de mão.", "Vamos começar pequeno: preparar a terra, plantar coentro, regar, colher e vender na banca."],
    passos: [
      { txt: "Escolha a Enxada e toque em 3 quadrados amarelos", ok: (e) => P(e, "preparar") >= 3, ferr: "enxada" },
      { txt: "Escolha Plantar e toque nos 3 canteiros preparados", ok: (e) => P(e, "plantar_coentro") >= 3, ferr: "semente" },
      { txt: "Escolha Regar e toque nos canteiros", ok: (e) => P(e, "regar") >= 3, ferr: "regador" },
      { txt: "Espere a estrela amarela aparecer e colha com a Mão", ok: (e) => P(e, "colher_coentro") >= 3, ferr: "mao" },
      { txt: "Toque na banca (toldo listrado) e venda", ok: (e) => P(e, "vender") >= 3, alvo: "banca" },
    ],
    premio: { moedas: 60, xp: 30, itens: { sem_alface: 4, sem_feijao: 3 } },
    fim: ["Isso! Viu como cada planta tem seu tempo? Alface pede mais água, feijão-de-corda aguenta mais o sol.", "Fique de olho na cisterna: água no sertão é ouro."],
  },
  {
    id: "feira", pessoa: "rita", nivel: 2, titulo: "Abastecer a comunidade",
    aprende: "Vender perto, para quem está perto, reduz desperdício e fortalece a agricultura familiar.",
    intro: ["Oi, {nome}! Tem muita gente aqui querendo comida fresca da roça.", "Atenda pedidos no quadro ao lado da banca. A cada 7 dias tem feira, e tudo vende mais caro!"],
    passos: [
      { txt: "Entregue 3 pedidos do quadro", ok: (e) => P(e, "pedidos") >= 3, alvo: "quadro" },
      { txt: "Venda 5 produtos num dia de feira", ok: (e) => P(e, "vendaFeira") >= 5, alvo: "banca" },
    ],
    premio: { moedas: 120, xp: 50, itens: { sem_milho: 4 } },
    fim: ["A feira ficou bonita com seus produtos! Comida boa, preço justo."],
  },
  {
    id: "composteira", pessoa: "ana", nivel: 2, titulo: "A composteira",
    aprende: "Restos de plantas viram adubo com equilíbrio entre material seco e verde, umidade, ar e tempo.",
    intro: ["Olá! Sou a Ana, técnica de extensão rural. Vi que você joga fora restos de plantas.", "Com uma composteira, isso vira adubo! Primeiro, junte galhos perto das árvores para montar a estrutura.", "Escolha um lugar à sombra e perto da roça: a pilha seca menos e fica fácil de cuidar."],
    passos: [
      { txt: "Junte 6 galhos catando perto das árvores", ok: (e) => P(e, "galhos") >= 6, ferr: "mao" },
      { txt: "Construa a composteira (menu Construir)", ok: (e) => temC(e, "composteira"), alvo: "construir" },
      { txt: "Separe o balde da cozinha: o que pode ir para a composteira?", ok: (e) => P(e, "balde") >= 1, alvo: "composteira" },
      { txt: "Monte a pilha com material seco e verde (mistura equilibrada)", ok: (e) => { const p = pilha(e); return (p && massaPilha(p) >= 8 && cnPilha(p) >= 20 && cnPilha(p) <= 42) || P(e, "compostoColetado") > 0; }, alvo: "composteira" },
      { txt: "Regue e revire a pilha", ok: (e) => P(e, "regarPilha") >= 1 && P(e, "revirar") >= 1, alvo: "composteira" },
      { txt: "Espere a maturação e colete o composto", ok: (e) => P(e, "compostoColetado") >= 1, alvo: "composteira" },
      { txt: "Aplique composto em 3 canteiros", ok: (e) => P(e, "compostoAplicado") >= 3, ferr: "adubo" },
    ],
    premio: { moedas: 100, xp: 70, itens: { kitGotejo: 2 } },
    fim: ["Parabéns! O composto alimenta o solo devagar e de forma duradoura.", "Agora, sempre que colher, guarde os restos para a próxima pilha."],
  },
  {
    id: "soloCansado", pessoa: "raimundo", nivel: 3, titulo: "Recuperar o solo",
    aprende: "Cobertura do solo, composto e rotação com leguminosas recuperam a terra cansada.",
    intro: ["Ô, {nome}! Meu canteiro não dá mais nada. Plantei milho no mesmo lugar anos seguidos…", "Me ensina a cuidar da terra como você tá fazendo?"],
    passos: [
      { txt: "Cubra 4 canteiros com palha", ok: (e) => P(e, "cobrir") >= 4, ferr: "palha" },
      { txt: "Deixe 3 canteiros com fertilidade 70 ou mais", ok: (e) => Object.values(e.tiles).filter((t) => !t.mandala && t.f >= 70).length >= 3, ferr: "adubo" },
      { txt: "Faça rotação: plante feijão onde já colheu outra cultura", ok: (e) => P(e, "rotacao") >= 1, ferr: "semente" },
    ],
    premio: { moedas: 110, xp: 60, itens: { sem_couve: 3, sem_tomate: 3 } },
    fim: ["Olha a diferença! Terra coberta, adubada e com rotação produz mais e por mais tempo."],
  },
  {
    id: "galinhas", pessoa: "zefa", nivel: 3, titulo: "Galinhas no terreiro",
    aprende: "Animais precisam de comida, água e abrigo todo dia; o esterco vira adubo depois de compostado.",
    intro: ["Uma fazenda fica mais completa com umas galinhas. Ovo fresco todo dia!", "Mas não esqueça: comida e água todos os dias."],
    passos: [
      { txt: "Construa o galinheiro", ok: (e) => temC(e, "galinheiro"), alvo: "construir" },
      { txt: "Colete 6 ovos (comida e água em dia)", ok: (e) => P(e, "ovosColetados") >= 6, alvo: "galinheiro" },
      { txt: "Leve esterco para a composteira", ok: (e) => P(e, "estercoComposto") >= 1, alvo: "composteira" },
    ],
    premio: { moedas: 90, xp: 60, itens: { racao: 6 } },
    fim: ["Esterco cru queima a planta; compostado, vira um adubo ótimo."],
  },
  {
    id: "mandala", pessoa: "ana", nivel: 4, titulo: "A mandala agrícola",
    aprende: "Canteiros em círculo ao redor da água aproveitam espaço e distribuem a irrigação com pouco desperdício.",
    intro: ["{nome}, quer montar uma mandala? São canteiros em círculos em volta de um reservatório de água.", "Perto do centro ficam as plantas que pedem mais água; nos círculos de fora, as maiores e mais resistentes.", "Primeiro, escolha o lugar. Abra o painel da mandala no menu."],
    passos: [
      { txt: "Escolha o local da mandala", ok: (e) => e.mandala.etapa >= 1, alvo: "mandala" },
      { txt: "Limpe o mato do círculo com a enxada", ok: (e) => e.mandala.etapa >= 2, ferr: "enxada", alvoMandala: true },
      { txt: "Defina anéis de canteiros e caminhos", ok: (e) => e.mandala.etapa >= 3, alvo: "mandala" },
      { txt: "Construa o reservatório central", ok: (e) => e.mandala.etapa >= 4, alvo: "mandala" },
      { txt: "Planeje a irrigação", ok: (e) => e.mandala.etapa >= 5, alvo: "mandala" },
      { txt: "Adube 6 canteiros da mandala com composto ou húmus", ok: (e) => adubadosMandala(e) >= 6, ferr: "adubo", alvoMandala: true },
      { txt: "Plante 4 culturas diferentes na mandala", ok: (e) => diversidadeMandala(e) >= 4, ferr: "semente", alvoMandala: true },
    ],
    premio: { moedas: 200, xp: 120, itens: { sem_abobora: 3 } },
    fim: ["Que beleza! A mandala agora é uma área produtiva permanente.", "Abasteça o reservatório e acompanhe o consumo de água no painel."],
  },
  {
    id: "seca", pessoa: "zefa", nivel: 4, titulo: "Preparar para a estiagem",
    aprende: "Na seca, ganha quem se prepara antes: guardar água, cobrir o solo, regar na raiz e escolher plantas adaptadas.",
    intro: ["{nome}, a estiagem sempre volta. Quem se prepara na chuva atravessa a seca.", "Guarde água, cubra o chão, use gotejamento e plante o que aguenta o sol."],
    passos: [
      { txt: "Instale calhas para captar água da chuva (cisterna)", ok: (e) => e.calha, alvo: "cisterna" },
      { txt: "Mantenha a cisterna com 70% ou mais", ok: (e) => e.cisterna.agua / e.cisterna.cap >= 0.7 || e.seca.preparado, alvo: "cisterna" },
      { txt: "Cubra com palha 6 canteiros plantados", ok: (e) => avaliarPreparo(e).cobertura >= 6 || e.seca.preparado, ferr: "palha" },
      { txt: "Instale gotejamento em 4 canteiros plantados", ok: (e) => avaliarPreparo(e).gotejo >= 4 || e.seca.preparado, ferr: "gotejo" },
      { txt: "Tenha 2 culturas adaptadas plantadas (feijão, abóbora, mandioca, palma…)", ok: (e) => avaliarPreparo(e).adaptadas >= 2 || e.seca.preparado, ferr: "semente" },
      { txt: "Atravesse uma estiagem com 80% das plantas vivas", ok: (e) => e.seca.resultado >= 0.8, info: true },
    ],
    premio: { moedas: 220, xp: 140, itens: { sem_mandioca: 4, sem_palma: 2 } },
    fim: ["Atravessou a seca! Não é milagre: é planejamento.", "Cobertura e gotejamento ajudam muito, mas só funcionam se tiver água guardada."],
  },
  {
    id: "sisteminha", pessoa: "joaquim", nivel: 6, titulo: "Produção integrada: Sisteminha",
    aprende: "No Sisteminha da Embrapa, peixes, horta, animais e compostagem se ajudam: o que sobra de um módulo alimenta o outro.",
    intro: ["Bom dia! Sou o Joaquim. Trabalho com o Sisteminha, uma tecnologia da Embrapa para produzir alimento em pouco espaço.", "O módulo básico é um tanque de peixes. Dele saem água rica em nutrientes para a horta e sedimento para a compostagem.", "No jogo, tudo é simplificado. Abra o painel do Sisteminha no menu para planejar."],
    passos: [
      { txt: "Planeje os módulos no painel do Sisteminha", ok: (e) => e.sisteminha.etapa >= 1, alvo: "sisteminha" },
      { txt: "Construa o tanque de peixes", ok: (e) => temC(e, "tanque"), alvo: "construir" },
      { txt: "Encha o tanque e solte os alevinos", ok: (e) => P(e, "alevinos") >= 1, alvo: "tanque" },
      { txt: "Alimente os peixes 3 vezes", ok: (e) => P(e, "alimentarPeixes") >= 3, alvo: "tanque" },
      { txt: "Renove a água e regue a horta com ela (3 regas)", ok: (e) => P(e, "aguaTanqueHorta") >= 3, alvo: "tanque" },
      { txt: "Construa os módulos que você planejou", ok: (e) => (e.sisteminha.plano || []).every((m) => m === "horta" || m === "fruteiras" || temC(e, m)), alvo: "construir" },
      { txt: "Leve sedimento ou esterco para a composteira ou o minhocário", ok: (e) => P(e, "lodo") + P(e, "estercoComposto") >= 2, alvo: "tanque" },
      { txt: "Faça a despesca no fim do ciclo", ok: (e) => P(e, "despesca") >= 1, alvo: "tanque" },
    ],
    premio: { moedas: 300, xp: 200, itens: { alevinos: 1, sem_acerola: 2 } },
    fim: ["Isso é produção integrada! Nada se perde: o resíduo de um vira recurso do outro.", "Para montar um de verdade, procure os materiais da Embrapa e a assistência técnica da sua região."],
  },
  {
    id: "cabras", pessoa: "raimundo", nivel: 6, titulo: "Cabras e palma",
    aprende: "A palma forrageira aguenta a seca e alimenta os animais quando o pasto some.",
    intro: ["Cabra é bicho forte do sertão! Mas precisa de comida quando o pasto seca.", "Plante palma forrageira: ela guarda água e vira comida na estiagem."],
    passos: [
      { txt: "Plante palma forrageira", ok: (e) => P(e, "plantar_palma") >= 2, ferr: "semente" },
      { txt: "Construa o cercado de cabras", ok: (e) => temC(e, "cercado"), alvo: "construir" },
      { txt: "Alimente as cabras com palma", ok: (e) => P(e, "palmaCabras") >= 1, alvo: "cercado" },
      { txt: "Colete 4 litros de leite", ok: (e) => P(e, "leiteColetado") >= 4, alvo: "cercado" },
    ],
    premio: { moedas: 160, xp: 100 },
    fim: ["Palma no roçado, cabra satisfeita, leite na mesa."],
  },
  {
    id: "diversidade", pessoa: "rita", nivel: 5, titulo: "Prato colorido",
    aprende: "Diversificar as culturas protege contra pragas, perdas e garante alimentação variada.",
    intro: ["A comunidade quer variedade! Quanto mais tipos de alimento, melhor a mesa e menor o risco."],
    passos: [
      { txt: "Colha 7 culturas diferentes", ok: (e) => Object.keys(e.stats.colhidas).length >= 7, ferr: "mao" },
    ],
    premio: { moedas: 150, xp: 90, itens: { sem_melancia: 3 } },
    fim: ["Que fartura! Diversidade é segurança."],
  },
];

export function missao(id) {
  return MISSOES.find((m) => m.id === id);
}

// Missões disponíveis para começar (nível e pessoa).
export function disponiveis(e) {
  const n = E.nivel(e);
  return MISSOES.filter((m) => m.nivel <= n && !e.missoes.ativas.includes(m.id) && !e.missoes.feitas.includes(m.id));
}
export function passoAtual(e, m) {
  return m.passos.findIndex((p) => !p.ok(e));
}
// Devolve as missões que terminaram agora (para dar o prêmio).
export function verificar(e) {
  const prontas = [];
  for (const id of [...e.missoes.ativas]) {
    const m = missao(id);
    if (m && m.passos.every((p) => p.ok(e))) prontas.push(m);
  }
  // mandala: terreno limpo libera a próxima etapa
  if (e.mandala.etapa === 1 && matoNaMandala(e) === 0) e.mandala.etapa = 2;
  if (e.mandala.etapa === 5 && adubadosMandala(e) >= 6 && diversidadeMandala(e) >= 4) e.mandala.etapa = 6;
  return prontas;
}

// Seca: no começo da estiagem guarda as plantas vivas; no fim, mede quantas sobreviveram.
export function inicioSeca(e) {
  const prep = avaliarPreparo(e);
  e.seca.preparado = prep.cobertura >= 6 && prep.gotejo >= 4 && prep.adaptadas >= 2 && e.cisterna.agua / e.cisterna.cap >= 0.7;
  e.seca.inicio = Object.entries(e.tiles).filter(([, t]) => t.c && !t.morta).map(([k]) => k);
}
export function fimSeca(e) {
  const ids = e.seca.inicio || [];
  if (ids.length < 4) return null;
  const vivas = ids.filter((k) => { const t = e.tiles[k]; return t && !t.morta; }).length;
  const r = vivas / ids.length;
  if (e.missoes.ativas.includes("seca")) e.seca.resultado = Math.max(e.seca.resultado || 0, r);
  e.seca.inicio = null;
  return r;
}
export { CULTURAS };
