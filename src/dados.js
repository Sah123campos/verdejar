// Dados do Raízes do Sertão: culturas, itens, construções, níveis e conteúdo educativo.
// Os números de jogo (tempos, água, preços) são simplificações para a partida ficar
// divertida. As informações "na vida real" ficam no Guia, com as fontes.

// Tempo: 1 hora de jogo = 7,5 segundos reais (1 dia = 3 minutos).
export const SEG_POR_HORA = 7.5;
export const HORAS_DIA = 24;
// Estações: 6 dias de chuvas, 6 dias de estiagem, e assim por diante.
export const DIAS_CHUVA = 6;
export const DIAS_SECA = 6;

// ---------------------------------------------------------------- Culturas
// cresce: horas até a colheita | agua: quanto a umidade do solo cai por hora
// tolera: horas sem água antes de murchar | rend: quanto colhe | rebrota: horas para nova colheita
export const CULTURAS = {
  coentro: { nome: "Coentro", nivel: 1, cresce: 12, agua: 5, tolera: 8, rend: 3, semente: 4, venda: 3, xp: 2, familia: "folhosa", cor: "#5aa847" },
  alface: { nome: "Alface", nivel: 1, cresce: 18, agua: 5, tolera: 6, rend: 2, semente: 5, venda: 6, xp: 3, familia: "folhosa", cor: "#9bd46a" },
  feijao: { nome: "Feijão-de-corda", nivel: 1, cresce: 36, agua: 2.5, tolera: 30, rend: 4, semente: 6, venda: 5, xp: 5, familia: "leguminosa", adaptada: true, fixaN: true, cor: "#c9a36a" },
  cebolinha: { nome: "Cebolinha", nivel: 2, cresce: 24, agua: 4, tolera: 10, rend: 3, semente: 5, venda: 4, xp: 4, familia: "tempero", cor: "#3f9a46" },
  milho: { nome: "Milho", nivel: 2, cresce: 54, agua: 3.5, tolera: 16, rend: 3, semente: 8, venda: 9, xp: 8, familia: "graminea", alto: true, cor: "#f1d04b" },
  couve: { nome: "Couve", nivel: 3, cresce: 30, agua: 4.5, tolera: 10, rend: 2, semente: 8, venda: 6, xp: 5, familia: "folhosa", rebrota: 14, colheitas: 3, cor: "#2f7a34" },
  tomate: { nome: "Tomate", nivel: 3, cresce: 48, agua: 4.5, tolera: 10, rend: 3, semente: 10, venda: 7, xp: 7, familia: "solanacea", rebrota: 18, colheitas: 3, cor: "#d0443a" },
  abobora: { nome: "Abóbora", nivel: 4, cresce: 60, agua: 3, tolera: 22, rend: 2, semente: 10, venda: 14, xp: 9, familia: "cucurbitacea", adaptada: true, cor: "#ee8a2e" },
  melancia: { nome: "Melancia", nivel: 5, cresce: 72, agua: 4, tolera: 14, rend: 2, semente: 14, venda: 20, xp: 12, familia: "cucurbitacea", cor: "#3c9a48" },
  mandioca: { nome: "Mandioca", nivel: 5, cresce: 120, agua: 1.5, tolera: 72, rend: 5, semente: 12, venda: 9, xp: 15, familia: "raiz", adaptada: true, alto: true, cor: "#d9b884" },
  palma: { nome: "Palma forrageira", nivel: 5, cresce: 90, agua: 0.8, tolera: 150, rend: 4, semente: 15, venda: 4, xp: 10, familia: "cacto", adaptada: true, rebrota: 48, perene: true, forragem: true, cor: "#7fb04a" },
  acerola: { nome: "Acerola", nivel: 7, cresce: 100, agua: 2.5, tolera: 40, rend: 4, semente: 30, venda: 6, xp: 14, familia: "frutifera", adaptada: true, rebrota: 36, perene: true, alto: true, cor: "#e2453c" },
};

