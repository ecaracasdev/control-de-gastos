import type { Bank, ParsedTransactionDraft } from "../../types";
import { categorize, detectInstallment } from "../categorize";
import { normalizeCellDate, readXlsxRows, type XlsxRow } from "./parseXlsx";

const NON_AMOUNT_HEADERS = [
  /^fecha$/i,
  /^sucursal/i,
  /^descripci/i,
  /^referencia$/i,
  /^saldo/i,
  /^cuenta$/i,
  /^moneda$/i,
];

function isHeaderRow(row: XlsxRow): boolean {
  const values = Object.values(row.cells).map((v) => v.trim().toLowerCase());
  return values.includes("fecha") && values.some((v) => v.startsWith("descripci"));
}

function signedAmount(header: string, raw: string): number | null {
  const value = Number(raw);
  if (Number.isNaN(value)) return null;
  if (/^d[eé]bito$/i.test(header.trim())) return -Math.abs(value);
  if (/^cr[eé]dito$/i.test(header.trim())) return Math.abs(value);
  return value;
}

export interface ExcelParseResult {
  drafts: ParsedTransactionDraft[];
  rowCount: number;
  /** Saldo que el banco reporta en la fila más reciente del archivo (si trae columna "Saldo") */
  latestBalance?: { date: string; amount: number };
}

/**
 * Lee un Excel exportado desde el homebanking (probado con el export de
 * "Movimientos" de Santander: columnas Fecha / Descripción ("tipo" + tab +
 * "detalle") / una o más columnas de importe por cuenta / Saldo). Detecta
 * la fila de encabezado buscando "Fecha" + "Descripción" para no depender
 * de que sea siempre la fila 14, y trata como columna de importe cualquier
 * columna que no sea un encabezado conocido (fecha, sucursal, referencia,
 * saldo, cuenta, moneda) — así debería tolerar variaciones de otros bancos
 * sin necesitar un parser aparte, mientras el archivo tenga esa forma de tabla.
 */
export async function parseStatementXlsx(file: File, bank: Bank): Promise<ExcelParseResult> {
  const rows = await readXlsxRows(file);
  const headerIndex = rows.findIndex(isHeaderRow);
  if (headerIndex === -1) {
    return { drafts: [], rowCount: rows.length };
  }

  const header = rows[headerIndex];
  let dateCol: string | null = null;
  let descCol: string | null = null;
  let refCol: string | null = null;
  let saldoCol: string | null = null;
  const amountCols: { col: string; header: string }[] = [];

  for (const [col, label] of Object.entries(header.cells)) {
    const clean = label.trim();
    if (/^fecha$/i.test(clean)) dateCol = col;
    else if (/^descripci/i.test(clean)) descCol = col;
    else if (/^referencia$/i.test(clean)) refCol = col;
    else if (/^saldo/i.test(clean)) saldoCol = col;
    else if (!NON_AMOUNT_HEADERS.some((re) => re.test(clean))) amountCols.push({ col, header: clean });
  }

  if (!dateCol || !descCol || amountCols.length === 0) {
    return { drafts: [], rowCount: rows.length };
  }

  const drafts: ParsedTransactionDraft[] = [];

  for (const row of rows.slice(headerIndex + 1)) {
    const dateRaw = row.cells[dateCol];
    if (!dateRaw) continue;
    const iso = normalizeCellDate(dateRaw);
    if (!iso) continue;

    const descRaw = row.cells[descCol] ?? "";
    const description = descRaw
      .split("\t")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!description) continue;

    let amount = 0;
    let hasAmount = false;
    for (const { col, header: h } of amountCols) {
      const raw = row.cells[col];
      if (!raw) continue;
      const signed = signedAmount(h, raw);
      if (signed === null) continue;
      amount += signed;
      hasAmount = true;
    }
    if (!hasAmount) continue;

    const category = categorize(description);
    const saldoRaw = saldoCol ? row.cells[saldoCol] : undefined;
    const balanceAfter = saldoRaw !== undefined ? Number(saldoRaw) : undefined;

    drafts.push({
      date: iso,
      description,
      amount,
      currency: "ARS",
      category,
      bank,
      installment: detectInstallment(description),
      sourceFile: file.name,
      reference: refCol ? row.cells[refCol] : undefined,
      balanceAfter: balanceAfter !== undefined && !Number.isNaN(balanceAfter) ? balanceAfter : undefined,
      confidence: "alta",
    });
  }

  let latestBalance: ExcelParseResult["latestBalance"];
  for (const d of drafts) {
    if (d.balanceAfter === undefined) continue;
    if (!latestBalance || d.date > latestBalance.date) {
      latestBalance = { date: d.date, amount: d.balanceAfter };
    }
  }

  return { drafts, rowCount: rows.length, latestBalance };
}
