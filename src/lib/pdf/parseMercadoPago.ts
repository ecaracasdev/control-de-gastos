import type { ParsedTransactionDraft } from "../../types";
import { categorize } from "../categorize";
import type { PdfLine } from "./extractText";
import { parseArgentineAmount } from "./parseUtils";

const START_MARKER = /detalle de movimientos/i;
const STOP_MARKER = /resumen de tenencias en d[oó]lares/i;

const NOISE_PATTERNS = [
  /^id de la$/i,
  /^operaci[oó]n$/i,
  /^fecha\s+descripci[oó]n\s+valor\s+saldo$/i,
  /^\d{1,2}\/\d{1,2}$/,
  /^fecha de generaci[oó]n:/i,
  /^mercado libre s\.r\.l\./i,
  /^de consulta en:/i,
];

// Una fila de movimiento: fecha, opcionalmente la descripción (cuando entra
// en una sola línea), el ID de operación (varios dígitos) y dos importes
// ($ valor y $ saldo). Cuando la descripción es muy larga para una línea, el
// PDF la parte en dos: una línea justo antes de la fila y otra justo
// después, con la fila (fecha + ID + importes) sin texto de descripción.
const ROW_RE =
  /^(\d{2})-(\d{2})-(\d{4})\s+(.*?)(\d{9,})\s+(\$\s*-?[\d.,]+)\s+(\$\s*-?[\d.,]+)\s*$/;

function isNoise(text: string): boolean {
  return NOISE_PATTERNS.some((re) => re.test(text));
}

/**
 * Parsea el "Resumen de cuenta en pesos" de Mercado Pago (PDF). Ignora por
 * completo el "Resumen de tenencias en dólares" que suele venir a
 * continuación en el mismo archivo (son rendimientos de una inversión, no
 * gasto/ingreso del día a día).
 */
export function parseMercadoPago(lines: PdfLine[], sourceFile: string): ParsedTransactionDraft[] {
  const texts = lines.map((l) => l.text.trim());
  const drafts: ParsedTransactionDraft[] = [];

  let started = false;
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text) continue;

    if (!started) {
      if (START_MARKER.test(text)) started = true;
      continue;
    }
    if (STOP_MARKER.test(text)) break;
    if (isNoise(text)) continue;

    const match = text.match(ROW_RE);
    if (!match) continue;

    const [, dd, mm, yyyy, inlineDesc, reference, valorRaw, saldoRaw] = match;

    let description = inlineDesc.trim();
    if (!description) {
      const before = i > 0 ? texts[i - 1] : "";
      const after = i < texts.length - 1 ? texts[i + 1] : "";
      const beforeOk = Boolean(before) && !ROW_RE.test(before) && !isNoise(before) && !START_MARKER.test(before);
      const afterOk = Boolean(after) && !ROW_RE.test(after) && !isNoise(after) && !STOP_MARKER.test(after);
      description = [beforeOk ? before : "", afterOk ? after : ""].filter(Boolean).join(" ").trim();
    }
    if (!description) continue;

    const amount = parseArgentineAmount(valorRaw);
    const balanceAfter = parseArgentineAmount(saldoRaw);
    const { category, subcategory, confidence } = categorize(description, "mercadopago");

    drafts.push({
      date: `${yyyy}-${mm}-${dd}`,
      description,
      amount,
      currency: "ARS",
      category,
      subcategory,
      bank: "mercadopago",
      sourceFile,
      reference,
      balanceAfter,
      confidence,
    });
  }

  return drafts;
}