// ---------------------------------------------------------------- Itens
// cat: produto (vende), insumo (usa na roça), material (compostagem/construção), semente
export const ITENS = {
  ovo: { nome: "Ovo", cat: "produto", venda: 4 },
  leite: { nome: "Leite de cabra", cat: "produto", venda: 12 },
  peixe: { nome: "Tilápia", cat: "produto", venda: 18 },
  composto: { nome: "Composto orgânico", cat: "insumo", venda: 6, info: "Melhora a fertilidade do solo aos poucos." },
  humus: { nome: "Húmus de minhoca", cat: "insumo", venda: 9, info: "Adubo orgânico produzido pelas minhocas." },
  adubo: { nome: "Adubo comprado", cat: "insumo", compra: 18, info: "Funciona, mas custa caro e não melhora o solo a longo prazo como o composto." },
  palha: { nome: "Palha", cat: "material", seco: true, cn: 80, info: "Material seco (rico em carbono). Serve para compostagem e cobertura do solo." },
  folhas: { nome: "Folhas secas", cat: "material", seco: true, cn: 50, info: "Material seco (rico em carbono) para a compostagem." },
  galhos: { nome: "Galhos e varas", cat: "material", info: "Usados para construir a composteira e cercas." },
  restos: { nome: "Restos de hortaliças", cat: "material", verde: true, cn: 15, info: "Material verde (rico em nitrogênio) para a compostagem." },
  frutas: { nome: "Cascas e restos de frutas", cat: "material", verde: true, cn: 25, info: "Material verde (rico em nitrogênio)." },
  esterco: { nome: "Esterco", cat: "material", verde: true, cn: 15, info: "Rico em nitrogênio. Vai para a composteira, nunca fresco direto na horta." },
  racao: { nome: "Ração", cat: "insumo", compra: 6, info: "Alimento para galinhas e peixes." },
  kitGotejo: { nome: "Kit de gotejamento", cat: "insumo", compra: 25, info: "Leva a água gota a gota até a raiz da planta." },
  alevinos: { nome: "Alevinos de tilápia", cat: "insumo", compra: 60, info: "Peixes jovens para o tanque do Sisteminha." },
};

export function nomeItem(id) {
  if (CULTURAS[id]) return CULTURAS[id].nome;
  if (id.startsWith("sem_")) return `Sementes de ${CULTURAS[id.slice(4)].nome.toLowerCase()}`;
  return ITENS[id]?.nome || id;
}
export function precoVenda(id) {
  if (CULTURAS[id]) return CULTURAS[id].venda;
  return ITENS[id]?.venda || 0;
}

// ---------------------------------------------------------------- Construções
export const CONSTRUCOES = {
  composteira: { nome: "Composteira", w: 2, h: 2, custo: 30, galhos: 6, nivel: 2, desc: "Transforma restos de plantas em composto orgânico.", missao: "composteira" },
  galinheiro: { nome: "Galinheiro", w: 3, h: 3, custo: 160, galhos: 4, nivel: 3, desc: "Três galinhas que dão ovos e esterco. Precisam de comida e água todo dia." },
  cisterna2: { nome: "Cisterna extra", w: 2, h: 2, custo: 220, nivel: 4, desc: "Mais 300 L para guardar água da chuva.", unica: true },
  oficina: { nome: "Oficina", w: 2, h: 2, custo: 140, galhos: 4, nivel: 5, desc: "Melhora o regador para carregar mais água.", unica: true },
  cercado: { nome: "Cercado de cabras", w: 4, h: 3, custo: 320, galhos: 8, nivel: 6, desc: "Duas cabras que dão leite. Comem palma forrageira ou milho." },
  tanque: { nome: "Tanque de peixes", w: 2, h: 2, custo: 200, nivel: 6, desc: "Módulo básico do Sisteminha: criação de tilápias.", unica: true },
  minhocario: { nome: "Minhocário", w: 1, h: 1, custo: 60, nivel: 6, desc: "Minhocas transformam composto e esterco em húmus.", unica: true },
  flores: { nome: "Canteiro de flores", w: 1, h: 1, custo: 12, nivel: 1, desc: "Enfeita a fazenda e atrai polinizadores." },
  banco: { nome: "Banco de madeira", w: 1, h: 1, custo: 20, galhos: 2, nivel: 2, desc: "Um lugar para descansar à sombra." },
};

