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

/** Gasto real en pesos del período: lo que salió de tus cuentas, sin transferencias entre cuentas. */
export function spentArsForPlan(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.amount < 0 && t.currency === "ARS" && t.category !== "transferencias")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}
