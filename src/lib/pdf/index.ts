import type { Bank, ParsedTransactionDraft } from "../../types";
import { extractPdfLines } from "./extractText";
import { parseGeneric } from "./parseGeneric";

export interface ParseResult {
  drafts: ParsedTransactionDraft[];
  lineCount: number;
}

/**
 * Santander y Banco Nación comparten, por ahora, el parser genérico
 * heurístico. Cuando tengamos un PDF de referencia de cada banco conviene
 * escribir un parser dedicado (parseSantander.ts / parseNacion.ts) que
 * reemplace esta rama sin tocar el resto de la app.
 */
export async function parseStatementPdf(file: File, bank: Bank): Promise<ParseResult> {
  const lines = await extractPdfLines(file);
  const drafts = parseGeneric(lines, bank, file.name);
  return { drafts, lineCount: lines.length };
}
