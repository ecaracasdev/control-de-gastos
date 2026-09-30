import { normalizeCellDate, readXlsxRows, type XlsxRow } from "../excel/parseXlsx";
import type { Currency } from "../../types";

export interface CreditCardItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  installment?: { current: number; total: number };
  reference?: string;
}

export interface CreditCardStatement {
  id: string;
  cardLabel: string;
  cardLast4: string;
  closingDate?: string;
  /** Monto de "Su pago en pesos" tal como figura en el resumen (negativo) */
  paymentAmount?: number;
  totalConsumedArs?: number;
  totalConsumedUsd?: number;
  items: CreditCardItem[];
  sourceFile: string;
  linkedTransactionId?: string;
}

const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

function parseAmountString(raw: string): number {
  const negative = raw.includes("-");
  const digits = raw.replace(/[^\d,]/g, "").replace(",", ".");
  const value = Number.parseFloat(digits);
  if (Number.isNaN(value)) return 0;
  return negative ? -Math.abs(value) : Math.abs(value);
}

function parseInstallment(raw: string): { current: number; total: number } | undefined {
  const m = raw.match(/(\d+)\s*de\s*(\d+)/i);
  if (!m) return undefined;
  return { current: Number(m[1]), total: Number(m[2]) };
}

/**
 * Interpreta las filas de un Excel de "Últimos consumos" de tarjeta de
 * crédito (probado con el export de Santander: bloque de metadata, sección
 * "Pago de tarjeta y devoluciones" y una sección por tarjeta con sus
 * consumos, cerrada por un "Subtotal de ..."). A diferencia del resumen de
 * cuenta, acá los montos vienen como texto con símbolo ("$10.777,75",
 * "U$S0,01"), no como número.
 */
export function parseCreditCardRows(rows: XlsxRow[], sourceFile: string): CreditCardStatement[] {
  const statements: CreditCardStatement[] = [];

  let current: CreditCardStatement | null = null;
  let section: "none" | "payments" | "consumption" = "none";
  let pendingCardLabel: string | null = null;
  let pendingPaymentAmount = 0;
  let closingDate: string | undefined;

  for (let i = 0; i < rows.length; i++) {
    const a = (rows[i].cells.A ?? "").trim();
    const b = (rows[i].cells.B ?? "").trim();

    if (a === "Fecha de cierre" && rows[i + 1]) {
      closingDate = normalizeCellDate(rows[i + 1].cells.A ?? "") ?? undefined;
      continue;
    }

    const holderCardMatch = a.match(/^Tarjeta de .+ - (.+) terminada en (\d+)$/i);
    const plainCardMatch = !holderCardMatch && a.match(/^Tarjeta (.+) terminada en (\d+)$/i);

    if (holderCardMatch) {
      current = {
        id: crypto.randomUUID(),
        cardLabel: pendingCardLabel ?? `${holderCardMatch[1]} terminada en ${holderCardMatch[2]}`,
        cardLast4: holderCardMatch[2],
        closingDate,
        paymentAmount: pendingPaymentAmount || undefined,
        items: [],
        sourceFile,
      };
      statements.push(current);
      pendingPaymentAmount = 0;
      section = "consumption";
      continue;
    }

    if (plainCardMatch) {
      pendingCardLabel = `${plainCardMatch[1]} terminada en ${plainCardMatch[2]}`;
      continue;
    }

    if (a === "Pago de tarjeta y devoluciones") {
      section = "payments";
      continue;
    }

    if (/^Subtotal/i.test(a)) {
      if (current) {
        current.totalConsumedArs = rows[i].cells.E ? parseAmountString(rows[i].cells.E) : undefined;
        current.totalConsumedUsd = rows[i].cells.F ? parseAmountString(rows[i].cells.F) : undefined;
      }
      section = "none";
      continue;
    }

    if (a === "Fecha" && b.toLowerCase().startsWith("descripci")) continue; // encabezado repetido
    if (!DATE_RE.test(a)) continue;

    const iso = normalizeCellDate(a);
    if (!iso) continue;

    const arsRaw = rows[i].cells.E;
    const usdRaw = rows[i].cells.F;

    if (section === "payments") {
      const amt = arsRaw ? parseAmountString(arsRaw) : usdRaw ? parseAmountString(usdRaw) : 0;
      pendingPaymentAmount += amt;
      continue;
    }

    if (section === "consumption" && current) {
      const currency: Currency = usdRaw ? "USD" : "ARS";
      const amount = -Math.abs(parseAmountString(usdRaw || arsRaw || "0"));
      current.items.push({
        id: crypto.randomUUID(),
        date: iso,
        description: b,
        amount,
        currency,
        installment: parseInstallment((rows[i].cells.C ?? "").trim()),
        reference: (rows[i].cells.D ?? "").trim() || undefined,
      });
    }
  }

  return statements;
}

export async function parseCreditCardXlsx(file: File): Promise<CreditCardStatement[]> {
  const rows = await readXlsxRows(file);
  return parseCreditCardRows(rows, file.name);
}