export const CORES_CASA = ["#efe2c4", "#f2c9a0", "#cfe0e8", "#f0d0c8", "#e2ecd0", "#f6e27a"];

// ---------------------------------------------------------------- Níveis
export const XP_NIVEL = [0, 40, 110, 220, 380, 600, 880, 1250, 1700, 2300, 3000];
export function nivelDe(xp) {
  let n = 1;
  for (let i = 0; i < XP_NIVEL.length; i++) if (xp >= XP_NIVEL[i]) n = i + 1;
  return Math.min(n, XP_NIVEL.length);
}

// Lotes de terra: o jogador começa com o primeiro e compra os outros.
export const LOTES = [
  { id: 0, nome: "Roça inicial", x0: 6, y0: 11, x1: 16, y1: 19, preco: 0, nivel: 1 },
  { id: 1, nome: "Terreno leste", x0: 17, y0: 11, x1: 29, y1: 19, preco: 200, nivel: 2 },
  { id: 2, nome: "Baixada", x0: 3, y0: 20, x1: 15, y1: 30, preco: 420, nivel: 4 },
  { id: 3, nome: "Terreno do umbuzeiro", x0: 3, y0: 33, x1: 29, y1: 41, preco: 800, nivel: 6 },
];

// Locais possíveis para a mandala (o jogador escolhe um).
export const LOCAIS_MANDALA = {
  A: { cx: 23, cy: 25.5, nome: "Perto da cisterna", pros: "Terreno plano e perto da água: menos cano e menos perda.", contras: "Ocupa uma área que poderia virar roça comum.", perda: 0 },
  B: { cx: 23, cy: 36.5, nome: "Lá embaixo, no declive", pros: "Usa um terreno sem outro uso.", contras: "Longe da cisterna e em declive: o cano é mais caro e se perde mais água.", perda: 0.2 },
};
export const RAIO_MANDALA = 5.4;

// ---------------------------------------------------------------- Lixo da cozinha (para a composteira)
export const BALDE_COZINHA = [
  { id: "cascas", nome: "Cascas de legumes", ok: true, vira: "restos", por: "Restos vegetais crus são ótimos para a compostagem." },
  { id: "cafe", nome: "Borra de café", ok: true, vira: "restos", por: "A borra de café pode ir para a composteira." },
  { id: "papelao", nome: "Papelão picado", ok: true, vira: "folhas", por: "Papel e papelão sem tinta forte entram como material seco." },
  { id: "frutas", nome: "Cascas de frutas", ok: true, vira: "frutas", por: "Cascas de frutas são material verde." },
  { id: "carne", nome: "Restos de carne", ok: false, por: "Carne atrai bichos e causa mau cheiro numa composteira simples." },
  { id: "oleo", nome: "Óleo de cozinha", ok: false, por: "Óleo atrapalha a decomposição e não deve ir para a composteira." },
  { id: "laticinio", nome: "Queijo e leite", ok: false, por: "Laticínios causam mau cheiro e atraem animais." },
  { id: "plastico", nome: "Saco plástico", ok: false, por: "Plástico não se decompõe: vai para a reciclagem." },
  { id: "fezes", nome: "Fezes de cachorro ou gato", ok: false, por: "Fezes de animais de estimação podem ter doenças; não vão para composto de horta." },
];

