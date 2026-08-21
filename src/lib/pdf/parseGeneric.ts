import type { Bank, ParsedTransactionDraft } from "../../types";
import { categorize, detectInstallment, isMercadoPagoTransfer } from "../categorize";
import type { PdfLine } from "./extractText";
import { extractLeadingDate, findAmounts, parseArgentineAmount, stripAmounts } from "./parseUtils";

const NOISE_PATTERNS = [
  /^p[aá]gina\s+\d+/i,
  /^fecha\s+(descripci[oó]n|detalle|concepto)/i,
  /^(descripci[oó]n|concepto)\s+(d[eé]bito|cr[eé]dito|importe)/i,
  /^saldo\s+(anterior|actual|al)/i,
  /^resumen de (cuenta|tarjeta)/i,
  /^total(es)?\b/i,
];

const INCOME_KEYWORDS =
  /acreditaci[oó]n|dep[oó]sito|haberes|sueldo|transferencia recibida|abono|acredit\b/i;

function isNoise(text: string): boolean {
  return NOISE_PATTERNS.some((re) => re.test(text.trim()));
}

/**
 * Parser genérico basado en heurísticas: busca una fecha al inicio de línea,
 * junta líneas de continuación (descripciones que ocupan más de una línea)
 * y toma el primer importe con formato argentino como monto del movimiento.
 * Pensado para revisarse y corregirse en la pantalla de importación, no da
 * por sentado que el resultado sea 100% exacto.
 */
export function parseGeneric(
  lines: PdfLine[],
  bank: Bank,
  sourceFile: string,
): ParsedTransactionDraft[] {
  const now = new Date();
  const drafts: ParsedTransactionDraft[] = [];

  type Record = { iso: string; textParts: string[]; amountsSeen: number };
  let current: Record | null = null;

  const flush = () => {
    if (!current) return;
    const rest = current.textParts.join(" ").replace(/\s+/g, " ").trim();
    const amounts = findAmounts(rest);
    const description = stripAmounts(rest);

    if (amounts.length > 0 && description.length >= 3) {
      const rawAmount = amounts[0];
      let amount = parseArgentineAmount(rawAmount);
      const hasExplicitSign = /-/.test(rawAmount);
      if (!hasExplicitSign) {
        amount = INCOME_KEYWORDS.test(description) ? Math.abs(amount) : -Math.abs(amount);
      }

      const currency: "ARS" | "USD" = /u\$s|us\$|usd/i.test(description) ? "USD" : "ARS";
      const installment = detectInstallment(description);
      const category = categorize(description);
      const mpTransfer = category === "transferencias" && amount < 0 && isMercadoPagoTransfer(description);

      drafts.push({
        date: current.iso,
        description,
        amount,
        currency,
        category,
        bank,
        installment,
        isMercadoPagoTransfer: mpTransfer,
        sourceFile,
        confidence: amounts.length === 1 ? "alta" : "media",
      });
    }
    current = null;
  };

  for (const line of lines) {
    const text = line.text.trim();
    if (!text || isNoise(text)) continue;

    const dated = extractLeadingDate(text, now.getFullYear());
    if (dated) {
      flush();
      current = { iso: dated.iso, textParts: [dated.rest], amountsSeen: 0 };
    } else if (current) {
      current.textParts.push(text);
    }
  }
  flush();

  return drafts;
}
