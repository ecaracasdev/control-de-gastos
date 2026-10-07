import type { Transaction } from "../types";
import type { CreditCardStatement } from "./creditcard";

const AMOUNT_EPSILON = 0.01;
const MAX_DAY_DIFF = 3;

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

/**
 * Detecta pares de "movimientos_internos" de distintas fuentes que son la
 * misma transferencia vista desde dos lados (ej. "Transferencia a Mercado
 * Pago" en el banco + "Ingreso de dinero" en Mercado Pago): mismo monto
 * absoluto, signos opuestos, fecha cercana. Sirve para no contar esa plata
 * como gasto y como ingreso a la vez cuando se importan ambas fuentes para
 * el mismo período.
 */
export function findReconciledInternalTransferIds(transactions: Transaction[]): Set<string> {
  const candidates = transactions.filter((t) => t.category === "movimientos_internos");
  const used = new Set<string>();
  const reconciled = new Set<string>();

  for (const a of candidates) {
    if (used.has(a.id)) continue;
    const match = candidates.find(
      (b) =>
        b.id !== a.id &&
        !used.has(b.id) &&
        b.bank !== a.bank &&
        Math.abs(a.amount + b.amount) < AMOUNT_EPSILON &&
        daysBetween(a.date, b.date) <= MAX_DAY_DIFF,
    );
    if (match) {
      used.add(a.id);
      used.add(match.id);
      reconciled.add(a.id);
      reconciled.add(match.id);
    }
  }

  return reconciled;
}

/**
 * El pago en bloque del banco ("Pago de tarjeta de crédito") que ya tiene un
 * resumen de tarjeta vinculado queda reemplazado por los consumos reales
 * (cada uno es ahora su propio movimiento, con su propia categoría): contar
 * también el pago en bloque sería gastar esa plata dos veces.
 */
export function findSupersededCardPaymentIds(statements: CreditCardStatement[]): Set<string> {
  return new Set(statements.map((s) => s.linkedTransactionId).filter((id): id is string => Boolean(id)));
}
