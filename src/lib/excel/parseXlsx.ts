import JSZip from "jszip";

export interface XlsxRow {
  /** columna (A, B, C...) -> valor de la celda como texto */
  cells: Record<string, string>;
}

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

function excelSerialToIso(serial: number): string {
  const ms = EXCEL_EPOCH_UTC + Math.round(serial) * 86400000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convierte "20/08/2026", "20-08-2026" o un serial de Excel a ISO yyyy-MM-dd */
export function normalizeCellDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const textMatch = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (textMatch) {
    const [, d, m, yRaw] = textMatch;
    const year = yRaw.length === 2 ? Number(`20${yRaw}`) : Number(yRaw);
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const serial = Number(trimmed);
  if (!Number.isNaN(serial) && serial > 20000 && serial < 90000) {
    return excelSerialToIso(serial);
  }

  return null;
}

function colLetter(ref: string): string {
  return ref.match(/^[A-Z]+/)?.[0] ?? "";
}

function textOfSharedItem(si: Element): string {
  return [...si.getElementsByTagName("t")].map((t) => t.textContent ?? "").join("");
}

/**
 * Lee el primer libro/hoja de un .xlsx y devuelve filas como mapas columna->texto.
 * Soporta celdas de texto compartido (shared strings), texto inline y números.
 */
export async function readXlsxRows(file: File): Promise<XlsxRow[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const parser = new DOMParser();

  const sheetPath =
    Object.keys(zip.files).find((p) => /^xl\/worksheets\/sheet1\.xml$/i.test(p)) ??
    Object.keys(zip.files)
      .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(p))
      .sort()[0];
  if (!sheetPath) throw new Error("No se encontró ninguna hoja en el archivo Excel");

  let shared: string[] = [];
  const sharedFile = zip.file("xl/sharedStrings.xml");
  if (sharedFile) {
    const sharedXml = await sharedFile.async("string");
    const sharedDoc = parser.parseFromString(sharedXml, "application/xml");
    shared = [...sharedDoc.getElementsByTagName("si")].map(textOfSharedItem);
  }

  const sheetXml = await zip.file(sheetPath)!.async("string");
  const sheetDoc = parser.parseFromString(sheetXml, "application/xml");

  const rows: XlsxRow[] = [];
  for (const rowEl of [...sheetDoc.getElementsByTagName("row")]) {
    const cells: Record<string, string> = {};
    for (const c of [...rowEl.getElementsByTagName("c")]) {
      const ref = c.getAttribute("r");
      if (!ref) continue;
      const type = c.getAttribute("t");
      let value = "";
      if (type === "inlineStr") {
        value = c.getElementsByTagName("t")[0]?.textContent ?? "";
      } else {
        const vNode = c.getElementsByTagName("v")[0];
        const raw = vNode?.textContent ?? "";
        value = type === "s" ? (shared[Number(raw)] ?? "") : raw;
      }
      if (value !== "") cells[colLetter(ref)] = value;
    }
    if (Object.keys(cells).length > 0) rows.push({ cells });
  }

  return rows;
}
