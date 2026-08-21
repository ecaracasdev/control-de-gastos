import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfLine {
  page: number;
  text: string;
  y: number;
}

/**
 * Extrae el texto de un PDF agrupando items por su coordenada Y,
 * ya que pdf.js entrega texto por fragmentos sueltos, no por línea.
 */
export async function extractPdfLines(file: File): Promise<PdfLine[]> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines: PdfLine[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const transform = item.transform as number[];
      const y = Math.round(transform[5]);
      const x = transform[4];
      const bucket =
        [...rows.keys()].find((key) => Math.abs(key - y) <= 2) ?? y;
      if (!rows.has(bucket)) rows.set(bucket, []);
      rows.get(bucket)!.push({ x, str: item.str });
    }

    const sortedYs = [...rows.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const parts = rows.get(y)!.sort((a, b) => a.x - b.x);
      const text = parts
        .map((p) => p.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) lines.push({ page: pageNum, text, y });
    }
  }

  return lines;
}
