import JSZip from "jszip";

interface FakeRow {
  fecha: string;
  descripcion: string;
  debito?: number;
  credito?: number;
  saldo: number;
}

const ROWS: FakeRow[] = [
  { fecha: "01/08/2026", descripcion: "Farmacia Sepia", debito: 3000, saldo: 97000 },
  { fecha: "02/08/2026", descripcion: "Netflix.com", debito: 4500, saldo: 92500 },
  { fecha: "03/08/2026", descripcion: "Compra Supermercado Coto", debito: 25000, saldo: 67500 },
  { fecha: "04/08/2026", descripcion: "Transferencia enviada Juan Perez", debito: 10000, saldo: 57500 },
  { fecha: "05/08/2026", descripcion: "Pago tarjeta de credito Visa", debito: 30000, saldo: 27500 },
  { fecha: "06/08/2026", descripcion: "Sueldo", credito: 150000, saldo: 177500 },
];

function inlineCell(ref: string, value: string): string {
  return `<c r="${ref}" t="inlineStr"><is><t>${value}</t></is></c>`;
}

function numberCell(ref: string, value: number): string {
  return `<c r="${ref}"><v>${value}</v></c>`;
}

/** Genera, en memoria, un .xlsx sintético (sin datos reales) con la misma forma que exporta un homebanking, para manejar en los tests E2E. */
export async function buildFakeStatementXlsx(): Promise<Buffer> {
  const headerRow = `<row r="1">${inlineCell("A1", "Fecha")}${inlineCell("B1", "Descripción")}${inlineCell("C1", "Débito")}${inlineCell("D1", "Crédito")}${inlineCell("E1", "Saldo")}</row>`;

  const dataRows = ROWS.map((row, i) => {
    const r = i + 2;
    const cells = [
      inlineCell(`A${r}`, row.fecha),
      inlineCell(`B${r}`, row.descripcion),
      row.debito !== undefined ? numberCell(`C${r}`, row.debito) : "",
      row.credito !== undefined ? numberCell(`D${r}`, row.credito) : "",
      numberCell(`E${r}`, row.saldo),
    ].join("");
    return `<row r="${r}">${cells}</row>`;
  });

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${headerRow}${dataRows.join("")}</sheetData>
</worksheet>`;

  const zip = new JSZip();
  zip.file("xl/worksheets/sheet1.xml", sheetXml);
  return zip.generateAsync({ type: "nodebuffer" });
}
