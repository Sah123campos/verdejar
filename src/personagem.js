// Personagem: catálogo de opções de aparência e gerador de sprites 24x32 em pixel art.
// O mesmo gerador desenha o protagonista (com a aparência escolhida pelo jogador)
// e os moradores da vila. Cada quadro é montado em camadas: cabelo de trás, pernas,
// calçado, tronco, braços, cabeça, rosto, cabelo da frente e acessórios.
import { Pixmap, Mascara, rgb, misturar, escurecer, clarear, hash, ruido, criarCanvas, hexValido } from "./pixel.js";

export const LARG = 24;
export const ALT = 32;
export const DIRECOES = ["baixo", "esq", "dir", "cima"];
export const QUADROS = 6; // 0-1 parado, 2-5 andando

// ---------------------------------------------------------------- Catálogo
export const PELES = ["#ffe3cc", "#f7d0ad", "#eab58c", "#d99f6c", "#c4844f", "#a86a3c", "#8b532f", "#6d3e22", "#52301b", "#3c2215"];
export const CORES_CABELO = [
  "#1f1a1c", "#3d2618", "#6b4226", "#a8461f", "#c96d2e", "#b48a4a", "#e6c57e", "#f2e9d4",
  "#a9a7a3", "#ecebe6", "#3b6fd8", "#4c8a3a", "#e67aa6", "#9b7ad8", "#2fb3a8", "#f08a2c",
];
export const CORES_ROUPA = [
  "#f2efe6", "#e8dcc0", "#9a9a96", "#3e4147", "#24252a", "#d0443a", "#c0663f", "#ee8a2e",
  "#d9a93a", "#f1d04b", "#5aa847", "#4d6b3a", "#8fd6b0", "#2aa7a0", "#6fb4e8", "#3c6fcf",
  "#2b3a66", "#a58ad6", "#6c4aa6", "#ee8fb3", "#8a2f48", "#7a5236", "#b9a173", "#4a6fa5",
];
export const CORES_OLHOS = ["#5a3a22", "#2a1d17", "#a86f2c", "#4f8a4a", "#4a7fc0", "#7d8a93"];

export const ROSTOS = [
  { id: "oval", nome: "Oval" },
  { id: "redondo", nome: "Redondo" },
  { id: "quadrado", nome: "Quadrado" },
  { id: "coracao", nome: "Coração" },
  { id: "longo", nome: "Alongado" },
];
export const CORPOS = [
  { id: "reto", nome: "Reto" },
  { id: "largo", nome: "Ombros largos" },
  { id: "curvas", nome: "Com curvas" },
];
export const OLHOS = [
  { id: "pontos", nome: "Pontinhos" },
  { id: "grandes", nome: "Grandes" },
  { id: "alegres", nome: "Alegres" },
  { id: "cilios", nome: "Com cílios" },
  { id: "serenos", nome: "Serenos" },
];
export const DETALHES = [
  { id: "bochechas", nome: "Bochechas" },
  { id: "sardas", nome: "Sardas" },
  { id: "pinta", nome: "Pinta" },
  { id: "bigode", nome: "Bigode" },
  { id: "barba", nome: "Barba" },
  { id: "curativo", nome: "Curativo" },
];

// topo: textura | franja: forma na testa | comp: comprimento (0 a 5) | vol: volume extra | extra: penteado
export const CABELOS = [
  { id: "careca", nome: "Sem cabelo", topo: "careca", franja: "nenhuma", comp: 0, vol: 0 },
  { id: "raspado", nome: "Raspado", topo: "raspado", franja: "nenhuma", comp: 0, vol: 0 },
  { id: "curto", nome: "Curto", topo: "liso", franja: "lateral", comp: 1, vol: 0 },
  { id: "social", nome: "Social", topo: "liso", franja: "social", comp: 1, vol: 0, extra: "risca" },
  { id: "degrade", nome: "Degradê", topo: "degrade", franja: "nenhuma", comp: 0, vol: 0 },
  { id: "topete", nome: "Topete", topo: "espetado", franja: "topete", comp: 1, vol: 0 },
  { id: "moicano", nome: "Moicano", topo: "moicano", franja: "nenhuma", comp: 0, vol: 0 },
  { id: "chanel", nome: "Chanel", topo: "liso", franja: "reta", comp: 2, vol: 0 },
  { id: "repartido", nome: "Repartido", topo: "liso", franja: "meio", comp: 3, vol: 0 },
  { id: "ondulado", nome: "Ondulado", topo: "ondulado", franja: "lateral", comp: 3, vol: 1 },
  { id: "longo", nome: "Longo liso", topo: "liso", franja: "reta", comp: 4, vol: 0 },
  { id: "muitoLongo", nome: "Muito longo", topo: "liso", franja: "meio", comp: 5, vol: 0 },
  { id: "cacheado", nome: "Cacheado", topo: "cacheado", franja: "meio", comp: 3, vol: 1 },
  { id: "blackPower", nome: "Black power", topo: "crespo", franja: "nenhuma", comp: 2, vol: 3 },
  { id: "rabo", nome: "Rabo de cavalo", topo: "liso", franja: "lateral", comp: 1, vol: 0, extra: "rabo" },
  { id: "coque", nome: "Coque alto", topo: "liso", franja: "nenhuma", comp: 1, vol: 0, extra: "coque" },
  { id: "doisCoques", nome: "Dois coques", topo: "liso", franja: "reta", comp: 1, vol: 0, extra: "doisCoques" },
  { id: "trancas", nome: "Tranças", topo: "liso", franja: "meio", comp: 1, vol: 0, extra: "trancas" },
  { id: "dreads", nome: "Dreads", topo: "cacheado", franja: "nenhuma", comp: 4, vol: 1, extra: "dreads" },
  { id: "curtoCacheado", nome: "Cachinhos curtos", topo: "cacheado", franja: "nenhuma", comp: 1, vol: 1 },
];

export const PARTES_CIMA = [
  { id: "camiseta", nome: "Camiseta", manga: 1 },
  { id: "regata", nome: "Regata", manga: 0 },
  { id: "mangaLonga", nome: "Manga longa", manga: 2 },
  { id: "camisa", nome: "Camisa", manga: 1 },
  { id: "cropped", nome: "Cropped", manga: 1 },
  { id: "moletom", nome: "Moletom", manga: 2 },
  { id: "jaqueta", nome: "Jaqueta", manga: 2, usaCor2: true },
  { id: "colete", nome: "Colete", manga: 1, usaCor2: true },
  { id: "tech", nome: "Jaqueta tech", manga: 2, usaCor2: true },
  { id: "vestido", nome: "Vestido", manga: 1, saia: 27 },
  { id: "vestidoLongo", nome: "Vestido longo", manga: 0, saia: 28 },
  { id: "jardineira", nome: "Jardineira", manga: 1, usaCor2: true, cobrePernas: true },
  { id: "flanela", nome: "Camisa de flanela", manga: 2, usaCor2: true },
  { id: "macacao", nome: "Macacão de trabalho", manga: 2, cobrePernas: true },
  { id: "avental", nome: "Avental de roça", manga: 1, usaCor2: true },
];
export const PARTES_BAIXO = [
  { id: "calca", nome: "Calça" },
  { id: "cargo", nome: "Calça cargo" },
  { id: "legging", nome: "Legging" },
  { id: "bermuda", nome: "Bermuda" },
  { id: "short", nome: "Short" },
  { id: "saia", nome: "Saia" },
  { id: "saiaLonga", nome: "Saia longa" },
];
export const CALCADOS = [
  { id: "tenis", nome: "Tênis" },
  { id: "canoAlto", nome: "Cano alto" },
  { id: "botas", nome: "Botas" },
  { id: "galochas", nome: "Galochas" },
  { id: "sandalias", nome: "Sandálias" },
  { id: "botaCano", nome: "Bota de cano alto" },
];
export const ACESS_CABECA = [
  { id: "nenhum", nome: "Nada" },
  { id: "bone", nome: "Boné" },
  { id: "chapeuPalha", nome: "Chapéu de palha" },
  { id: "chapeuBalde", nome: "Chapéu bucket" },
  { id: "gorro", nome: "Gorro" },
  { id: "faixa", nome: "Faixa" },
  { id: "coroaFlores", nome: "Coroa de flores" },
  { id: "fones", nome: "Fones" },
  { id: "chapeuVaqueiro", nome: "Chapéu de vaqueiro" },
  { id: "lenco", nome: "Lenço de cabeça" },
];
export const ACESS_ROSTO = [
  { id: "nenhum", nome: "Nada" },
  { id: "oculos", nome: "Óculos" },
  { id: "oculosEscuros", nome: "Óculos escuros" },
  { id: "visor", nome: "Visor neon" },
];
export const ACESS_PESCOCO = [
  { id: "nenhum", nome: "Nada" },
  { id: "cachecol", nome: "Cachecol" },
  { id: "colarSementes", nome: "Colar de sementes" },
  { id: "bandana", nome: "Bandana" },
];
export const ACESS_COSTAS = [
  { id: "nenhum", nome: "Nada" },
  { id: "mochila", nome: "Mochila de lona" },
  { id: "mochilaSolar", nome: "Mochila solar" },
  { id: "ecobag", nome: "Ecobag" },
  { id: "cesto", nome: "Cesto de colheita" },
];
export const ESTAMPAS = [
  { id: "liso", nome: "Lisa" },
  { id: "listras", nome: "Listras" },
  { id: "bolinhas", nome: "Bolinhas" },
  { id: "xadrez", nome: "Xadrez" },
  { id: "folhas", nome: "Folhas" },
  { id: "floral", nome: "Floral" },
  { id: "camuflado", nome: "Camuflado" },
  { id: "degrade", nome: "Degradê" },
  { id: "chita", nome: "Chita" },
];
export const MATERIAIS = [
  { id: "algodao", nome: "Algodão orgânico", info: "Cultivado sem agrotóxicos e com menos água.", eco: true },
  { id: "jeans", nome: "Jeans reciclado", info: "Feito de calças jeans que iam para o lixo.", eco: true },
  { id: "pet", nome: "PET reciclado", info: "Cada peça reaproveita cerca de 10 garrafas.", eco: true },
  { id: "canhamo", nome: "Cânhamo", info: "Fibra resistente que gasta pouca água.", eco: true },
  { id: "retalhos", nome: "Retalhos", info: "Sobras de tecido costuradas de novo (upcycling).", eco: true },
  { id: "tech", nome: "Tecido tech", info: "Fibra reciclada com fios de luz de baixo consumo.", eco: true },
];

// Estilos prontos: só trocam roupas e acessórios; corpo e cabelo continuam os do jogador.
export const ESTILOS = [
  {
    id: "casual", nome: "Casual",
    v: { cima: "camiseta", corCima: "#5aa847", cor2Cima: "#f2efe6", estampaCima: "liso", materialCima: "algodao",
      baixo: "calca", corBaixo: "#4a6fa5", estampaBaixo: "liso", materialBaixo: "jeans",
      calcado: "tenis", corCalcado: "#f2efe6", cabeca: "nenhum", rostoAc: "nenhum", pescoco: "nenhum", costas: "nenhum" },
  },
  {
    id: "esportivo", nome: "Esportivo",
    v: { cima: "regata", corCima: "#2aa7a0", cor2Cima: "#f2efe6", estampaCima: "listras", materialCima: "pet",
      baixo: "legging", corBaixo: "#24252a", estampaBaixo: "liso", materialBaixo: "pet",
      calcado: "tenis", corCalcado: "#ee8a2e", cabeca: "faixa", corCabeca: "#f2efe6", rostoAc: "nenhum", pescoco: "nenhum", costas: "nenhum" },
  },
  {
    id: "urbano", nome: "Urbano",
    v: { cima: "moletom", corCima: "#6c4aa6", cor2Cima: "#f1d04b", estampaCima: "liso", materialCima: "algodao",
      baixo: "cargo", corBaixo: "#3e4147", estampaBaixo: "liso", materialBaixo: "canhamo",
      calcado: "canoAlto", corCalcado: "#d0443a", cabeca: "bone", corCabeca: "#24252a", rostoAc: "nenhum", pescoco: "nenhum", costas: "mochila", corCostas: "#d9a93a" },
  },
  {
    id: "futurista", nome: "Futurista",
    v: { cima: "tech", corCima: "#2b3a66", cor2Cima: "#8fd6b0", estampaCima: "liso", materialCima: "tech",
      baixo: "legging", corBaixo: "#3e4147", estampaBaixo: "degrade", materialBaixo: "tech",
      calcado: "botas", corCalcado: "#9a9a96", cabeca: "nenhum", rostoAc: "visor", pescoco: "nenhum", costas: "mochilaSolar", corCostas: "#3e4147" },
  },
  {
    id: "natureza", nome: "Natureza",
    v: { cima: "colete", corCima: "#b9a173", cor2Cima: "#4d6b3a", estampaCima: "liso", materialCima: "canhamo",
      baixo: "bermuda", corBaixo: "#4d6b3a", estampaBaixo: "liso", materialBaixo: "canhamo",
      calcado: "botas", corCalcado: "#7a5236", cabeca: "chapeuPalha", corCabeca: "#5aa847", rostoAc: "nenhum", pescoco: "colarSementes", costas: "ecobag", corCostas: "#e8dcc0" },
  },
  {
    id: "florescer", nome: "Florescer",
    v: { cima: "vestido", corCima: "#f1d04b", cor2Cima: "#ee8fb3", estampaCima: "floral", materialCima: "algodao",
      baixo: "legging", corBaixo: "#4d6b3a", estampaBaixo: "liso", materialBaixo: "algodao",
      calcado: "galochas", corCalcado: "#5aa847", cabeca: "coroaFlores", corCabeca: "#ee8fb3", rostoAc: "nenhum", pescoco: "nenhum", costas: "nenhum" },
  },
  {
    id: "neutro", nome: "Neutro",
    v: { cima: "mangaLonga", corCima: "#9a9a96", cor2Cima: "#e8dcc0", estampaCima: "liso", materialCima: "algodao",
      baixo: "calca", corBaixo: "#3e4147", estampaBaixo: "liso", materialBaixo: "algodao",
      calcado: "tenis", corCalcado: "#24252a", cabeca: "nenhum", rostoAc: "oculos", pescoco: "nenhum", costas: "nenhum" },
  },
  {
    id: "fazenda", nome: "Fazenda",
    v: { cima: "flanela", corCima: "#d0443a", cor2Cima: "#24252a", estampaCima: "xadrez", materialCima: "algodao",
      baixo: "calca", corBaixo: "#4a6fa5", estampaBaixo: "liso", materialBaixo: "jeans",
      calcado: "botaCano", corCalcado: "#7a5236", cabeca: "chapeuVaqueiro", corCabeca: "#b07a3a", rostoAc: "nenhum", pescoco: "bandana", corPescoco: "#f1d04b", costas: "nenhum" },
  },
  {
    id: "colheita", nome: "Colheita",
    v: { cima: "avental", corCima: "#d0443a", cor2Cima: "#f2efe6", estampaCima: "chita", materialCima: "algodao",
      baixo: "saiaLonga", corBaixo: "#3c6fcf", estampaBaixo: "liso", materialBaixo: "algodao",
      calcado: "galochas", corCalcado: "#d9a93a", cabeca: "lenco", corCabeca: "#ee8fb3", rostoAc: "nenhum", pescoco: "nenhum", costas: "cesto" },
  },
  {
    id: "upcycling", nome: "Upcycling",
    v: { cima: "jaqueta", corCima: "#4a6fa5", cor2Cima: "#ee8a2e", estampaCima: "liso", materialCima: "retalhos",
      baixo: "saia", corBaixo: "#c0663f", estampaBaixo: "xadrez", materialBaixo: "retalhos",
      calcado: "canoAlto", corCalcado: "#f2efe6", cabeca: "gorro", corCabeca: "#d9a93a", rostoAc: "nenhum", pescoco: "cachecol", corPescoco: "#8a2f48", costas: "nenhum" },
  },
];

