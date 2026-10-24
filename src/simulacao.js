// Simulação da fazenda: tempo, estações, chuva, solo, plantas, composteira, animais e peixes.
// Roda só enquanto o jogo está aberto: ficar sem jogar não estraga nada.
import { CULTURAS, ITENS, HORAS_DIA, DIAS_CHUVA, DIAS_SECA, LOCAIS_MANDALA } from "./dados.js";
import { hash } from "./pixel.js";
import { dia, horaDoDia } from "./estado.js";

export const CICLO_PEIXE = 96; // horas de jogo (na vida real: cerca de 90 dias)
export const MATURACAO = 55; // horas de jogo da composteira em condições ideais

export function estacao(e, d = dia(e)) {
  return (d - 1) % (DIAS_CHUVA + DIAS_SECA) < DIAS_CHUVA ? "chuva" : "seca";
}
export function diasAteEstiagem(e) {
  const d = dia(e);
  const pos = (d - 1) % (DIAS_CHUVA + DIAS_SECA);
  return pos < DIAS_CHUVA ? DIAS_CHUVA - pos : 0;
}
export function diasAteChuvas(e) {
  const d = dia(e);
  const pos = (d - 1) % (DIAS_CHUVA + DIAS_SECA);
  return pos >= DIAS_CHUVA ? DIAS_CHUVA + DIAS_SECA - pos : 0;
}

// Chuva do dia: na estação chuvosa, a maioria dos dias tem uma pancada de chuva.
export function chuvaDoDia(e, d = dia(e)) {
  if (estacao(e, d) !== "chuva" || d === 1) return null;
  if (hash(d, 3, 99) > 0.7) return null;
  const ini = 9 + Math.floor(hash(d, 1, 99) * 9);
  const dur = 2 + Math.floor(hash(d, 2, 99) * 5);
  return { ini, fim: ini + dur };
}
export function chovendo(e) {
  const c = chuvaDoDia(e);
  const h = horaDoDia(e);
  return !!c && h >= c.ini && h < c.fim;
}

export function prontaParaColher(t) {
  if (!t.c || t.morta) return false;
  return t.h >= CULTURAS[t.c].cresce;
}
export function progresso(t) {
  if (!t.c) return 0;
  return Math.min(1, t.h / CULTURAS[t.c].cresce);
}
export function estagio(t) {
  const p = progresso(t);
  return p >= 1 ? 3 : p >= 0.55 ? 2 : p >= 0.15 ? 1 : 0;
}

// ------------------------------------------------------------ Composteira
export function cnPilha(p) {
  let massa = 0, n = 0;
  for (const [id, q] of Object.entries(p.mat)) {
    const cn = ITENS[id]?.cn;
    if (!cn) continue;
    massa += q;
    n += q / cn;
  }
  return n > 0 ? massa / n : 0;
}
export function massaPilha(p) {
  return Object.values(p.mat).reduce((a, b) => a + b, 0);
}
// Fatores de 0 a 1 que mostram o que está ajudando ou atrapalhando a decomposição.
export function fatoresPilha(p) {
  const cn = cnPilha(p);
  const fCN = cn ? Math.max(0.15, Math.min(1, 1 - Math.abs(Math.log(cn / 30)) * 1.1)) : 0;
  const u = p.u;
  const fU = u < 25 ? 0.2 : u < 40 ? 0.2 + ((u - 25) / 15) * 0.8 : u <= 65 ? 1 : u <= 80 ? 1 - ((u - 65) / 15) * 0.7 : 0.3;
  const fA = p.aer >= 40 ? 1 : 0.3 + (p.aer / 40) * 0.7;
  return { cn, fCN, fU, fA, taxa: fCN * fU * fA };
}
export function problemasPilha(p) {
  const l = [];
  const massa = massaPilha(p);
  if (massa < 6) l.push({ id: "pouco", txt: "Pilha pequena demais: junte pelo menos 6 porções de material.", dica: "Adicione mais restos e material seco." });
  const cn = cnPilha(p);
  if (massa >= 2 && cn > 42) l.push({ id: "seco", txt: "Muito material seco e pouco verde: a decomposição fica lenta.", dica: "Adicione restos de hortaliças, cascas de frutas ou esterco." });
  if (massa >= 2 && cn && cn < 20) l.push({ id: "verde", txt: "Verde demais: pode dar mau cheiro e escorrer chorume.", dica: "Adicione folhas secas ou palha e revire." });
  if (p.u < 35) l.push({ id: "umidade", txt: "A pilha está seca: os microrganismos quase param.", dica: "Regue um pouco. O ponto é de esponja torcida." });
  if (p.u > 70) l.push({ id: "encharcada", txt: "Encharcada: falta ar e começa o mau cheiro.", dica: "Revire e adicione material seco." });
  if (p.aer < 30 && massa > 0) l.push({ id: "ar", txt: "Pouco ar dentro da pilha.", dica: "Revire a pilha para entrar oxigênio." });
  return l;
}

