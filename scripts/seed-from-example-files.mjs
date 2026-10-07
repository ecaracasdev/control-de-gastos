// Arma un backup (mismo formato que "exportar backup completo") corriendo los
// parsers reales de la app contra lo que haya en example_files/, para no
// tener que cargar archivos a mano cada vez que se quiere revisar una
// pantalla. example_files/ está gitignoreado: esto nunca sube datos reales
// a ningún lado, solo genera example_files/seed-backup.json en tu máquina.
//
// Clasifica cada archivo por contenido, no por nombre (los nombres reales
// cambian: "movimientos_septiembre.xlsx", "tdc_septiembre.xlsx", etc.):
//   - .xlsx que tiene secciones de tarjeta ("Tarjeta ... terminada en") -> resumen de tarjeta
//   - .xlsx genérico -> movimientos de banco (Santander)
//   - .pdf que menciona "Mercado Pago" -> resumen de Mercado Pago
//   - .pdf genérico -> movimientos de banco (Santander)
//
// Uso: con `npm run dev` corriendo en el puerto 5173, en otra terminal:
//   node scripts/seed-from-example-files.mjs

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(import.meta.dirname, "..");
const EXAMPLES = path.join(ROOT, "example_files");
const DEV_URL = process.env.SEED_URL ?? "http://localhost:5173/";

async function fileArgFor(absPath) {
  const bytes = await readFile(absPath);
  return { name: path.basename(absPath), b64: bytes.toString("base64") };
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(DEV_URL);

const entries = await readdir(EXAMPLES);
const allDrafts = [];
let bankBalanceSnapshot = null;
let creditCardStatements = [];

for (const entry of entries) {
  const abs = path.join(EXAMPLES, entry);
  const lower = entry.toLowerCase();
  if (!lower.endsWith(".xlsx") && !lower.endsWith(".pdf")) continue;

  const { name, b64 } = await fileArgFor(abs);

  if (lower.endsWith(".xlsx")) {
    const ccStatements = await page.evaluate(
      async ({ name, b64 }) => {
        const binary = atob(b64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        const file = new File([arr], name);
        const { parseCreditCardXlsx } = await import("/src/lib/creditcard/index.ts");
        try {
          return await parseCreditCardXlsx(file);
        } catch {
          return [];
        }
      },
      { name, b64 },
    );

    if (ccStatements.some((s) => s.items.length > 0)) {
      console.log(`${entry}: resumen de tarjeta, ${ccStatements.length} tarjeta(s)`);
      creditCardStatements.push(...ccStatements);
      continue;
    }

    const result = await page.evaluate(
      async ({ name, b64 }) => {
        const binary = atob(b64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        const file = new File([arr], name);
        const { parseStatementXlsx } = await import("/src/lib/excel/index.ts");
        return await parseStatementXlsx(file, "santander");
      },
      { name, b64 },
    );
    console.log(`${entry}: banco (Excel), ${result.drafts.length} movimientos`);
    allDrafts.push(...result.drafts);
    if (result.latestBalance) bankBalanceSnapshot = { ...result.latestBalance, sourceFile: name };
    continue;
  }

  // .pdf: mirar el texto para decidir si es Mercado Pago o un banco.
  const isMercadoPago = await page.evaluate(
    async ({ name, b64 }) => {
      const binary = atob(b64);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      const file = new File([arr], name);
      const { extractPdfLines } = await import("/src/lib/pdf/extractText.ts");
      const lines = await extractPdfLines(file);
      return lines.some((l) => /mercado\s*libre|rendimientos|ingreso de dinero|salida de dinero/i.test(l.text));
    },
    { name, b64 },
  );

  const bank = isMercadoPago ? "mercadopago" : "santander";
  const result = await page.evaluate(
    async ({ name, b64, bank }) => {
      const binary = atob(b64);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      const file = new File([arr], name);
      const { parseStatementPdf } = await import("/src/lib/pdf/index.ts");
      return await parseStatementPdf(file, bank);
    },
    { name, b64, bank },
  );
  console.log(`${entry}: ${bank === "mercadopago" ? "Mercado Pago" : "banco (PDF)"}, ${result.drafts.length} movimientos`);
  allDrafts.push(...result.drafts);
}

const transactions = allDrafts.map(({ confidence: _confidence, ...t }) => ({ ...t, id: crypto.randomUUID() }));

// Mismo comportamiento que store.addCreditCardStatement: cada consumo de la
// tarjeta se promueve a movimiento propio y categorizado, y el pago en bloque
// que coincide en monto queda vinculado (para excluirlo del gasto después).
creditCardStatements = creditCardStatements.map((s) => {
  const match = transactions.find(
    (t) => t.category === "pago_tarjeta_credito" && s.paymentAmount !== undefined && Math.abs(t.amount - s.paymentAmount) < 0.01,
  );
  return { ...s, linkedTransactionId: match?.id };
});

const promoted = await page.evaluate(async (statements) => {
  const { categorize } = await import("/src/lib/categorize.ts");
  return statements.flatMap((s) =>
    s.items.map((item) => ({
      id: crypto.randomUUID(),
      date: item.date,
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      ...categorize(item.description, "manual"),
      bank: "tarjeta_credito",
      installment: item.installment,
      reference: item.reference,
      sourceFile: s.sourceFile,
      creditCardStatementId: s.id,
    })),
  );
}, creditCardStatements);
transactions.push(...promoted);

const backup = {
  version: 1,
  exportedAt: new Date().toISOString(),
  transactions,
  incomeEntries: [],
  openingBalance: null,
  bankBalanceSnapshot,
  creditCardStatements,
};

const out = path.join(EXAMPLES, "seed-backup.json");
await writeFile(out, JSON.stringify(backup, null, 2));
const linked = creditCardStatements.filter((s) => s.linkedTransactionId).length;
console.log(
  `\nListo: ${transactions.length} movimientos, ${creditCardStatements.length} resumen(es) de tarjeta (${linked} vinculado(s)).`,
);
console.log(`Backup escrito en ${out}`);
console.log('En la app: Movimientos -> Archivos importados -> "restaurar backup" -> elegí ese archivo.');

await browser.close();