// Visuais completos (corpo, rosto, cabelo e roupa) para começar rápido. Nenhum é
// separado por gênero: são só pontos de partida, e tudo pode ser trocado depois.
export const VISUAIS = [
  { id: "skate", nome: "Skate", v: { pele: "#c4844f", corpo: "largo", rosto: "quadrado", olhos: "pontos", detalhes: [], cabelo: "degrade", corCabelo: "#1f1a1c",
    cima: "moletom", corCima: "#3c6fcf", cor2Cima: "#f1d04b", estampaCima: "liso", materialCima: "algodao", baixo: "cargo", corBaixo: "#b9a173", estampaBaixo: "liso", materialBaixo: "canhamo",
    calcado: "canoAlto", corCalcado: "#24252a", cabeca: "bone", corCabeca: "#d0443a", rostoAc: "nenhum", pescoco: "nenhum", costas: "mochila", corCostas: "#ee8a2e" } },
  { id: "horta", nome: "Horta", v: { pele: "#8b532f", corpo: "curvas", rosto: "redondo", olhos: "grandes", detalhes: ["bochechas"], cabelo: "trancas", corCabelo: "#1f1a1c",
    cima: "vestido", corCima: "#f1d04b", cor2Cima: "#5aa847", estampaCima: "folhas", materialCima: "algodao", baixo: "legging", corBaixo: "#4d6b3a", estampaBaixo: "liso", materialBaixo: "algodao",
    calcado: "galochas", corCalcado: "#5aa847", cabeca: "chapeuPalha", corCabeca: "#d0443a", rostoAc: "nenhum", pescoco: "nenhum", costas: "nenhum" } },
  { id: "trilha", nome: "Trilha", v: { pele: "#eab58c", corpo: "largo", rosto: "quadrado", olhos: "serenos", detalhes: ["barba"], cabelo: "curto", corCabelo: "#6b4226",
    cima: "colete", corCima: "#4d6b3a", cor2Cima: "#e8dcc0", estampaCima: "liso", materialCima: "canhamo", baixo: "bermuda", corBaixo: "#7a5236", estampaBaixo: "liso", materialBaixo: "canhamo",
    calcado: "botas", corCalcado: "#7a5236", cabeca: "chapeuBalde", corCabeca: "#b9a173", rostoAc: "nenhum", pescoco: "bandana", corPescoco: "#d0443a", costas: "mochila", corCostas: "#4d6b3a" } },
  { id: "praia", nome: "Praia", v: { pele: "#d99f6c", corpo: "curvas", rosto: "oval", olhos: "cilios", detalhes: ["sardas"], cabelo: "muitoLongo", corCabelo: "#e6c57e",
    cima: "cropped", corCima: "#2aa7a0", cor2Cima: "#f2efe6", estampaCima: "listras", materialCima: "pet", baixo: "saia", corBaixo: "#f2efe6", estampaBaixo: "floral", materialBaixo: "algodao",
    calcado: "sandalias", corCalcado: "#c0663f", cabeca: "nenhum", rostoAc: "oculosEscuros", pescoco: "colarSementes", costas: "ecobag", corCostas: "#e8dcc0" } },
  { id: "cidade", nome: "Cidade", v: { pele: "#6d3e22", corpo: "reto", rosto: "longo", olhos: "pontos", detalhes: ["bigode"], cabelo: "social", corCabelo: "#1f1a1c",
    cima: "camisa", corCima: "#f2efe6", cor2Cima: "#6fb4e8", estampaCima: "xadrez", materialCima: "algodao", baixo: "calca", corBaixo: "#2b3a66", estampaBaixo: "liso", materialBaixo: "jeans",
    calcado: "tenis", corCalcado: "#7a5236", cabeca: "nenhum", rostoAc: "oculos", pescoco: "nenhum", costas: "nenhum" } },
  { id: "neon", nome: "Neon", v: { pele: "#52301b", corpo: "curvas", rosto: "coracao", olhos: "cilios", detalhes: [], cabelo: "blackPower", corCabelo: "#3d2618",
    cima: "tech", corCima: "#6c4aa6", cor2Cima: "#8fd6b0", estampaCima: "liso", materialCima: "tech", baixo: "legging", corBaixo: "#24252a", estampaBaixo: "degrade", materialBaixo: "tech",
    calcado: "botas", corCalcado: "#f2efe6", cabeca: "nenhum", rostoAc: "visor", pescoco: "nenhum", costas: "mochilaSolar", corCostas: "#3e4147" } },
  { id: "esporte", nome: "Esporte", v: { pele: "#a86a3c", corpo: "largo", rosto: "oval", olhos: "alegres", detalhes: [], cabelo: "raspado", corCabelo: "#1f1a1c",
    cima: "regata", corCima: "#d0443a", cor2Cima: "#f2efe6", estampaCima: "liso", materialCima: "pet", baixo: "short", corBaixo: "#24252a", estampaBaixo: "liso", materialBaixo: "pet",
    calcado: "tenis", corCalcado: "#f2efe6", cabeca: "faixa", corCabeca: "#f2efe6", rostoAc: "nenhum", pescoco: "nenhum", costas: "nenhum" } },
  { id: "arte", nome: "Arte", v: { pele: "#f7d0ad", corpo: "reto", rosto: "oval", olhos: "grandes", detalhes: ["bochechas"], cabelo: "chanel", corCabelo: "#e67aa6",
    cima: "jaqueta", corCima: "#4a6fa5", cor2Cima: "#ee8a2e", estampaCima: "liso", materialCima: "retalhos", baixo: "saiaLonga", corBaixo: "#8a2f48", estampaBaixo: "xadrez", materialBaixo: "retalhos",
    calcado: "canoAlto", corCalcado: "#f2efe6", cabeca: "nenhum", rostoAc: "nenhum", pescoco: "cachecol", corPescoco: "#f1d04b", costas: "nenhum" } },
  { id: "leitura", nome: "Leitura", v: { pele: "#ffe3cc", corpo: "reto", rosto: "redondo", olhos: "serenos", detalhes: ["sardas"], cabelo: "curtoCacheado", corCabelo: "#a8461f",
    cima: "mangaLonga", corCima: "#4d6b3a", cor2Cima: "#e8dcc0", estampaCima: "listras", materialCima: "algodao", baixo: "calca", corBaixo: "#7a5236", estampaBaixo: "liso", materialBaixo: "canhamo",
    calcado: "botas", corCalcado: "#3e4147", cabeca: "nenhum", rostoAc: "oculos", pescoco: "cachecol", corPescoco: "#8a2f48", costas: "ecobag", corCostas: "#b9a173" } },
  { id: "musica", nome: "Música", v: { pele: "#3c2215", corpo: "largo", rosto: "longo", olhos: "pontos", detalhes: ["barba", "bigode"], cabelo: "dreads", corCabelo: "#1f1a1c",
    cima: "camiseta", corCima: "#24252a", cor2Cima: "#f1d04b", estampaCima: "liso", materialCima: "algodao", baixo: "calca", corBaixo: "#4a6fa5", estampaBaixo: "liso", materialBaixo: "jeans",
    calcado: "canoAlto", corCalcado: "#f1d04b", cabeca: "fones", corCabeca: "#d0443a", rostoAc: "nenhum", pescoco: "nenhum", costas: "nenhum" } },
  { id: "inverno", nome: "Inverno", v: { pele: "#eab58c", corpo: "curvas", rosto: "oval", olhos: "pontos", detalhes: ["bochechas"], cabelo: "ondulado", corCabelo: "#3d2618",
    cima: "moletom", corCima: "#e8dcc0", cor2Cima: "#7a5236", estampaCima: "liso", materialCima: "algodao", baixo: "calca", corBaixo: "#3e4147", estampaBaixo: "liso", materialBaixo: "algodao",
    calcado: "botas", corCalcado: "#7a5236", cabeca: "gorro", corCabeca: "#d0443a", rostoAc: "nenhum", pescoco: "cachecol", corPescoco: "#5aa847", costas: "nenhum" } },
  { id: "roca", nome: "Roça", v: { pele: "#a86a3c", corpo: "largo", rosto: "quadrado", olhos: "serenos", detalhes: ["bigode"], cabelo: "curto", corCabelo: "#3d2618",
    cima: "flanela", corCima: "#3c6fcf", cor2Cima: "#24252a", estampaCima: "xadrez", materialCima: "algodao", baixo: "calca", corBaixo: "#4a6fa5", estampaBaixo: "liso", materialBaixo: "jeans",
    calcado: "botaCano", corCalcado: "#7a5236", cabeca: "chapeuVaqueiro", corCabeca: "#b07a3a", rostoAc: "nenhum", pescoco: "bandana", corPescoco: "#d0443a", costas: "nenhum" } },
  { id: "colheita", nome: "Colheita", v: { pele: "#d99f6c", corpo: "curvas", rosto: "redondo", olhos: "alegres", detalhes: ["bochechas", "sardas"], cabelo: "trancas", corCabelo: "#6b4226",
    cima: "avental", corCima: "#d0443a", cor2Cima: "#f2efe6", estampaCima: "chita", materialCima: "algodao", baixo: "saiaLonga", corBaixo: "#3c6fcf", estampaBaixo: "liso", materialBaixo: "algodao",
    calcado: "galochas", corCalcado: "#d9a93a", cabeca: "lenco", corCabeca: "#ee8fb3", rostoAc: "nenhum", pescoco: "nenhum", costas: "cesto" } },
  { id: "curral", nome: "Curral", v: { pele: "#eab58c", corpo: "reto", rosto: "oval", olhos: "pontos", detalhes: [], cabelo: "rabo", corCabelo: "#b48a4a",
    cima: "macacao", corCima: "#4d6b3a", cor2Cima: "#e8dcc0", estampaCima: "liso", materialCima: "canhamo", baixo: "calca", corBaixo: "#4d6b3a", estampaBaixo: "liso", materialBaixo: "canhamo",
    calcado: "botas", corCalcado: "#24252a", cabeca: "chapeuPalha", corCabeca: "#d0443a", rostoAc: "nenhum", pescoco: "nenhum", costas: "nenhum" } },
  { id: "feira", nome: "Feira", v: { pele: "#c4844f", corpo: "reto", rosto: "quadrado", olhos: "alegres", detalhes: ["barba"], cabelo: "topete", corCabelo: "#a9a7a3",
    cima: "jardineira", corCima: "#4a6fa5", cor2Cima: "#d0443a", estampaCima: "liso", materialCima: "jeans", baixo: "calca", corBaixo: "#4a6fa5", estampaBaixo: "liso", materialBaixo: "jeans",
    calcado: "botas", corCalcado: "#7a5236", cabeca: "chapeuPalha", corCabeca: "#4d6b3a", rostoAc: "nenhum", pescoco: "nenhum", costas: "ecobag", corCostas: "#e8dcc0" } },
];

