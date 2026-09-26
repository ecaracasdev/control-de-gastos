import type { Bank, ParsedTransactionDraft } from "../../types";
import { extractPdfLines } from "./extractText";
import { parseGeneric } from "./parseGeneric";
import { parseMercadoPago } from "./parseMercadoPago";

export interface ParseResult {
  drafts: ParsedTransactionDraft[];
  lineCount: number;
}

/**
 * Santander y Banco Nación comparten, por ahora, el parser genérico
 * heurístico. Cuando tengamos un PDF de referencia de cada banco conviene
 * escribir un parser dedicado (parseSantander.ts / parseNacion.ts) que
 * reemplace esta rama sin tocar el resto de la app. Mercado Pago tiene su
 * propio parser porque la tabla del PDF viene con una forma muy distinta
 * (columnas bien separadas, con la descripción a veces partida en dos líneas).
 */
export async function parseStatementPdf(file: File, bank: Bank): Promise<ParseResult> {
  const lines = await extractPdfLines(file);
  const drafts = bank === "mercadopago" ? parseMercadoPago(lines, file.name) : parseGeneric(lines, bank, file.name);
  return { drafts, lineCount: lines.length };
}