// ---------------------------------------------------------------- Guia educativo e fontes
export const FONTES = {
  sisteminhaFaq: { titulo: "Sisteminha: perguntas frequentes — Embrapa Meio-Norte", url: "https://www.embrapa.br/web/meio-norte/sisteminha/faq" },
  sisteminhaDoc: { titulo: "Sisteminha Embrapa — publicação técnica (PDF, Embrapa)", url: "https://ainfo.cnptia.embrapa.br/digital/bitstream/doc/1169473/1/39.pdf" },
  compostagem: { titulo: "Compostagem — cartilha da Embrapa (PDF)", url: "https://www.infoteca.cnptia.embrapa.br/bitstream/doc/491638/1/Compostagem.pdf" },
  compostagem2: { titulo: "Compostagem — comunicado técnico da Embrapa (PDF)", url: "https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/409669/1/com.tec.105.pdf" },
  aguaSemiarido: { titulo: "Tecnologias para o aumento da oferta de água no Semiárido — Embrapa (PDF)", url: "https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/874893/1/TECNOLOGIASPARAOAUMENTO.pdf" },
  irrigacao: { titulo: "Irrigação para pequena agricultura possibilita produção no Semiárido — Embrapa", url: "https://www.embrapa.br/busca-de-noticias/-/noticia/4579019/irrigacao-para-pequena-agricultura-possibilita-producao-no-semiarido" },
  barragem: { titulo: "Barragem subterrânea — Embrapa", url: "https://www.embrapa.br/busca-de-solucoes-tecnologicas/-/produto-servico/2129/barragem-subterranea" },
  tecSociais: { titulo: "Tecnologias sociais hídricas para a convivência com o Semiárido — Embrapa (PDF)", url: "https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1130101/1/Tecnologias-sociais-hidricas-para-a-convivencia-com-o-semiarido-2020.pdf" },
  mandala: { titulo: "Sistema de produção em mandala — artigo na revista Principia (IFPB)", url: "https://periodicos.ifpb.edu.br/index.php/principia/article/download/3853/1499" },
  galinhas: { titulo: "Alimentação de galinhas caipiras — Embrapa", url: "https://www.embrapa.br/busca-de-publicacoes/-/publicacao/1079630/alimentacao-de-galinhas-caipiras" },
};