export const APARENCIA_INICIAL = Object.freeze({
  nome: "",
  pele: PELES[3],
  corpo: "reto",
  rosto: "oval",
  olhos: "pontos",
  corOlhos: CORES_OLHOS[0],
  detalhes: ["bochechas"],
  cabelo: "curto",
  corCabelo: CORES_CABELO[2],
  cima: "camiseta",
  corCima: "#5aa847",
  cor2Cima: "#f2efe6",
  estampaCima: "liso",
  materialCima: "algodao",
  baixo: "calca",
  corBaixo: "#4a6fa5",
  estampaBaixo: "liso",
  materialBaixo: "jeans",
  calcado: "tenis",
  corCalcado: "#f2efe6",
  cabeca: "nenhum",
  corCabeca: "#d9a93a",
  rostoAc: "nenhum",
  pescoco: "nenhum",
  corPescoco: "#d0443a",
  costas: "nenhum",
  corCostas: "#7a5236",
});

const LISTAS = {
  corpo: CORPOS, rosto: ROSTOS, olhos: OLHOS, cabelo: CABELOS, cima: PARTES_CIMA, baixo: PARTES_BAIXO, calcado: CALCADOS,
  cabeca: ACESS_CABECA, rostoAc: ACESS_ROSTO, pescoco: ACESS_PESCOCO, costas: ACESS_COSTAS,
  estampaCima: ESTAMPAS, estampaBaixo: ESTAMPAS, materialCima: MATERIAIS, materialBaixo: MATERIAIS,
};

// Garante que uma aparência vinda do armazenamento tenha só valores conhecidos.
export function normalizar(ap) {
  const o = { ...APARENCIA_INICIAL };
  if (!ap || typeof ap !== "object") return o;
  for (const k of Object.keys(o)) {
    const v = ap[k];
    if (v === undefined) continue;
    if (k === "nome") o.nome = String(v).slice(0, 14);
    else if (k === "detalhes") o.detalhes = Array.isArray(v) ? v.filter((d) => DETALHES.some((x) => x.id === d)) : o.detalhes;
    else if (LISTAS[k]) { if (LISTAS[k].some((x) => x.id === v)) o[k] = v; }
    else if (hexValido(v)) o[k] = v;
  }
  return o;
}

export function aleatoria(rnd = Math.random) {
  const pega = (l) => l[Math.floor(rnd() * l.length)];
  const id = (l) => pega(l).id;
  const ap = {
    ...APARENCIA_INICIAL,
    pele: pega(PELES), corpo: id(CORPOS), rosto: id(ROSTOS), olhos: id(OLHOS), corOlhos: pega(CORES_OLHOS),
    detalhes: DETALHES.filter(() => rnd() < 0.18).map((d) => d.id),
    cabelo: id(CABELOS.filter((c) => c.id !== "careca" || rnd() < 0.3)),
    corCabelo: rnd() < 0.75 ? pega(CORES_CABELO.slice(0, 10)) : pega(CORES_CABELO),
    cima: id(PARTES_CIMA), corCima: pega(CORES_ROUPA), cor2Cima: pega(CORES_ROUPA),
    estampaCima: rnd() < 0.55 ? "liso" : id(ESTAMPAS), materialCima: id(MATERIAIS),
    baixo: id(PARTES_BAIXO), corBaixo: pega(CORES_ROUPA), estampaBaixo: rnd() < 0.7 ? "liso" : id(ESTAMPAS), materialBaixo: id(MATERIAIS),
    calcado: id(CALCADOS), corCalcado: pega(CORES_ROUPA),
    cabeca: rnd() < 0.5 ? "nenhum" : id(ACESS_CABECA), corCabeca: pega(CORES_ROUPA),
    rostoAc: rnd() < 0.7 ? "nenhum" : id(ACESS_ROSTO),
    pescoco: rnd() < 0.7 ? "nenhum" : id(ACESS_PESCOCO), corPescoco: pega(CORES_ROUPA),
    costas: rnd() < 0.6 ? "nenhum" : id(ACESS_COSTAS), corCostas: pega(CORES_ROUPA),
  };
  return ap;
}

export const acharCabelo = (id) => CABELOS.find((c) => c.id === id) || CABELOS[2];
export const acharCima = (id) => PARTES_CIMA.find((c) => c.id === id) || PARTES_CIMA[0];
export const acharMaterial = (id) => MATERIAIS.find((c) => c.id === id) || MATERIAIS[0];

// ---------------------------------------------------------------- Tecidos
const AMARELO = rgb("#f6d54a");

function corEstampa(est, base, c2, x, y) {
  switch (est) {
    case "listras": return y % 3 === 0 ? c2 : base;
    case "bolinhas": return y % 3 === 1 && (x + (Math.floor(y / 3) % 2) * 2) % 4 === 1 ? c2 : base;
    case "xadrez": {
      const a = x % 4 < 2, b = y % 4 < 2;
      if (a && b) return misturar(base, c2, 0.6);
      if (a || b) return misturar(base, c2, 0.28);
      return base;
    }
    case "folhas": return hash(x, y, 7) < 0.1 || hash(x - 1, y + 1, 7) < 0.1 ? c2 : base;
    case "floral": {
      const cx = Math.floor(x / 5), cy = Math.floor(y / 5);
      const fx = cx * 5 + 2 + (cy % 2), fy = cy * 5 + 2;
      const dx = Math.abs(x - fx), dy = Math.abs(y - fy);
      if (dx === 0 && dy === 0) return AMARELO;
      if (dx + dy === 1) return c2;
      return base;
    }
    case "camuflado": {
      const n = ruido(x * 0.33, y * 0.33, 3);
      if (n < 0.38) return escurecer(base, 0.32);
      if (n > 0.64) return misturar(base, c2, 0.55);
      return base;
    }
    case "degrade": return misturar(base, c2, Math.min(1, Math.max(0, (y - 2) / 12)));
    case "chita": {
      // estampa de chita: flores grandes e folhas sobre fundo colorido
      const cx = Math.floor(x / 6), cy = Math.floor(y / 6);
      const fx = cx * 6 + 2 + (cy % 2) * 3, fy = cy * 6 + 2;
      const dx = Math.abs(x - fx), dy = Math.abs(y - fy);
      if (dx === 0 && dy === 0) return AMARELO;
      if (dx + dy === 1) return c2;
      if (dx === 1 && dy === 1) return clarear(c2, 0.45);
      if (x - fx === 2 && y - fy === 2) return rgb("#3f8a35");
      return base;
    }
    default: return base;
  }
}

function corMaterial(mat, c, c2, x, y) {
  switch (mat) {
    case "jeans": {
      const n = (hash(x, y, 11) - 0.5) * 0.14 + ((x + y) % 2 ? 0.03 : -0.03);
      return n > 0 ? clarear(c, n) : escurecer(c, -n);
    }
    case "pet": return (x + y) % 6 === 0 ? clarear(c, 0.2) : c;
    case "canhamo": return (x % 2) ^ (y % 2) ? escurecer(c, 0.07) : hash(x, y, 5) < 0.12 ? clarear(c, 0.1) : c;
    case "retalhos": {
      const b = hash(Math.floor((x + 1) / 4), Math.floor(y / 4), 9);
      let r = c;
      if (b < 0.3) r = misturar(c, c2, 0.45);
      else if (b > 0.7) r = escurecer(c, 0.16);
      // pesponto entre os retalhos
      if ((x + 1) % 4 === 0 && y % 2 === 0) r = clarear(r, 0.3);
      return r;
    }
    case "tech": return (x + 2 * y) % 7 === 0 ? clarear(c, 0.16) : c;
    default: return c;
  }
}

// Pinta a máscara como tecido: estampa, material e sombreamento pela própria forma.
function pintar(pm, m, t) {
  const base = rgb(t.cor);
  const c2 = rgb(t.cor2 || t.cor);
  for (const [x, y] of m.pontos()) {
    let c = corEstampa(t.estampa, base, c2, x - (t.ox || 0), y - (t.oy || 0));
    c = corMaterial(t.material, c, c2, x, y);
    if (t.liso !== false) {
      if (!m.tem(x + 1, y)) c = escurecer(c, 0.26);
      else if (!m.tem(x - 1, y)) c = clarear(c, 0.14);
      if (!m.tem(x, y + 1)) c = escurecer(c, 0.12);
      if (!m.tem(x, y - 1) && t.topoClaro) c = clarear(c, 0.12);
    }
    pm.set(x, y, c);
  }
}

function pintarPele(pm, m, P) {
  for (const [x, y] of m.pontos()) {
    let c = P.pele;
    if (!m.tem(x + 1, y)) c = P.peleS;
    else if (!m.tem(x - 1, y) && !m.tem(x, y - 1)) c = P.peleL;
    pm.set(x, y, c);
  }
}

const M = () => new Mascara(LARG, ALT);

// ---------------------------------------------------------------- Paleta
function paleta(ap) {
  const pele = rgb(ap.pele);
  const cab = rgb(ap.corCabelo);
  return {
    pele, peleS: escurecer(pele, 0.2), peleL: clarear(pele, 0.16), peleE: escurecer(pele, 0.38),
    cab, cabS: escurecer(cab, 0.3), cabL: clarear(cab, 0.28), cabE: escurecer(cab, 0.48),
    olho: rgb(ap.corOlhos),
    boca: misturar(escurecer(pele, 0.45), [190, 70, 80, 255], 0.45),
    bochecha: misturar(pele, [240, 110, 120, 255], 0.38),
  };
}

function tecidoCima(ap) {
  const estampa = ap.cima === "flanela" && ap.estampaCima === "liso" ? "xadrez" : ap.estampaCima;
  return { cor: ap.corCima, cor2: ap.cor2Cima, estampa, material: ap.materialCima, oy: 15 };
}
function tecidoBaixo(ap) {
  return { cor: ap.corBaixo, cor2: misturar(ap.corBaixo, "#f2efe6", 0.6), estampa: ap.estampaBaixo, material: ap.materialBaixo, oy: 23 };
}

// ---------------------------------------------------------------- Poses
// Para frente/costas: perna erguida (0 = esquerda, 1 = direita), balanço dos braços e respiração.
// Para o lado: passo -1 (pé da frente adiante), 0 (passando), 1 (pé de trás adiante).
function pose(quadro) {
  if (quadro < 2) return { bob: quadro, ergue: -1, braco: 0, passo: 0, andando: false };
  const k = quadro - 2;
  return [
    { bob: 1, ergue: 0, braco: 1, passo: -1, andando: true },
    { bob: 0, ergue: -1, braco: 0, passo: 0, ergueLado: 1, andando: true },
    { bob: 1, ergue: 1, braco: -1, passo: 1, andando: true },
    { bob: 0, ergue: -1, braco: 0, passo: 0, ergueLado: 0, andando: true },
  ][k];
}

// ---------------------------------------------------------------- Cabeça (frente)
function cabecaFrente(rosto) {
  const m = M();
  m.fn((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const dx = px - 12, dy = py - 8.5;
    switch (rosto) {
      case "redondo": return (dx / 5.3) ** 2 + (dy / 5.4) ** 2 <= 1;
      case "quadrado": return y >= 3 && y <= 13 && x >= 7 && x <= 16 && !((y === 3 || y === 13) && (x === 7 || x === 16));
      case "coracao": {
        if (y < 3 || y > 13) return false;
        const meia = y <= 9 ? 5.2 - (y === 3 ? 1.6 : y === 4 ? 0.5 : 0) : 5.2 - (y - 9) * 0.95;
        return Math.abs(dx) <= meia;
      }
      case "longo": return (dx / 4.7) ** 2 + ((py - 8.7) / 5.9) ** 2 <= 1;
      default: return (dx / 5) ** 2 + (dy / 5.6) ** 2 <= 1; // oval
    }
  });
  return m;
}

function cabecaLado(rosto) {
  const m = M();
  m.fn((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const rx = rosto === "redondo" ? 5 : rosto === "longo" ? 4.5 : 4.8;
    const ry = rosto === "longo" ? 5.9 : 5.5;
    let dentro = ((px - 12.3) / rx) ** 2 + ((py - 8.5) / ry) ** 2 <= 1;
    if (rosto === "quadrado" && x >= 9 && x <= 16 && y >= 4 && y <= 13) dentro = true;
    return dentro;
  });
  m.add(17, 9); // nariz
  if (rosto === "coracao") m.del(16, 13).del(15, 13);
  return m;
}

