// Armazenamento local. Tudo protegido com try/catch: em janela anônima ou com
// armazenamento bloqueado o jogo continua funcionando, só não lembra entre visitas.
const PREFIXO = "verdejar.";

export function ler(chave, padrao = null) {
  try {
    const v = localStorage.getItem(PREFIXO + chave);
    return v === null ? padrao : JSON.parse(v);
  } catch {
    return padrao;
  }
}

export function gravar(chave, valor) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function apagar(chave) {
  try {
    localStorage.removeItem(PREFIXO + chave);
  } catch {
    /* sem armazenamento */
  }
}