function simularPilha(e, c, dh, chuva, sombra) {
  const p = c.pilha;
  if (!p || p.pronto) return null;
  const massa = massaPilha(p);
  if (massa === 0) return null;
  const sec = estacao(e) === "seca" ? 1.4 : 1;
  p.u = Math.max(0, p.u - dh * 0.55 * sec * (sombra ? 0.6 : 1) + (chuva ? dh * 5 : 0));
  p.u = Math.min(100, p.u);
  p.aer = Math.max(0, p.aer - dh * 1.1);
  if (massa < 6) { p.temp += (30 - p.temp) * Math.min(1, dh * 0.2); return null; }
  const f = fatoresPilha(p);
  p.prog = Math.min(100, p.prog + (f.taxa * 100 * dh) / MATURACAO);
  // fase quente no começo, depois esfria na maturação
  const alvo = p.prog < 65 ? 30 + 38 * f.taxa : 30 + 8 * f.taxa;
  p.temp += (alvo - p.temp) * Math.min(1, dh * 0.3);
  if (f.taxa > 0.75) p.horasBoas = (p.horasBoas || 0) + dh;
  if (p.prog >= 100) {
    p.pronto = true;
    p.saida = Math.max(3, Math.round(massa * 0.55));
    return "compostoPronto";
  }
  return null;
}

// ------------------------------------------------------------ Passo principal
export function avancar(e, horas, ctx) {
  const eventos = [];
  let resto = horas;
  while (resto > 0) {
    const dh = Math.min(0.25, resto);
    resto -= dh;
    const diaAntes = dia(e);
    const estAntes = estacao(e);
    const chuvaAntes = chovendo(e);
    e.horas += dh;
    const novoDia = dia(e) !== diaAntes;
    if (novoDia) eventos.push("novoDia");
    if (estacao(e) !== estAntes) eventos.push(estacao(e) === "seca" ? "comecouSeca" : "comecouChuva");
    const chove = chovendo(e);
    if (chove && !chuvaAntes) eventos.push("comecouChuva_dia");
    passoSolo(e, dh, chove, eventos);
    passoConstrucoes(e, dh, chove, eventos, ctx);
    if (chove) {
      const capta = (e.calha ? 9 : 4) * dh;
      const antes = e.cisterna.agua;
      e.cisterna.agua = Math.min(e.cisterna.cap, e.cisterna.agua + capta);
      e.stats.aguaChuva += e.cisterna.agua - antes;
      if (e.mandala.etapa >= 4) e.mandala.agua = Math.min(e.mandala.cap, e.mandala.agua + 2 * dh);
    }
  }
  return eventos;
}