function rostoFrente(pm, ap, P, u) {
  const o = P.olho;
  const pupila = misturar(o, [16, 10, 18, 255], 0.7);
  const olhoTopo = misturar(o, [16, 10, 18, 255], 0.3);
  const xs = [9, 14];
  // sobrancelhas (o cabelo pode cobrir)
  for (const x of xs) {
    pm.set(x - 1 + (x > 12 ? 1 : 0), 6 + u, P.cabS);
    pm.set(x + (x > 12 ? 1 : 0), 6 + u, P.cabS);
  }
  switch (ap.olhos) {
    case "grandes":
      for (const x of [8, 14]) {
        pm.rect(x, 8 + u, 2, 2, pupila);
        pm.set(x, 8 + u, [255, 255, 255, 255]);
        pm.set(x + 1, 9 + u, o);
      }
      break;
    case "alegres":
      for (const x of xs) {
        pm.set(x - 1, 9 + u, pupila);
        pm.set(x, 8 + u, pupila);
        pm.set(x + 1, 9 + u, pupila);
      }
      break;
    case "cilios":
      for (const x of xs) {
        pm.set(x, 8 + u, olhoTopo);
        pm.set(x, 9 + u, pupila);
        pm.set(x < 12 ? x - 1 : x + 1, 8 + u, pupila);
      }
      break;
    case "serenos":
      for (const x of xs) {
        pm.set(x - 1, 9 + u, pupila);
        pm.set(x, 9 + u, pupila);
      }
      break;
    default:
      for (const x of xs) {
        pm.set(x, 8 + u, olhoTopo);
        pm.set(x, 9 + u, pupila);
      }
  }
  const det = ap.detalhes || [];
  if (det.includes("bochechas")) {
    pm.set(8, 10 + u, P.bochecha);
    pm.set(15, 10 + u, P.bochecha);
  }
  if (det.includes("sardas")) {
    const s = misturar(P.pele, [120, 60, 30, 255], 0.35);
    for (const [x, y] of [[9, 10], [10, 11], [14, 10], [13, 11]]) pm.set(x, y + u, s);
  }
  if (det.includes("pinta")) pm.set(15, 11 + u, P.peleE);
  if (det.includes("barba")) {
    for (let y = 10; y <= 13; y++)
      for (let x = 7; x <= 16; x++) {
        if (pm.alfa(x, y + u) === 0) continue;
        if (y === 10 && x > 8 && x < 15) continue;
        if (y === 11 && x >= 10 && x <= 13) continue;
        pm.set(x, y + u, (x + y) % 3 === 0 ? P.cabS : P.cab);
      }
  }
  if (det.includes("bigode")) {
    pm.rect(10, 10 + u, 4, 1, P.cab);
    pm.set(13, 10 + u, P.cabS);
  }
  pm.set(11, 11 + u, P.boca);
  pm.set(12, 11 + u, P.boca);
  if (det.includes("curativo")) {
    const b = rgb("#f0d2a8");
    pm.set(14, 9 + u, b); // na bochecha, abaixo do olho direito
    pm.rect(15, 9 + u, 1, 1, b);
    pm.set(15, 10 + u, escurecer(b, 0.2));
  }
}

function rostoLado(pm, ap, P, u) {
  const o = P.olho;
  const pupila = misturar(o, [16, 10, 18, 255], 0.7);
  pm.set(14, 6 + u, P.cabS);
  pm.set(15, 6 + u, P.cabS);
  switch (ap.olhos) {
    case "grandes":
      pm.rect(14, 8 + u, 2, 2, pupila);
      pm.set(15, 8 + u, [255, 255, 255, 255]);
      break;
    case "alegres":
      pm.set(14, 9 + u, pupila);
      pm.set(15, 8 + u, pupila);
      break;
    case "serenos":
      pm.set(15, 9 + u, pupila);
      pm.set(14, 9 + u, pupila);
      break;
    case "cilios":
      pm.set(15, 8 + u, misturar(o, [16, 10, 18, 255], 0.3));
      pm.set(15, 9 + u, pupila);
      pm.set(14, 7 + u, pupila);
      break;
    default:
      pm.set(15, 8 + u, misturar(o, [16, 10, 18, 255], 0.3));
      pm.set(15, 9 + u, pupila);
  }
  // orelha
  pm.set(11, 8 + u, P.peleS);
  pm.set(11, 9 + u, P.peleE);
  pm.set(16, 11 + u, P.boca);
  const det = ap.detalhes || [];
  if (det.includes("bochechas")) pm.set(14, 10 + u, P.bochecha);
  if (det.includes("sardas")) pm.set(15, 10 + u, misturar(P.pele, [120, 60, 30, 255], 0.35));
  if (det.includes("barba")) {
    for (let y = 10; y <= 13; y++)
      for (let x = 10; x <= 17; x++) {
        if (pm.alfa(x, y + u) === 0) continue;
        if (y <= 10 && x >= 14) continue;
        if (x === 16 && y === 11) continue;
        pm.set(x, y + u, (x + y) % 3 === 0 ? P.cabS : P.cab);
      }
  }
  if (det.includes("bigode")) pm.rect(15, 10 + u, 3, 1, P.cab);
  if (det.includes("curativo")) pm.set(13, 10 + u, rgb("#f0d2a8"));
}

// ---------------------------------------------------------------- Cabelo
const FIM_COMP = [9, 11, 13, 17, 22, 26];

function franjaY(franja, x) {
  const i = Math.max(0, Math.min(7, x - 8));
  switch (franja) {
    case "reta": return 6;
    case "lateral": return [7, 7, 6, 6, 5, 5, 5, 5][i];
    case "meio": return [6, 5, 5, 4, 4, 5, 5, 6][i];
    case "topete": return 4;
    case "social": return [5, 5, 5, 4, 4, 4, 4, 4][i];
    default: return 4;
  }
}

function texturaCabelo(pm, m, P, topo, semente = 0) {
  for (const [x, y] of m.pontos()) {
    let c = P.cab;
    const borda = !m.tem(x + 1, y) || !m.tem(x, y + 1);
    if (topo === "cacheado" || topo === "crespo") {
      const h = hash(x, y, 31 + semente);
      if (h < 0.22) c = P.cabL;
      else if (h > 0.78) c = P.cabS;
    } else if (topo === "ondulado") {
      if ((x + Math.floor(y / 2)) % 4 === 0) c = P.cabL;
    } else if ((x - y) % 5 === 0 && y < 9) c = P.cabL;
    if (borda) c = P.cabS;
    if (!m.tem(x - 1, y) && !m.tem(x, y - 1)) c = P.cabL;
    pm.set(x, y, c);
  }
}

function bordaIrregular(topo, x, y) {
  if (topo === "cacheado" || topo === "crespo") return (hash(x, y, 77) - 0.5) * 1.3;
  return 0;
}

// Máscaras de cabelo da vista de frente: tras (atrás do corpo) e frente (sobre o rosto).
function cabeloFrente(hs, u, rostoM) {
  const tras = M(), frente = M();
  const fim = FIM_COMP[hs.comp] + u;
  const v = hs.vol;
  if (hs.topo === "careca") return { tras, frente };
  if (hs.topo === "raspado" || hs.topo === "moicano" || hs.topo === "degrade") {
    frente.fn((x, y) => rostoM.tem(x, y) && (y <= 5 + u || ((x <= 7 || x >= 16) && y <= 8 + u)));
    return { tras, frente, raspado: true, moicano: hs.topo };
  }
  const cy = 7.6 + u - v * 0.25, rx = 6 + v * 1.3, ry = 5.8 + v * 0.6;
  frente.fn((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const irr = bordaIrregular(hs.topo, x, y);
    const dentro = ((px - 12) / (rx + irr * 0.4)) ** 2 + ((py - cy) / (ry + irr * 0.4)) ** 2 <= 1;
    if (!dentro) return false;
    // janela do rosto
    const fy = franjaY(hs.franja, x) + u;
    if (x >= 8 && x <= 15 && y >= fy) return false;
    const lateralFim = hs.comp >= 2 ? fim : 9 + u;
    if (y > lateralFim) return false;
    if ((x === 7 || x === 16) && y > (hs.comp >= 1 ? 10 + u : 8 + u) && hs.comp < 2) return false;
    return true;
  });
  if (hs.topo === "espetado") {
    for (const [x, y] of [[8, 1], [9, 0], [10, 1], [11, 0], [12, 1], [13, 0], [14, 1], [15, 2], [9, 1], [11, 1], [13, 1]]) frente.add(x, y + u);
  }
  // mechas laterais na frente do rosto/ombros
  if (hs.comp >= 2) {
    const largura = 2 + (v > 0 ? 1 : 0);
    for (let y = 8 + u; y <= fim; y++) {
      for (let k = 0; k < largura; k++) {
        frente.add(7 - k, y);
        frente.add(16 + k, y);
      }
    }
  }
  // parte de trás (passa atrás do pescoço e dos ombros)
  if (hs.comp >= 2) {
    tras.fn((x, y) => {
      if (y < 9 + u || y > fim) return false;
      const meia = 6.5 + v + (y > 14 + u ? 0.5 : 0);
      const irr = bordaIrregular(hs.topo, x, y);
      return Math.abs(x + 0.5 - 12) <= meia + irr * 0.5 && !(y === fim && (x < 7 || x > 16));
    });
  }
  return { tras, frente };
}

function cabeloCostas(hs, u, cabecaM) {
  const m = M();
  if (hs.topo === "careca") return { m };
  if (hs.topo === "raspado" || hs.topo === "moicano" || hs.topo === "degrade") {
    m.fn((x, y) => cabecaM.tem(x, y) && y <= 11 + u);
    return { m, raspado: true, moicano: hs.topo };
  }
  const fim = Math.max(12 + u, FIM_COMP[hs.comp] + u);
  const v = hs.vol;
  const cy = 7.6 + u - v * 0.25, rx = 6 + v * 1.3, ry = 5.8 + v * 0.6;
  m.fn((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const irr = bordaIrregular(hs.topo, x, y);
    if (((px - 12) / (rx + irr * 0.4)) ** 2 + ((py - cy) / (ry + irr * 0.4)) ** 2 <= 1 && y <= Math.max(12 + u, hs.comp >= 2 ? fim : 12 + u)) return true;
    if (hs.comp >= 2 && y >= 9 + u && y <= fim) {
      const meia = 6.2 + v - (y === fim ? 1 : 0);
      return Math.abs(px - 12) <= meia + irr * 0.5;
    }
    return false;
  });
  if (hs.comp <= 1) for (const [x, y] of m.pontos()) if (y > 12 + u) m.del(x, y);
  if (hs.topo === "espetado") for (const [x, y] of [[9, 1], [11, 0], [13, 1], [10, 1], [12, 1]]) m.add(x, y + u);
  return { m };
}

function cabeloLado(hs, u, cabecaM) {
  const m = M();
  if (hs.topo === "careca") return { m };
  if (hs.topo === "raspado" || hs.topo === "moicano" || hs.topo === "degrade") {
    m.fn((x, y) => cabecaM.tem(x, y) && (y <= 5 + u || (x <= 11 && y <= 10 + u)) && !(x === 11 && y >= 8 + u));
    return { m, raspado: true, moicano: hs.topo };
  }
  const v = hs.vol;
  const fim = FIM_COMP[hs.comp] + u;
  const cx = 11.8 - v * 0.2, cy = 7.6 + u - v * 0.25, rx = 5.6 + v * 1.3, ry = 5.8 + v * 0.6;
  m.fn((x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const irr = bordaIrregular(hs.topo, x, y);
    const dentro = ((px - cx) / (rx + irr * 0.4)) ** 2 + ((py - cy) / (ry + irr * 0.4)) ** 2 <= 1;
    if (dentro) {
      const fy = (hs.franja === "reta" ? 6 : hs.franja === "topete" || hs.franja === "nenhuma" ? 4 : 5) + u;
      if (x >= 14 && y >= fy) return false;
      if (x >= 12 && y >= 7 + u) return x <= 12 && y <= 9 + u && hs.comp >= 1; // costeleta
      if (y > (hs.comp >= 2 ? fim : 10 + u)) return false;
      return true;
    }
    if (hs.comp >= 2 && y >= 8 + u && y <= fim) {
      const x0 = 7 - v - (y > 15 + u ? 0 : 0), x1 = 12 - (y > 14 + u ? 1 : 0);
      return x + irr * 0.4 >= x0 && x <= x1 && !(y === fim && x === x0);
    }
    return false;
  });
  if (hs.topo === "espetado") for (const [x, y] of [[10, 1], [12, 0], [14, 1], [11, 1], [13, 1], [15, 2]]) m.add(x, y + u);
  return { m };
}

function pintarRaspado(pm, m, P, topo, vista, u = 0) {
  const tom = misturar(P.cab, P.pele, 0.42);
  for (const [x, y] of m.pontos()) pm.set(x, y, (x + y) % 2 ? tom : misturar(tom, P.cab, 0.25));
  if (topo === "degrade") {
    // laterais raspadas e topo curto
    const topoM = M();
    if (vista === "lado") topoM.fn((x, y) => m.tem(x, y) && y <= 5 + u && x >= 9);
    else topoM.fn((x, y) => m.tem(x, y) && y <= (vista === "costas" ? 7 : 5) + u && x >= 8 && x <= 15);
    // um pixel de volume acima do contorno da cabeça
    for (const [x, y] of [...topoM.pontos()]) if (!topoM.tem(x, y - 1)) topoM.add(x, y - 1);
    return topoM;
  }
  if (topo === "moicano") {
    const crista = M();
    if (vista === "lado") crista.fn((x, y) => y >= 0 && y <= 6 && x >= 9 + Math.floor(y / 2) && x <= 14 - Math.floor((6 - y) / 3) && y <= 3 + Math.floor((x - 8) / 2));
    else crista.fn((x, y) => x >= 10 && x <= 13 && y >= 0 && y <= (vista === "costas" ? 11 : 5));
    return crista;
  }
  return null;
}