// Cada tópico: o que é, como funciona no jogo e na vida real, e as fontes.
export const GUIA = [
  {
    id: "plantio", titulo: "Plantar, regar e colher",
    texto: [
      "Prepare a terra com a enxada, plante a semente e mantenha o solo úmido. Cada cultura tem seu tempo, sua necessidade de água e sua produção.",
      "Rotação de culturas: plantar sempre a mesma coisa no mesmo lugar cansa o solo. Alternar, por exemplo, milho e feijão ajuda: o feijão é uma leguminosa e ajuda a repor nitrogênio no solo.",
    ],
    jogo: "No jogo, plantar a mesma cultura seguida no mesmo canteiro deixa o crescimento mais lento, e colher feijão aumenta um pouco a fertilidade.",
    fontes: [],
  },
  {
    id: "composteira", titulo: "Composteira",
    texto: [
      "Compostagem é a transformação de restos orgânicos em adubo pela ação de microrganismos. A mistura precisa de materiais secos (ricos em carbono, como folhas e palha) e verdes (ricos em nitrogênio, como restos de hortaliças e esterco).",
      "Publicações da Embrapa indicam uma relação carbono/nitrogênio inicial perto de 30 para 1 e umidade em torno de 55% a 60%: úmido, mas não encharcado. Revirar a pilha leva oxigênio aos microrganismos.",
      "O composto precisa de tempo para maturar: na vida real, de semanas a alguns meses, conforme os materiais e o manejo. Carne, óleo, laticínios, plástico e fezes de animais de estimação não vão para a composteira.",
    ],
    jogo: "No jogo a maturação leva alguns dias de jogo (minutos reais). A barra de mistura mostra se falta material seco ou verde.",
    fontes: ["compostagem", "compostagem2"],
  },
  {
    id: "mandala", titulo: "Mandala agrícola",
    texto: [
      "A mandala é um jeito de organizar a produção em canteiros circulares em volta de um reservatório central de água. A irrigação acompanha a curva dos canteiros, o que ajuda a distribuir a água com pouco desperdício.",
      "Costuma-se colocar perto do centro as plantas que pedem mais água e cuidado (hortaliças) e, nos círculos de fora, culturas maiores e mais resistentes.",
      "Mandala não é o mesmo que aquaponia. Na aquaponia, peixes e plantas dividem a mesma água em circulação. Algumas mandalas criam peixes ou aves no reservatório, mas isso exige manejo próprio.",
      "Experiências no Semiárido mostram que a mandala precisa de organização e manutenção contínuas para continuar produzindo.",
    ],
    jogo: "No jogo você escolhe o local, limpa o terreno, define anéis e caminhos, monta o reservatório, planeja a irrigação e aduba com composto.",
    fontes: ["mandala", "tecSociais"],
  },
  {
    id: "sisteminha", titulo: "Sisteminha Embrapa",
    texto: [
      "O Sisteminha é uma tecnologia da Embrapa (em parceria com a UFU e a Fapemig) para produzir alimentos de forma integrada em pequenas áreas, com reaproveitamento de nutrientes entre os módulos.",
      "A criação de peixes em tanque é o módulo básico. A partir dele, a família escolhe outros módulos, como horta, galinhas, compostagem e minhocas. A água do tanque, rica em nutrientes, é usada para irrigar as plantas; resíduos dos animais e partes não comestíveis das plantas vão para a compostagem.",
      "Segundo a Embrapa, o sistema pode ocupar cerca de 100 m². Para o Nordeste, a principal recomendação de peixe é a tilápia, despescada ao fim de cada ciclo de cerca de 90 dias, com limpeza do tanque antes do próximo.",
      "A Embrapa faz pesquisa; assistência técnica e financiamento vêm de outros órgãos e parceiros.",
    ],
    jogo: "No jogo o ciclo dos peixes dura poucos dias de jogo e os números são simplificados. Para montar um Sisteminha de verdade, consulte os materiais oficiais e a assistência técnica da sua região.",
    fontes: ["sisteminhaFaq", "sisteminhaDoc"],
  },
  {
    id: "seca", titulo: "Convivência com a seca",
    texto: [
      "No Semiárido, guardar a água da chuva é essencial: cisternas, barragens subterrâneas e outros reservatórios garantem água nos meses secos.",
      "A irrigação por gotejamento leva água direto à raiz e está entre os métodos que mais economizam água. Mesmo assim, depende de ter água guardada.",
      "Cobrir o solo com palha (cobertura morta) protege a terra do sol e ajuda a manter a umidade, mas não substitui a irrigação. Escolher culturas adaptadas, como feijão-de-corda, mandioca e palma forrageira, e plantar na época certa reduzem os riscos.",
      "Nenhuma técnica faz milagre: a barragem subterrânea, por exemplo, costuma acumular pouca água e pode ter problemas de salinização.",
    ],
    jogo: "No jogo a estiagem aumenta a perda de água do solo e não chove. Cobertura reduz a perda, o gotejamento gasta menos água da cisterna e as culturas adaptadas aguentam mais tempo sem água.",
    fontes: ["aguaSemiarido", "irrigacao", "barragem", "tecSociais"],
  },
  {
    id: "animais", titulo: "Galinhas e cabras",
    texto: [
      "Animais precisam de comida, água limpa, abrigo e espaço todos os dias. Galinhas caipiras podem comer milho, ração e restos de horta; cabras aproveitam forragens como a palma.",
      "O esterco dos animais é rico em nitrogênio e deve passar pela compostagem antes de ir para a horta.",
    ],
    jogo: "No jogo, animais bem tratados produzem todos os dias. Se faltar comida ou água, eles param de produzir, mas não morrem.",
    fontes: ["galinhas"],
  },
];