function passoSolo(e, dh, chove, eventos) {
  const seca = estacao(e) === "seca";
  const h = horaDoDia(e);
  const noite = h < 6 || h >= 19;
  const fator = chove ? 0 : (seca ? 1.5 : 0.85) * (noite ? 0.5 : 1);
  const perdaMandala = LOCAIS_MANDALA[e.mandala.local]?.perda || 0;
  for (const t of Object.values(e.tiles)) {
    if (t.t === "mato" && !t.c) continue;
    const cult = t.c && !t.morta ? CULTURAS[t.c] : null;
    let perda = (cult ? cult.agua : 0.8) * fator * dh;
    if (t.pal) perda *= 0.65;
    t.u = Math.max(0, Math.min(100, t.u - perda + (chove ? 30 * dh : 0)));
    // irrigação automática
    const auto = t.got || (t.mandala && (e.mandala.irrig === "gotejo" || e.mandala.irrig === "aspersao")) && e.mandala.etapa >= 5;
    if (auto && cult && t.u < 35) {
      const aspersao = t.mandala && e.mandala.irrig === "aspersao" && !t.got;
      let custo = aspersao ? 7 : 4;
      if (t.mandala) custo *= 1 + perdaMandala;
      const fonte = t.mandala ? e.mandala : e.cisterna;
      if (fonte.agua >= custo) {
        fonte.agua -= custo;
        e.stats.aguaUsada += custo;
        t.u = 72;
        if (t.mandala) e.mandala.aguaUsada = (e.mandala.aguaUsada || 0) + custo;
      }
    }
    if (t.pal && t.f < 70) t.f += 0.04 * dh;
    if (!cult) continue;
    if (t.u > 0) {
      t.sec = Math.max(0, t.sec - dh * 2);
      if (t.murcha && t.sec < cult.tolera * 0.5) t.murcha = false;
    } else {
      t.sec += dh;
      if (!t.murcha && t.sec > cult.tolera) { t.murcha = true; eventos.push("murchou"); }
      if (t.sec > cult.tolera * 2.2) { t.morta = true; t.murcha = false; e.stats.plantasSecas++; eventos.push("secou"); }
    }
    if (!t.murcha && t.u > 0 && t.h < cult.cresce) {
      let mult = 0.6 + (t.f / 100) * 0.8;
      if (t.rot) mult *= 0.8;
      t.h = Math.min(cult.cresce, t.h + dh * mult);
      if (t.h >= cult.cresce) eventos.push("pronta");
    }
  }
}

function passoConstrucoes(e, dh, chove, eventos, ctx) {
  for (const c of e.construcoes) {
    if (c.tipo === "composteira") {
      const ev = simularPilha(e, c, dh, chove, ctx?.temSombra?.(c));
      if (ev) eventos.push(ev);
    } else if (c.tipo === "galinheiro" || c.tipo === "cercado") {
      const n = c.animais || (c.tipo === "galinheiro" ? 3 : 2);
      const ok = c.comida > 0 && c.agua > 0;
      c.comida = Math.max(0, (c.comida || 0) - dh);
      c.agua = Math.max(0, (c.agua || 0) - dh);
      if (ok) {
        c.prod = (c.prod || 0) + dh / 24;
        if (c.prod >= 1) {
          c.prod -= 1;
          c.estoque = Math.min(n * 3, (c.estoque || 0) + n);
          eventos.push(c.tipo === "galinheiro" ? "ovos" : "leite");
        }
        c.esterco = Math.min(12, (c.esterco || 0) + (dh / 24) * (c.tipo === "galinheiro" ? 1 : 2));
      }
    } else if (c.tipo === "tanque" && c.peixes) {
      const alimentado = c.comida > 0;
      c.comida = Math.max(0, (c.comida || 0) - dh);
      c.qualidade = Math.max(0, (c.qualidade ?? 100) - dh * (alimentado ? 1.1 : 0.4));
      if (c.ciclo < CICLO_PEIXE) {
        const ritmo = (alimentado ? 1 : 0.15) * (c.qualidade > 40 ? 1 : 0.35);
        c.ciclo = Math.min(CICLO_PEIXE, c.ciclo + dh * ritmo);
        if (c.ciclo >= CICLO_PEIXE) eventos.push("peixesProntos");
      }
      c.lodo = Math.min(10, (c.lodo || 0) + dh / 24);
    } else if (c.tipo === "minhocario" && c.carga > 0) {
      c.horas = (c.horas || 0) + dh;
      if (c.horas >= 24) {
        c.horas -= 24;
        const n = Math.min(c.carga, 3);
        c.carga -= n;
        c.humus = (c.humus || 0) + n;
        eventos.push("humus");
      }
    }
  }
}