function extrasCabelo(pm, hs, P, u, vista) {
  if (!hs.extra) return;
  if (hs.extra === "risca") {
    if (vista === "frente") { pm.set(9, 2 + u, P.cabE); pm.set(9, 3 + u, P.cabS); pm.set(10, 2 + u, P.cabL); pm.set(11, 2 + u, P.cabL); }
    else if (vista === "lado") { pm.rect(11, 2 + u, 4, 1, P.cabL); }
    return;
  }
  const m = M();
  if (hs.extra === "coque") {
    m.fn((x, y) => ((x + 0.5 - 12) / 2.8) ** 2 + ((y + 0.5 - (1.6 + u)) / 2.2) ** 2 <= 1);
    texturaCabelo(pm, m, P, "liso");
    if (vista !== "lado") pm.rect(11, 3 + u, 2, 1, rgb("#e85a8a"));
  } else if (hs.extra === "doisCoques") {
    if (vista === "lado") m.fn((x, y) => ((x + 0.5 - 10.5) / 2.3) ** 2 + ((y + 0.5 - (2.5 + u)) / 2.2) ** 2 <= 1);
    else m.fn((x, y) => [6.8, 17.2].some((cx) => ((x + 0.5 - cx) / 2.3) ** 2 + ((y + 0.5 - (2.8 + u)) / 2.2) ** 2 <= 1));
    texturaCabelo(pm, m, P, "liso");
  } else if (hs.extra === "rabo") {
    if (vista === "costas") {
      m.fn((x, y) => y >= 8 + u && y <= 18 + u && Math.abs(x + 0.5 - 12) <= (y < 10 + u ? 1.6 : y > 16 + u ? 1 : 2.1));
      texturaCabelo(pm, m, P, "liso");
      pm.rect(11, 8 + u, 2, 1, rgb("#e85a8a"));
    } else if (vista === "lado") {
      m.fn((x, y) => y >= 5 + u && y <= 16 + u && x >= 5 && x <= 8 && x >= 5 + (y < 8 + u ? 1 : 0) && !(x === 5 && y > 14 + u));
      texturaCabelo(pm, m, P, "liso");
      pm.set(8, 6 + u, rgb("#e85a8a"));
      pm.set(8, 7 + u, rgb("#e85a8a"));
    }
  } else if (hs.extra === "trancas") {
    const cols = vista === "lado" ? [10] : vista === "costas" ? [9, 14] : [6, 17];
    const y0 = vista === "lado" ? 10 : 9;
    for (const cx of cols) {
      for (let y = y0 + u; y <= 21 + u; y++) {
        const alt = (y + (cx > 12 ? 1 : 0)) % 2;
        pm.set(cx, y, alt ? P.cab : P.cabS);
        pm.set(cx + 1, y, alt ? P.cabS : P.cabL);
      }
      pm.rect(cx, 22 + u, 2, 1, rgb("#e85a8a"));
    }
  }
}

function dreadsFrente(pm, P, u, tras) {
  // Fios separados por cima da parte de trás.
  for (const [x, y] of tras.pontos()) if (x % 2 === 0 && y > 12 + u) pm.set(x, y, P.cabS);
}

// ---------------------------------------------------------------- Corpo (frente/costas)
function pernasFrente(pz) {
  const esq = M(), dir = M();
  const fimE = 28 - (pz.ergue === 0 ? 1 : 0);
  const fimD = 28 - (pz.ergue === 1 ? 1 : 0);
  esq.rect(8, 23, 4, fimE - 22);
  dir.rect(12, 23, 4, fimD - 22);
  return { esq, dir, peE: fimE + 1, peD: fimD + 1 };
}

function desenharBaixoFrente(pm, ap, P, pz, pernas, costas) {
  const cima = acharCima(ap.cima);
  const t = tecidoBaixo(ap);
  const pele = M();
  for (const p of [pernas.esq, pernas.dir]) for (const [x, y] of p.pontos()) pele.add(x, y);
  if (cima.cobrePernas) {
    const m = M();
    for (const [x, y] of pele.pontos()) m.add(x, y);
    pintar(pm, m, { cor: ap.corCima, cor2: ap.cor2Cima, estampa: ap.estampaCima, material: ap.materialCima, oy: 15 });
    return;
  }
  const b = ap.baixo;
  const m = M();
  if (b === "calca" || b === "cargo" || b === "legging") {
    for (const [x, y] of pele.pontos()) m.add(x, y);
  } else if (b === "bermuda" || b === "short") {
    const fim = b === "bermuda" ? 25 : 24;
    for (const [x, y] of pele.pontos()) if (y <= fim) m.add(x, y);
    if (b === "bermuda") { m.add(7, 25); m.add(16, 25); }
  } else if (b === "saia") {
    m.linha(23, 8, 15).linha(24, 7, 16).linha(25, 7, 16).linha(26, 6, 17);
  } else if (b === "saiaLonga") {
    m.linha(23, 8, 15).linha(24, 7, 16).linha(25, 7, 16).linha(26, 6, 17).linha(27, 6, 17).linha(28, 5, 18);
  }
  // pele das pernas que ficam de fora
  const peleVis = M();
  for (const [x, y] of pele.pontos()) if (!m.tem(x, y)) peleVis.add(x, y);
  pintarPele(pm, peleVis, P);
  pintar(pm, m, t);
  if (b === "calca" || b === "cargo" || b === "legging") {
    // costura entre as pernas
    for (let y = 25; y <= 28; y++) if (m.tem(11, y)) pm.set(11, y, escurecer(rgb(ap.corBaixo), 0.35));
  }
  if (b === "cargo") {
    const bolso = escurecer(rgb(ap.corBaixo), 0.22);
    for (const x of [8, 15]) { pm.set(x, 25, bolso); pm.set(x, 26, bolso); }
  }
  if (b === "legging") for (let y = 23; y <= 28; y++) if (m.tem(9, y)) pm.set(9, y, clarear(rgb(ap.corBaixo), 0.22));
  // cós
  if (b !== "saia" && b !== "saiaLonga") for (let x = 8; x <= 15; x++) if (m.tem(x, 23)) pm.set(x, 23, escurecer(rgb(ap.corBaixo), 0.16));
}

function desenharCalcadoFrente(pm, ap, P, pernas) {
  const cor = rgb(ap.corCalcado);
  const corS = escurecer(cor, 0.3), corL = clarear(cor, 0.3);
  const sola = rgb("#eeeae0"), solaE = rgb("#4a3a32");
  for (const [lado, y0] of [["e", pernas.peE], ["d", pernas.peD]]) {
    const x0 = lado === "e" ? 7 : 12;
    const xl = lado === "e" ? 8 : 12; // perna
    switch (ap.calcado) {
      case "botaCano":
        pm.rect(xl, y0 - 4, 4, 4, cor);
        pm.rect(xl, y0 - 4, 4, 1, corL);
        pm.set(xl + 3, y0 - 3, corS); pm.set(xl + 3, y0 - 2, corS); pm.set(xl + 3, y0 - 1, corS);
        pm.set(xl + 1, y0 - 2, clarear(cor, 0.45)); // costura decorativa
        pm.rect(x0, y0, 5, 1, cor);
        pm.set(lado === "e" ? x0 : x0 + 4, y0, corS);
        pm.rect(x0, y0 + 1, 5, 1, solaE);
        pm.set(lado === "e" ? x0 + 4 : x0, y0 + 1, escurecer(solaE, 0.3)); // salto
        break;
      case "botas":
        pm.rect(xl, y0 - 2, 4, 2, cor);
        pm.set(xl + 3, y0 - 2, corS);
        pm.set(xl + 3, y0 - 1, corS);
        pm.rect(x0, y0, 5, 1, cor);
        pm.set(x0 + 4, y0, corS);
        pm.set(x0, y0, corL);
        pm.rect(x0, y0 + 1, 5, 1, solaE);
        pm.rect(xl, y0 - 2, 4, 1, corL);
        break;
      case "galochas":
        pm.rect(xl, y0 - 3, 4, 3, cor);
        pm.set(xl + 1, y0 - 3, corL);
        pm.set(xl + 1, y0 - 2, corL);
        pm.set(xl + 3, y0 - 2, corS);
        pm.set(xl + 3, y0 - 1, corS);
        pm.rect(x0, y0, 5, 1, cor);
        pm.set(x0 + 4, y0, corS);
        pm.rect(x0, y0 + 1, 5, 1, escurecer(cor, 0.45));
        break;
      case "sandalias":
        pm.rect(x0, y0, 5, 1, P.pele);
        pm.set(x0 + 4, y0, P.peleS);
        pm.set(x0 + 1, y0, cor);
        pm.set(x0 + 3, y0, cor);
        pm.set(xl + 1, y0 - 1, cor);
        pm.set(xl + 2, y0 - 1, cor);
        pm.rect(x0, y0 + 1, 5, 1, escurecer(cor, 0.35));
        break;
      case "canoAlto":
        pm.rect(xl, y0 - 1, 4, 1, cor);
        pm.set(xl + 3, y0 - 1, corS);
        pm.rect(x0, y0, 5, 1, cor);
        pm.set(lado === "e" ? x0 : x0 + 4, y0, sola);
        pm.set(x0 + 2, y0, corL);
        pm.rect(x0, y0 + 1, 5, 1, sola);
        break;
      default: // tênis
        pm.rect(x0, y0, 5, 1, cor);
        pm.set(x0 + 4, y0, corS);
        pm.set(x0 + 2, y0, corL);
        pm.rect(x0, y0 + 1, 5, 1, sola);
        pm.set(x0 + 4, y0 + 1, escurecer(sola, 0.2));
    }
  }
}

// Largura do tronco por linha (vista de frente), conforme o formato do corpo.
function larguraTronco(corpo, y) {
  if (corpo === "largo") return y === 15 ? [7, 16] : y <= 19 ? [6, 17] : [7, 16];
  if (corpo === "curvas") return y === 15 ? [8, 15] : y <= 17 ? [7, 16] : y <= 20 ? [8, 15] : [7, 16];
  return y === 15 ? [8, 15] : [7, 16];
}

function troncoMascara(u, cima, corpo) {
  const m = M();
  for (let y = 15; y <= 22; y++) { const [a, b] = larguraTronco(corpo, y); m.linha(y + u, a, b); }
  if (cima.saia) {
    const fim = cima.saia;
    for (let y = 23; y <= fim; y++) {
      const ab = Math.min(3, Math.floor((y - 22) / 1.6));
      m.linha(y, 7 - ab, 16 + ab);
    }
  }
  return m;
}

