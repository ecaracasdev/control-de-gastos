import type { Transaction } from "../types";

export interface SavingsPlanResult {
  targetArs: number;
  maxSpend: number;
  remainingBudget: number;
  actualSaving: number;
  onTrack: boolean;
}

export function computeSavingsPlan(input: {
  income: number;
  rateArsPerUsd: number;
  targetUsd: number;
  spent: number;
}): SavingsPlanResult | null {
  if (!(input.rateArsPerUsd > 0) || !(input.targetUsd >= 0)) return null;
  const targetArs = input.targetUsd * input.rateArsPerUsd;
  const maxSpend = input.income - targetArs;
  const actualSaving = input.income - input.spent;
  return {
    targetArs,
    maxSpend,
    remainingBudget: maxSpend - input.spent,
    actualSaving,
    onTrack: actualSaving >= targetArs,
  };
}

/**
 * Gasto neto en pesos del período, visto como cambio en tus activos: todo lo
 * que sale de tus cuentas (compras, pagos, transferencias a personas) menos lo
 * que te devuelven por transferencia. Los movimientos entre tus propias
 * cuentas que ya se reconciliaron no llegan acá (se filtran antes).
 */
export function spentArsForPlan(transactions: Transaction[]): number {
  const arsTx = transactions.filter((t) => t.currency === "ARS");
  const outflows = arsTx.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const transfersIn = arsTx
    .filter((t) => t.amount > 0 && t.category === "transferencias")
    .reduce((sum, t) => sum + t.amount, 0);
  return outflows - transfersIn;
}
