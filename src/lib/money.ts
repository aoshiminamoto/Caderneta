// Tudo em centavos (inteiro) — sem erro de ponto flutuante.
export function toCentavos(valor: string | number): number {
  if (typeof valor === "number") return Math.round(valor * 100);
  const s = valor.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (!isFinite(n) || n < 0) throw new Error("Valor inválido");
  return Math.round(n * 100);
}

export function parseBRL(input: string): number {
  const cleaned = input.replace(/[^\d,\.]/g, "");
  if (!cleaned) throw new Error("Informe um valor");
  // aceita "12,50" "1.200,00" "12.50" "12"
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }
  const n = Number(normalized);
  if (!isFinite(n) || n <= 0) throw new Error("Valor deve ser maior que zero");
  const c = Math.round(n * 100);
  if (c <= 0) throw new Error("Valor deve ser maior que zero");
  return c;
}

export function formatBRL(centavos: number): string {
  const neg = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  const reais = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${neg}R$ ${reais.toLocaleString("pt-BR")},${String(cents).padStart(2, "0")}`;
}

export function formatBRLCompact(centavos: number): string {
  return formatBRL(centavos);
}