function desenharTroncoFrente(pm, ap, P, pz, costas) {
  const u = pz.bob;
  const cima = acharCima(ap.cima);
  const t = tecidoCima(ap);
  const corp = troncoMascara(u, cima, ap.corpo);
  const peleT = M();
  const c2 = rgb(ap.cor2Cima);
  const id = cima.id;
  if (id === "regata" || id === "vestidoLongo") {
    // alças
    for (const x of [8, 9, 10, 13, 14, 15]) corp.del(x, 15 + u);
    corp.add(9, 15 + u).add(14, 15 + u);
    if (!costas) for (const [x, y] of [[10, 16], [11, 16], [12, 16], [13, 16], [11, 17], [12, 17]]) { corp.del(x, y + u); peleT.add(x, y + u); }
    for (const x of [8, 10, 11, 12, 13, 15]) peleT.add(x, 15 + u);
  } else if (!costas) {
    corp.del(11, 15 + u).del(12, 15 + u);
    peleT.add(11, 15 + u).add(12, 15 + u);
  }
  if (id === "cropped") for (let y = 20; y <= 22; y++) for (let x = 5; x <= 18; x++) if (corp.tem(x, y + u)) { corp.del(x, y + u); peleT.add(x, y + u); }
  pintarPele(pm, peleT, P);
  if (id === "jardineira") {
    // camiseta por baixo (cor 2) + peitilho e alças (cor 1)
    pintar(pm, corp, { cor: ap.cor2Cima, estampa: "liso", material: "algodao" });
    const peito = M();
    peito.rect(9, 18 + u, 6, 5);
    peito.rect(9, 15 + u, 1, 3).rect(14, 15 + u, 1, 3);
    for (let x = 5; x <= 18; x++) if (corp.tem(x, 22 + u)) peito.add(x, 22 + u);
    pintar(pm, peito, t);
    if (!costas) { pm.set(9, 18 + u, rgb("#e8c860")); pm.set(14, 18 + u, rgb("#e8c860")); pm.rect(11, 19 + u, 2, 2, escurecer(rgb(ap.corCima), 0.18)); }
    return;
  }
  if (id === "colete") {
    pintar(pm, corp, { cor: ap.cor2Cima, estampa: ap.estampaCima, material: "algodao", oy: 15 });
    const lados = M();
    for (const [x, y] of corp.pontos()) if (costas || x <= 9 || x >= 14) lados.add(x, y);
    pintar(pm, lados, { ...t, estampa: "liso" });
    if (!costas) {
      const b = escurecer(rgb(ap.corCima), 0.25);
      pm.rect(7, 19 + u, 2, 2, b);
      pm.rect(15, 19 + u, 2, 2, b);
      pm.set(8, 17 + u, b);
      pm.set(15, 17 + u, b);
    }
    return;
  }
  if (id === "avental") {
    // camisa por baixo (cor 2) e avental (cor 1, com estampa) por cima
    pintar(pm, corp, { cor: ap.cor2Cima, estampa: "liso", material: "algodao" });
    const laco = escurecer(rgb(ap.corCima), 0.2);
    if (costas) {
      for (let x = 7; x <= 16; x++) if (corp.tem(x, 21 + u)) pm.set(x, 21 + u, laco);
      pm.set(10, 20 + u, laco); pm.set(13, 20 + u, laco); pm.set(10, 22 + u, laco); pm.set(13, 22 + u, laco);
      pm.rect(11, 21 + u, 2, 1, clarear(rgb(ap.corCima), 0.2));
      return;
    }
    const av = M();
    av.rect(9, 17 + u, 6, 6);
    for (let y = 23; y <= 27; y++) av.linha(y, 8, 15);
    av.add(9, 16 + u).add(14, 16 + u).add(10, 15 + u).add(13, 15 + u);
    pintar(pm, av, { ...t, oy: 17 });
    for (let x = 8; x <= 15; x++) pm.set(x, 27, x % 2 ? escurecer(rgb(ap.corCima), 0.25) : clarear(rgb(ap.corCima), 0.2));
    pm.rect(10, 24, 4, 2, escurecer(rgb(ap.corCima), 0.15)); // bolso
    return;
  }
  pintar(pm, corp, t);
  const base = rgb(ap.corCima);
  if (id === "flanela" && !costas) {
    const gola = escurecer(base, 0.3);
    pm.set(10, 15 + u, gola); pm.set(13, 15 + u, gola); pm.set(10, 16 + u, gola); pm.set(13, 16 + u, gola);
    for (let y = 17; y <= 22; y += 2) pm.set(12, y + u, rgb("#f2efe6"));
    pm.rect(8, 17 + u, 2, 1, escurecer(base, 0.3));
    pm.rect(14, 17 + u, 2, 1, escurecer(base, 0.3));
  }
  if (id === "macacao") {
    const s2 = escurecer(base, 0.25);
    if (!costas) {
      for (let y = 15; y <= 22; y++) pm.set(12, y + u, clarear(base, 0.3)); // zíper
      pm.rect(8, 17 + u, 2, 2, s2);
      pm.rect(14, 17 + u, 2, 2, s2);
    }
    for (let x = 5; x <= 18; x++) if (corp.tem(x, 21 + u)) pm.set(x, 21 + u, s2); // cinto
    pm.set(12, 21 + u, rgb("#d9b84a"));
  }
  if (id === "jaqueta" && !costas) {
    const dentro = M();
    for (let y = 16; y <= 22; y++) dentro.linha(y + u, 10, 13);
    pintar(pm, dentro, { cor: ap.cor2Cima, estampa: "liso", material: "algodao", liso: false });
    for (let y = 16; y <= 22; y++) { pm.set(10, y + u, escurecer(base, 0.3)); pm.set(13, y + u, escurecer(base, 0.3)); }
    pm.set(9, 16 + u, clarear(base, 0.2));
    pm.set(14, 16 + u, clarear(base, 0.2));
  }
  if (id === "tech") {
    const brilho = clarear(c2, 0.35);
    if (!costas) {
      for (let y = 16; y <= 22; y++) pm.set(11, y + u, y % 2 ? c2 : brilho);
      pm.set(8, 19 + u, brilho);
      pm.set(15, 19 + u, brilho);
    } else {
      for (let x = 8; x <= 15; x++) pm.set(x, 18 + u, x % 2 ? c2 : brilho);
    }
  }
  if (id === "moletom") {
    const s = escurecer(base, 0.22);
    if (!costas) {
      pm.rect(9, 20 + u, 6, 2, s);
      pm.rect(10, 20 + u, 4, 1, escurecer(base, 0.12));
      pm.set(10, 16 + u, c2);
      pm.set(10, 17 + u, c2);
      pm.set(13, 16 + u, c2);
      pm.set(13, 17 + u, c2);
      pm.set(9, 15 + u, s);
      pm.set(14, 15 + u, s);
    } else {
      const capuz = M();
      capuz.linha(14 + u, 9, 14).linha(15 + u, 8, 15).linha(16 + u, 9, 14).linha(17 + u, 10, 13);
      pintar(pm, capuz, { cor: escurecer(base, 0.08), estampa: "liso", material: ap.materialCima });
    }
    for (let x = 5; x <= 18; x++) if (corp.tem(x, 22 + u)) pm.set(x, 22 + u, escurecer(base, 0.18));
  }
  if (id === "camisa" && !costas) {
    const gola = clarear(base, 0.3);
    pm.set(10, 15 + u, gola);
    pm.set(13, 15 + u, gola);
    pm.set(10, 16 + u, gola);
    pm.set(13, 16 + u, gola);
    for (let y = 17; y <= 22; y += 2) pm.set(12, y + u, clarear(base, 0.45));
    pm.set(15, 17 + u, escurecer(base, 0.25)); // bolso
  }
  if ((id === "vestido" || id === "vestidoLongo") && !costas) {
    for (let x = 5; x <= 18; x++) if (corp.tem(x, 21 + u)) pm.set(x, 21 + u, escurecer(base, 0.2)); // cintura
  }
  if (cima.saia) {
    for (let x = 0; x < LARG; x++) if (corp.tem(x, cima.saia)) pm.set(x, cima.saia, (x % 2 ? escurecer : clarear)(base, 0.16));
  }
}

function desenharBracosFrente(pm, ap, P, pz, costas) {
  const u = pz.bob;
  const cima = acharCima(ap.cima);
  const t = tecidoCima(ap);
  const manga = cima.manga; // 0 sem, 1 curta, 2 longa
  for (const lado of [-1, 1]) {
    const largo = ap.corpo === "largo";
    const x0 = lado < 0 ? (largo ? 4 : 5) : largo ? 18 : 17;
    const dy = pz.braco * (lado < 0 ? -1 : 1) * (costas ? -1 : 1);
    const y0 = 16 + u + (pz.andando ? Math.max(0, dy) : 0);
    const y1 = 22 + u + dy;
    const comprimento = y1 - y0 + 1;
    const fimManga = manga === 0 ? -1 : manga === 1 ? 1 : comprimento - 3;
    const mm = M(), pele = M();
    for (let k = 0; k < comprimento; k++) {
      const y = y0 + k;
      for (let i = 0; i < 2; i++) (k <= fimManga ? mm : pele).add(x0 + i, y);
    }
    // ombro
    (manga > 0 ? mm : pele).add(lado < 0 ? (largo ? 5 : 6) : largo ? 18 : 17, 15 + u);
    if (largo) (manga > 0 ? mm : pele).add(lado < 0 ? 6 : 17, 15 + u);
    pintarPele(pm, pele, P);
    pintar(pm, mm, cima.id === "colete" ? { cor: ap.cor2Cima, estampa: ap.estampaCima, material: "algodao", oy: 15 } : cima.id === "jardineira" || cima.id === "avental" ? { cor: ap.cor2Cima, estampa: "liso", material: "algodao" } : t);
    if (manga === 2) {
      const pun = escurecer(rgb(ap.corCima), cima.id === "tech" ? 0 : 0.2);
      pm.set(x0, y0 + fimManga, cima.id === "tech" ? rgb(ap.cor2Cima) : pun);
      pm.set(x0 + 1, y0 + fimManga, cima.id === "tech" ? rgb(ap.cor2Cima) : pun);
    }
  }
}

// ---------------------------------------------------------------- Acessórios
function acessCabecaFrente(pm, ap, P, u, costas, vista) {
  const cor = rgb(ap.corCabeca);
  const cs = escurecer(cor, 0.3), cl = clarear(cor, 0.3);
  const lado = vista === "lado";
  const m = M();
  switch (ap.cabeca) {
    case "bone":
      if (lado) {
        m.fn((x, y) => y >= 1 + u && y <= 5 + u && ((x + 0.5 - 12) / 5.6) ** 2 + ((y + 0.5 - (5.5 + u)) / 4.6) ** 2 <= 1);
        pintar(pm, m, { cor: ap.corCabeca, estampa: "liso" });
        pm.rect(15, 5 + u, 4, 1, cs);
        pm.rect(16, 5 + u, 2, 1, cor);
      } else {
        m.fn((x, y) => y >= 1 + u && y <= 5 + u && ((x + 0.5 - 12) / 6.2) ** 2 + ((y + 0.5 - (5.8 + u)) / 4.9) ** 2 <= 1);
        pintar(pm, m, { cor: ap.corCabeca, estampa: "liso" });
        if (!costas) {
          pm.rect(6, 6 + u, 12, 1, cs);
          pm.rect(7, 6 + u, 10, 1, cor);
          pm.set(12, 3 + u, cl);
        } else {
          pm.rect(10, 5 + u, 4, 1, P.cabS);
          pm.set(11, 4 + u, cs);
          pm.set(12, 4 + u, cs);
        }
      }
      break;
    case "chapeuPalha": {
      const palha = rgb("#dcb867"), ps = escurecer(palha, 0.25), pl = clarear(palha, 0.25);
      const abaY = 5 + u;
      if (lado) pm.rect(4, abaY, 16, 1, palha);
      else pm.rect(2, abaY, 20, 1, palha);
      for (let x = 2; x < 22; x++) if (pm.alfa(x, abaY) && x % 3 === 0) pm.set(x, abaY, pl);
      if (!lado) { pm.set(2, abaY, ps); pm.set(21, abaY, ps); pm.rect(3, abaY + 1, 18, 1, [60, 40, 20, 70]); }
      m.fn((x, y) => y >= 1 + u && y < abaY && Math.abs(x + 0.5 - 12) <= (y === 1 + u ? 3.5 : 4.6));
      for (const [x, y] of m.pontos()) pm.set(x, y, (x + y) % 3 === 0 ? pl : x >= 15 ? ps : palha);
      for (let x = 7; x <= 16; x++) if (pm.alfa(x, abaY - 1)) pm.set(x, abaY - 1, x === 16 ? cs : cor);
      break;
    }
    case "chapeuBalde":
      m.fn((x, y) => y >= 1 + u && y <= 5 + u && Math.abs(x + 0.5 - 12) <= (y === 1 + u ? 4 : 5.2));
      m.linha(6 + u, lado ? 7 : 5, lado ? 18 : 18);
      if (!lado) m.add(4, 6 + u).add(19, 6 + u);
      pintar(pm, m, { cor: ap.corCabeca, cor2: misturar(ap.corCabeca, "#ffffff", 0.5), estampa: "listras", material: "canhamo", oy: 1 });
      break;
    case "gorro":
      m.fn((x, y) => y >= 1 + u && y <= 5 + u && ((x + 0.5 - 12) / 6.1) ** 2 + ((y + 0.5 - (6 + u)) / 5.3) ** 2 <= 1);
      pintar(pm, m, { cor: ap.corCabeca, estampa: "liso", material: "canhamo" });
      for (let x = 6; x <= 17; x++) if (pm.alfa(x, 5 + u)) pm.set(x, 5 + u, x % 2 ? cs : cor);
      pm.rect(11, 0 + u, 2, 1, cl);
      break;
    case "faixa":
      if (lado) { pm.rect(8, 4 + u, 8, 1, cor); pm.set(7, 5 + u, cor); pm.set(6, 6 + u, cs); }
      else for (let x = 6; x <= 17; x++) if (pm.alfa(x, 4 + u)) pm.set(x, 4 + u, x === 17 ? cs : x === 6 ? cl : cor);
      if (!lado && !costas) pm.set(12, 4 + u, cl);
      break;
    case "coroaFlores": {
      const folha = rgb("#4f9a3c");
      const xs = lado ? [8, 10, 12, 14] : [6, 8, 10, 12, 14, 16, 18];
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i] - (lado ? 0 : 0.5) | 0;
        const y = 3 + u + (lado ? 0 : Math.abs(i - 3) > 2 ? 1 : 0);
        pm.set(x, y + 1, folha);
        pm.set(x + 1, y + 1, escurecer(folha, 0.2));
        const c = i % 2 ? cor : rgb("#f6e27a");
        pm.set(x, y, c);
        pm.set(x + 1, y, clarear(c, 0.25));
      }
      break;
    }
    case "chapeuVaqueiro": {
      const abaY = 5 + u;
      if (lado) {
        pm.rect(5, abaY, 15, 1, cor);
        pm.set(5, abaY - 1, cor); pm.set(19, abaY - 1, cor);
        m.fn((x, y) => y >= 1 + u && y < abaY && x >= 8 && x <= 15 && !(y === 1 + u && (x === 8 || x === 15)));
      } else {
        pm.rect(3, abaY, 18, 1, cor);
        pm.set(2, abaY - 1, cor); pm.set(21, abaY - 1, cor); pm.set(3, abaY - 1, cl); pm.set(20, abaY - 1, cs);
        pm.rect(4, abaY + 1, 16, 1, [60, 40, 20, 70]);
        m.fn((x, y) => y >= 1 + u && y < abaY && x >= 7 && x <= 16 && !(y === 1 + u && (x === 7 || x === 16 || x === 11 || x === 12)));
      }
      pintar(pm, m, { cor: ap.corCabeca, estampa: "liso", material: "canhamo" });
      for (let x = 0; x < LARG; x++) if (m.tem(x, abaY - 1)) pm.set(x, abaY - 1, escurecer(cor, 0.45)); // fita
      if (!lado && !costas) pm.set(12, abaY - 1, rgb("#d9b84a"));
      break;
    }
    case "lenco":
      m.fn((x, y) => y >= 2 + u && y <= (lado ? 6 : 5) + u && ((x + 0.5 - 12) / 6.2) ** 2 + ((y + 0.5 - (6.2 + u)) / 4.8) ** 2 <= 1);
      if (costas) { m.rect(11, 6 + u, 2, 2); m.add(10, 8 + u).add(13, 8 + u); }
      else if (lado) { m.rect(7, 6 + u, 2, 2); m.add(6, 8 + u); }
      pintar(pm, m, { cor: ap.corCabeca, cor2: "#f2efe6", estampa: "bolinhas", material: "algodao", oy: 0 });
      break;
    case "fones": {
      const f = rgb("#2e2a33"), fl = rgb("#5a5466");
      if (lado) {
        for (let y = 1; y <= 8; y++) pm.set(11, y + u, y < 3 ? fl : f);
        pm.rect(10, 8 + u, 3, 3, cor);
        pm.set(10, 8 + u, cl);
      } else {
        for (let x = 7; x <= 16; x++) pm.set(x, 1 + u, f);
        pm.set(6, 2 + u, f); pm.set(17, 2 + u, f);
        for (let y = 3; y <= 7; y++) { pm.set(5, y + u, f); pm.set(18, y + u, f); }
        pm.rect(4, 7 + u, 3, 4, cor);
        pm.rect(17, 7 + u, 3, 4, cor);
        pm.set(4, 7 + u, cl);
        pm.set(19, 10 + u, cs);
      }
      break;
    }
  }
}

function acessRostoFrente(pm, ap, u) {
  const r = ap.rostoAc;
  if (r === "oculos") {
    const aro = rgb("#3a2e2a");
    for (const x0 of [8, 13]) {
      pm.set(x0, 8 + u, aro); pm.set(x0 + 2, 8 + u, aro);
      pm.set(x0, 9 + u, aro); pm.set(x0 + 2, 9 + u, aro);
      pm.set(x0 + 1, 10 + u, aro); pm.set(x0 + 1, 7 + u, aro);
    }
    pm.set(11, 8 + u, aro); pm.set(12, 8 + u, aro);
    pm.set(7, 8 + u, aro); pm.set(16, 8 + u, aro);
  } else if (r === "oculosEscuros") {
    const l = rgb("#1d1820");
    pm.rect(8, 8 + u, 3, 2, l);
    pm.rect(13, 8 + u, 3, 2, l);
    pm.set(8, 8 + u, rgb("#7a6f88"));
    pm.set(13, 8 + u, rgb("#7a6f88"));
    pm.rect(11, 8 + u, 2, 1, l);
    pm.set(7, 8 + u, l); pm.set(16, 8 + u, l);
  } else if (r === "visor") {
    for (let x = 7; x <= 16; x++) {
      pm.set(x, 8 + u, [80, 240, 220, 230]);
      pm.set(x, 9 + u, [40, 180, 200, 210]);
    }
    pm.set(8, 8 + u, [230, 255, 250, 255]);
    pm.set(9, 8 + u, [230, 255, 250, 255]);
  }
}

function acessRostoLado(pm, ap, u) {
  const r = ap.rostoAc;
  if (r === "oculos") {
    const aro = rgb("#3a2e2a");
    pm.set(14, 8 + u, aro); pm.set(16, 8 + u, aro); pm.set(14, 9 + u, aro); pm.set(16, 9 + u, aro);
    pm.set(15, 10 + u, aro); pm.set(15, 7 + u, aro);
    pm.rect(12, 8 + u, 2, 1, aro);
  } else if (r === "oculosEscuros") {
    pm.rect(14, 8 + u, 3, 2, rgb("#1d1820"));
    pm.set(16, 8 + u, rgb("#7a6f88"));
    pm.rect(12, 8 + u, 2, 1, rgb("#1d1820"));
  } else if (r === "visor") {
    for (let x = 12; x <= 17; x++) { pm.set(x, 8 + u, [80, 240, 220, 230]); pm.set(x, 9 + u, [40, 180, 200, 210]); }
  }
}

function acessPescoco(pm, ap, u, vista) {
  const cor = rgb(ap.corPescoco), cs = escurecer(cor, 0.3), cl = clarear(cor, 0.25);
  const lado = vista === "lado";
  switch (ap.pescoco) {
    case "cachecol":
      if (lado) {
        pm.rect(10, 14 + u, 5, 2, cor);
        pm.set(14, 15 + u, cs);
        pm.rect(10, 16 + u, 2, 3, cor);
        pm.set(11, 18 + u, cs);
      } else {
        pm.rect(8, 14 + u, 8, 2, cor);
        for (let x = 8; x <= 15; x += 2) pm.set(x, 15 + u, cs);
        pm.set(8, 14 + u, cl);
        if (vista !== "costas") { pm.rect(13, 16 + u, 2, 4, cor); pm.set(14, 17 + u, cs); pm.set(14, 19 + u, cs); pm.rect(13, 20 + u, 2, 1, cl); }
      }
      break;
    case "colarSementes":
      if (vista === "costas") break;
      if (lado) { for (let x = 13; x <= 15; x++) pm.set(x, 16 + u, x % 2 ? rgb("#8a5a2e") : rgb("#e8d2a0")); break; }
      for (let x = 9; x <= 14; x++) pm.set(x, 16 + u + (x === 9 || x === 14 ? -1 : 0), x % 2 ? rgb("#8a5a2e") : rgb("#e8d2a0"));
      pm.set(11, 17 + u, rgb("#5aa847"));
      pm.set(12, 17 + u, rgb("#3f8a35"));
      break;
    case "bandana":
      if (lado) { pm.rect(11, 14 + u, 4, 2, cor); pm.set(14, 16 + u, cs); break; }
      if (vista === "costas") { pm.rect(9, 14 + u, 6, 1, cor); pm.set(11, 15 + u, cs); pm.set(12, 15 + u, cs); break; }
      pm.rect(9, 14 + u, 6, 1, cor);
      pm.rect(10, 15 + u, 4, 1, cor);
      pm.rect(11, 16 + u, 2, 1, cs);
      pm.set(10, 15 + u, cl);
      break;
  }
}

function acessCostas(pm, ap, u, vista, fase) {
  const c = ap.costas;
  if (c === "nenhum") return;
  const cor = rgb(ap.corCostas), cs = escurecer(cor, 0.3), cl = clarear(cor, 0.25);
  if (c === "ecobag") {
    const bolsa = rgb(ap.corCostas);
    if (fase !== "frente") return;
    if (vista === "frente") {
      for (let i = 0; i <= 6; i++) pm.set(9 + i, 15 + u + i, rgb("#8a6a40"));
      const m = M();
      m.rect(16, 20 + u, 4, 4);
      pintar(pm, m, { cor: ap.corCostas, estampa: "liso", material: "canhamo" });
      pm.set(17, 21 + u, rgb("#5aa847"));
      pm.set(18, 21 + u, rgb("#3f8a35"));
    } else if (vista === "costas") {
      for (let i = 0; i <= 6; i++) pm.set(15 - i, 15 + u + i, rgb("#8a6a40"));
      const m = M();
      m.rect(4, 20 + u, 4, 4);
      pintar(pm, m, { cor: ap.corCostas, estampa: "liso", material: "canhamo" });
    } else {
      pm.rect(10, 15 + u, 1, 5, rgb("#8a6a40"));
      const m = M();
      m.rect(9, 20 + u, 4, 4);
      pintar(pm, m, { cor: ap.corCostas, estampa: "liso", material: "canhamo" });
      pm.set(10, 21 + u, rgb("#5aa847"));
    }
    void bolsa;
    return;
  }
  if (c === "cesto") {
    const palha = rgb("#c8a060"), ps = escurecer(palha, 0.3), pl = clarear(palha, 0.25);
    const trama = (m) => { for (const [x, y] of m.pontos()) pm.set(x, y, (x + y) % 2 ? palha : (y % 2 ? ps : pl)); };
    const verdura = (x, y) => {
      pm.set(x, y, rgb("#5aa847")); pm.set(x + 1, y - 1, rgb("#73c650")); pm.set(x + 2, y, rgb("#3f8a35"));
      pm.set(x + 4, y, rgb("#ee8a2e")); pm.set(x + 4, y - 1, rgb("#5aa847")); pm.set(x + 6, y, rgb("#d0443a"));
    };
    if (vista === "frente") {
      if (fase !== "frente") return;
      for (let y = 15; y <= 20; y++) { pm.set(8, y + u, rgb("#8a6a40")); pm.set(15, y + u, rgb("#8a6a40")); }
      return;
    }
    if (vista === "costas") {
      if (fase !== "frente") return;
      const m = M();
      for (let y = 14; y <= 23; y++) m.linha(y + u, y > 21 ? 9 : 8, y > 21 ? 14 : 15);
      verdura(9, 13 + u);
      trama(m);
      pm.rect(8, 14 + u, 8, 1, ps);
      return;
    }
    if (fase === "tras") {
      const m = M();
      for (let y = 14; y <= 23; y++) m.linha(y + u, 5, 9);
      trama(m);
      pm.set(6, 13 + u, rgb("#5aa847")); pm.set(7, 12 + u, rgb("#73c650")); pm.set(8, 13 + u, rgb("#ee8a2e"));
    } else for (let y = 15; y <= 20; y++) pm.set(11, y + u, rgb("#8a6a40"));
    void cl;
    return;
  }
  const solar = c === "mochilaSolar";
  if (vista === "frente") {
    if (fase !== "frente") return;
    for (let y = 15; y <= 20; y++) { pm.set(8, y + u, cs); pm.set(15, y + u, cs); }
    return;
  }
  if (vista === "costas") {
    if (fase !== "frente") return;
    const m = M();
    m.rect(8, 15 + u, 8, 8);
    m.del(8, 15 + u).del(15, 15 + u);
    pintar(pm, m, { cor: ap.corCostas, estampa: "liso", material: solar ? "tech" : "canhamo" });
    if (solar) {
      const azul = rgb("#2c4f9a"), linha = rgb("#9ec4ff");
      pm.rect(9, 16 + u, 6, 4, azul);
      for (let x = 9; x <= 14; x++) pm.set(x, 18 + u, linha);
      pm.set(11, 16 + u, linha); pm.set(11, 17 + u, linha); pm.set(11, 19 + u, linha);
      pm.set(9, 16 + u, clarear(azul, 0.5));
    } else {
      pm.rect(9, 19 + u, 6, 3, cs);
      pm.rect(10, 19 + u, 4, 1, cl);
      pm.set(12, 20 + u, rgb("#e8c860"));
    }
    return;
  }
  // lado: a mochila fica atrás (à esquerda do tronco)
  if (fase === "tras") {
    const m = M();
    m.rect(6, 15 + u, 4, 8);
    m.del(6, 15 + u);
    pintar(pm, m, { cor: ap.corCostas, estampa: "liso", material: solar ? "tech" : "canhamo" });
    if (solar) { pm.rect(6, 16 + u, 1, 5, rgb("#2c4f9a")); pm.set(6, 18 + u, rgb("#9ec4ff")); }
    else pm.rect(6, 19 + u, 1, 3, cs);
  } else {
    for (let y = 15; y <= 20; y++) pm.set(11, y + u, cs);
  }
}

// ---------------------------------------------------------------- Vistas
function desenharFrenteOuCostas(ap, quadro, costas) {
  const pm = new Pixmap(LARG, ALT);
  const P = paleta(ap);
  const pz = pose(quadro);
  const u = pz.bob;
  const hs = acharCabelo(ap.cabelo);
  const cabM = cabecaFrente(ap.rosto);
  const cabU = M();
  for (const [x, y] of cabM.pontos()) cabU.add(x, y + u);

  // 1. cabelo de trás (só na vista de frente)
  let cf = null;
  if (!costas) {
    cf = cabeloFrente(hs, u, cabU);
    texturaCabelo(pm, cf.tras, P, hs.topo, 1);
    if (hs.extra === "dreads") dreadsFrente(pm, P, u, cf.tras);
  }
  if (costas && ap.costas === "ecobag") acessCostas(pm, ap, u, "frente", "frente");
  // 2. pernas, roupa de baixo e calçados
  const pernas = pernasFrente(pz);
  desenharBaixoFrente(pm, ap, P, pz, pernas, costas);
  desenharCalcadoFrente(pm, ap, P, pernas);
  // 3. tronco e braços
  desenharTroncoFrente(pm, ap, P, pz, costas);
  desenharBracosFrente(pm, ap, P, pz, costas);
  // 4. pescoço e cabeça
  const pesc = M();
  pesc.rect(10, 14 + u, 4, 1);
  for (const [x, y] of pesc.pontos()) pm.set(x, y, P.peleS);
  pintarPele(pm, cabU, P);
  // orelhas
  pm.set(6, 8 + u, P.pele); pm.set(6, 9 + u, P.peleS);
  pm.set(17, 8 + u, P.peleS); pm.set(17, 9 + u, P.peleE);
  if (!costas) rostoFrente(pm, ap, P, u);
  acessPescoco(pm, ap, u, costas ? "costas" : "frente");
  // 5. cabelo
  if (!costas) {
    if (cf.raspado) {
      const crista = pintarRaspado(pm, cf.frente, P, cf.moicano, "frente", u);
      if (crista) texturaCabelo(pm, crista, P, "liso");
    } else texturaCabelo(pm, cf.frente, P, hs.topo, 2);
  } else {
    const cc = cabeloCostas(hs, u, cabU);
    if (cc.raspado) {
      const crista = pintarRaspado(pm, cc.m, P, cc.moicano, "costas", u);
      if (crista) texturaCabelo(pm, crista, P, "liso");
    } else {
      acessCostas(pm, ap, u, "costas", "frente");
      texturaCabelo(pm, cc.m, P, hs.topo, 3);
      if (hs.extra === "dreads") for (const [x, y] of cc.m.pontos()) if (x % 2 === 0 && y > 11 + u) pm.set(x, y, P.cabS);
    }
  }
  extrasCabelo(pm, hs, P, u, costas ? "costas" : "frente");
  if (costas && (cf?.raspado || hs.topo === "raspado" || hs.topo === "moicano" || hs.topo === "degrade" || hs.topo === "careca")) acessCostas(pm, ap, u, "costas", "frente");
  if (!costas) {
    acessRostoFrente(pm, ap, u);
    acessCostas(pm, ap, u, "frente", "frente");
  }
  acessCabecaFrente(pm, ap, P, u, costas, costas ? "costas" : "frente");
  pm.contornar();
  return pm;
}

function desenharLado(ap, quadro) {
  const pm = new Pixmap(LARG, ALT);
  const P = paleta(ap);
  const pz = pose(quadro);
  const u = pz.bob;
  const hs = acharCabelo(ap.cabelo);
  const cima = acharCima(ap.cima);
  const t = tecidoCima(ap);
  const tb = tecidoBaixo(ap);

  acessCostas(pm, ap, u, "lado", "tras");
  // braço de trás
  const balanco = pz.andando ? (pz.passo === -1 ? 1 : pz.passo === 1 ? -1 : 0) * 2 : 0;
  const braco = (sw, escuro) => {
    const mm = M(), pele = M();
    const manga = cima.manga;
    for (let y = 16 + u; y <= 22 + u; y++) {
      const k = y - (16 + u);
      const x = 11 + Math.round((sw * k) / 6);
      const naManga = manga === 2 ? k <= 4 : manga === 1 ? k <= 1 : false;
      (naManga ? mm : pele).add(x, y).add(x + 1, y);
    }
    const tm = cima.id === "colete" || cima.id === "jardineira" || cima.id === "avental" ? { cor: ap.cor2Cima, estampa: "liso", material: "algodao" } : t;
    if (escuro) {
      for (const [x, y] of pele.pontos()) pm.set(x, y, P.peleS);
      for (const [x, y] of mm.pontos()) pm.set(x, y, escurecer(rgb(ap.corCima), 0.3));
    } else {
      pintarPele(pm, pele, P);
      pintar(pm, mm, tm);
    }
  };
  braco(-balanco, true);

  // pernas
  const pernas = [];
  const desloc = pz.passo === -1 ? [3, -3] : pz.passo === 1 ? [-3, 3] : [0, 0]; // [perto, longe]
  const ergue = pz.andando && pz.passo === 0 ? (pz.ergueLado === 1 ? [0, 1] : [1, 0]) : [0, 0];
  for (let i = 1; i >= 0; i--) {
    const off = desloc[i];
    const m = M();
    const fim = 28 - ergue[i];
    for (let y = 23; y <= fim; y++) {
      const k = (y - 23) / Math.max(1, fim - 23);
      const x = 10 + Math.round(off * k);
      m.add(x, y).add(x + 1, y).add(x + 2, y);
    }
    pernas.push({ m, pe: fim + 1, x: 10 + off, longe: i === 1 });
  }
  const baixo = ap.baixo;
  const cobre = cima.cobrePernas;
  for (const p of pernas) {
    const roupa = M(), pele = M();
    const fimRoupa = cobre || baixo === "calca" || baixo === "cargo" || baixo === "legging" ? 99 : baixo === "bermuda" ? 25 : baixo === "short" ? 24 : 22;
    for (const [x, y] of p.m.pontos()) (y <= fimRoupa ? roupa : pele).add(x, y);
    if (p.longe) {
      for (const [x, y] of pele.pontos()) pm.set(x, y, P.peleS);
      for (const [x, y] of roupa.pontos()) pm.set(x, y, escurecer(rgb(cobre ? ap.corCima : ap.corBaixo), 0.25));
    } else {
      pintarPele(pm, pele, P);
      pintar(pm, roupa, cobre ? t : tb);
    }
    // calçado (bico para a direita)
    const cor = rgb(ap.corCalcado), cs = escurecer(cor, 0.3), cl = clarear(cor, 0.3);
    const x0 = p.x, y0 = p.pe;
    const f = p.longe ? (c) => escurecer(c, 0.22) : (c) => c;
    switch (ap.calcado) {
      case "botaCano":
        pm.rect(x0, y0 - 4, 3, 4, f(cor)); pm.rect(x0, y0 - 4, 3, 1, f(cl)); pm.set(x0 + 1, y0 - 2, f(clarear(cor, 0.45)));
        pm.rect(x0, y0, 5, 1, f(cor)); pm.set(x0 + 4, y0, f(cl)); pm.rect(x0, y0 + 1, 5, 1, f(rgb("#4a3a32"))); pm.set(x0, y0 + 1, f(rgb("#2a1e18")));
        break;
      case "botas":
        pm.rect(x0, y0 - 2, 3, 2, f(cor)); pm.rect(x0, y0, 5, 1, f(cor)); pm.set(x0 + 4, y0, f(cl)); pm.rect(x0, y0 + 1, 5, 1, f(rgb("#4a3a32")));
        break;
      case "galochas":
        pm.rect(x0, y0 - 3, 3, 3, f(cor)); pm.set(x0 + 1, y0 - 3, f(cl)); pm.rect(x0, y0, 5, 1, f(cor)); pm.rect(x0, y0 + 1, 5, 1, f(escurecer(cor, 0.45)));
        break;
      case "sandalias":
        pm.rect(x0, y0, 5, 1, f(P.pele)); pm.set(x0 + 1, y0, f(cor)); pm.set(x0 + 3, y0, f(cor)); pm.rect(x0, y0 + 1, 5, 1, f(escurecer(cor, 0.35)));
        break;
      case "canoAlto":
        pm.rect(x0, y0 - 1, 3, 1, f(cor)); pm.rect(x0, y0, 5, 1, f(cor)); pm.set(x0 + 4, y0, f(rgb("#eeeae0"))); pm.rect(x0, y0 + 1, 5, 1, f(rgb("#eeeae0")));
        break;
      default:
        pm.rect(x0, y0, 5, 1, f(cor)); pm.set(x0 + 3, y0, f(cl)); pm.set(x0, y0, f(cs)); pm.rect(x0, y0 + 1, 5, 1, f(rgb("#eeeae0")));
    }
  }
  // saias (vista de lado)
  if (!cobre && (baixo === "saia" || baixo === "saiaLonga")) {
    const m = M();
    const fim = baixo === "saia" ? 26 : 28;
    for (let y = 23; y <= fim; y++) { const ab = Math.floor((y - 23) / 1.5); m.linha(y, 9 - ab, 14 + ab); }
    pintar(pm, m, tb);
  }
  // tronco
  const corp = M();
  corp.linha(15 + u, 10, ap.corpo === "largo" ? 14 : 13);
  for (let y = 16; y <= 22; y++) {
    let a = 9, b = 14;
    if (ap.corpo === "largo" && y <= 19) b = 15;
    if (ap.corpo === "curvas") { if (y <= 17) b = 15; else if (y <= 20) { a = 10; b = 14; } else a = 8; }
    corp.linha(y + u, a, b);
  }
  if (cima.saia) for (let y = 23; y <= cima.saia; y++) { const ab = Math.floor((y - 22) / 1.5); corp.linha(y, 9 - ab, 14 + ab); }
  if (cima.id === "cropped") for (let y = 20; y <= 22; y++) for (let x = 9; x <= 14; x++) corp.del(x, y + u);
  if (cima.id === "cropped") { const pele = M(); for (let y = 20; y <= 22; y++) pele.linha(y + u, 9, 14); pintarPele(pm, pele, P); }
  if (cima.id === "jardineira" || cima.id === "colete") {
    pintar(pm, corp, { cor: ap.cor2Cima, estampa: cima.id === "colete" ? ap.estampaCima : "liso", material: "algodao", oy: 15 });
    const sobre = M();
    if (cima.id === "jardineira") { sobre.rect(12, 18 + u, 3, 5); sobre.rect(12, 15 + u, 1, 3); sobre.rect(9, 22 + u, 6, 1); }
    else for (const [x, y] of corp.pontos()) if (x <= 12) sobre.add(x, y);
    pintar(pm, sobre, { ...t, estampa: "liso" });
  } else {
    pintar(pm, corp, t);
  }
  const base = rgb(ap.corCima);
  if (cima.id === "moletom") {
    const capuz = M();
    capuz.linha(14 + u, 8, 10).linha(15 + u, 8, 10).linha(16 + u, 9, 10);
    pintar(pm, capuz, { cor: escurecer(base, 0.08), estampa: "liso" });
    pm.set(14, 17 + u, rgb(ap.cor2Cima));
  }
  if (cima.id === "avental") {
    pintar(pm, corp, { cor: ap.cor2Cima, estampa: "liso", material: "algodao" });
    const av = M();
    av.rect(13, 17 + u, 2, 6);
    for (let y = 23; y <= 27; y++) av.linha(y, 13, 15);
    av.add(13, 16 + u).add(12, 15 + u);
    pintar(pm, av, { ...t, oy: 17 });
    pm.set(9, 21 + u, escurecer(rgb(ap.corCima), 0.2));
    pm.set(8, 22 + u, escurecer(rgb(ap.corCima), 0.2));
  }
  if (cima.id === "macacao") { pm.rect(9, 21 + u, 6, 1, escurecer(base, 0.25)); }
  if (cima.id === "tech") for (let y = 16; y <= 22; y++) pm.set(13, y + u, y % 2 ? rgb(ap.cor2Cima) : clarear(rgb(ap.cor2Cima), 0.35));
  if (cima.id === "jaqueta") { for (let y = 16; y <= 22; y++) pm.set(14, y + u, rgb(ap.cor2Cima)); }
  if (cima.id === "regata" || cima.id === "vestidoLongo") { pm.set(13, 15 + u, P.pele); pm.set(14, 16 + u, P.pele); }
  // pescoço e cabeça
  pm.rect(11, 14 + u, 3, 1, P.peleS);
  const cab = cabecaLado(ap.rosto);
  const cabU = M();
  for (const [x, y] of cab.pontos()) cabU.add(x, y + u);
  // cabelo longo que cai pelas costas: depois do tronco, antes da cabeça
  const cl = cabeloLado(hs, u, cabU);
  pintarPele(pm, cabU, P);
  rostoLado(pm, ap, P, u);
  acessPescoco(pm, ap, u, "lado");
  if (cl.raspado) {
    const crista = pintarRaspado(pm, cl.m, P, cl.moicano, "lado", u);
    if (crista) texturaCabelo(pm, crista, P, "liso");
  } else {
    texturaCabelo(pm, cl.m, P, hs.topo, 4);
    if (hs.extra === "dreads") for (const [x, y] of cl.m.pontos()) if (x % 2 === 0 && y > 11 + u) pm.set(x, y, P.cabS);
  }
  extrasCabelo(pm, hs, P, u, "lado");
  acessRostoLado(pm, ap, u);
  acessCostas(pm, ap, u, "lado", "frente");
  // braço da frente
  braco(balanco, false);
  acessCabecaFrente(pm, ap, P, u, false, "lado");
  pm.contornar();
  return pm;
}

export function desenharQuadro(ap, dir, quadro) {
  if (dir === "baixo") return desenharFrenteOuCostas(ap, quadro, false);
  if (dir === "cima") return desenharFrenteOuCostas(ap, quadro, true);
  const pm = desenharLado(ap, quadro);
  return dir === "esq" ? pm.espelhar() : pm;
}

// Folha de sprites: linhas = direções, colunas = quadros.
const cacheFolhas = new Map();
export function folhaDeSprites(ap) {
  const chave = JSON.stringify(ap);
  const pronta = cacheFolhas.get(chave);
  if (pronta) return pronta;
  const c = criarCanvas(LARG * QUADROS, ALT * DIRECOES.length);
  const ctx = c.getContext("2d");
  DIRECOES.forEach((d, j) => {
    for (let q = 0; q < QUADROS; q++) desenharQuadro(ap, d, q).desenharEm(ctx, q * LARG, j * ALT);
  });
  if (cacheFolhas.size > 40) cacheFolhas.delete(cacheFolhas.keys().next().value);
  cacheFolhas.set(chave, c);
  return c;
}

// Desenha um quadro já pronto num contexto (com escala), centrado na base (pés).
export function desenharSprite(ctx, folha, dir, quadro, x, y, escala = 1) {
  const j = Math.max(0, DIRECOES.indexOf(dir));
  ctx.drawImage(folha, quadro * LARG, j * ALT, LARG, ALT, Math.round(x - (LARG * escala) / 2), Math.round(y - ALT * escala), LARG * escala, ALT * escala);
}
