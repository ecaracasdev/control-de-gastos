import type { Category, Transaction } from "../types";

export type BudgetBucketKey = "fijos" | "comida" | "transporte" | "tarjeta" | "personas_otros" | "gustos";

export const BUDGET_BUCKET_ORDER: BudgetBucketKey[] = [
  "fijos",
  "comida",
  "transporte",
  "tarjeta",
  "personas_otros",
  "gustos",
];

export const BUDGET_BUCKET_LABELS: Record<BudgetBucketKey, string> = {
  fijos: "Gastos fijos",
  comida: "Comida",
  transporte: "Transporte",
  tarjeta: "Compras y tarjeta",
  personas_otros: "Personas y otros",
  gustos: "Gustos personales",
};

export const DEFAULT_BUDGET_PCT: Record<BudgetBucketKey, number> = {
  fijos: 30,
  comida: 15,
  transporte: 5,
  tarjeta: 10,
  personas_otros: 5,
  gustos: 10,
};

const BUCKET_OF_CATEGORY: Partial<Record<Category, BudgetBucketKey>> = {
  servicios_suscripciones: "fijos",
  salud: "fijos",
  comida: "comida",
  transporte: "transporte",
  compras: "tarjeta",
  pago_tarjeta_credito: "tarjeta",
  transferencias_personas: "personas_otros",
  otros: "personas_otros",
  movimientos_internos: "personas_otros",
  transferencias: "personas_otros",
  gustos_personales: "gustos",
};

export interface BudgetBucket {
  key: BudgetBucketKey;
  label: string;
  budget: number;
  spent: number;
  /** presupuesto − gasto real: positivo = te sobró, negativo = te pasaste */
  diff: number;
}

export interface BudgetBreakdown {
  income: number;
  spent: number;
  targetArs: number;
  /** ingreso − gasto real */
  saved: number;
  /** lo que sobra después de cubrir el objetivo de ahorro (puede ser negativo) */
  freeAfterTarget: number;
  buckets: BudgetBucket[];
  /** suma de porcentajes de bloques + ahorro: tiene que dar hasta 100 */
  planPct: number;
}

/**
 * Presupuesto por bloque: cada bloque tiene un porcentaje del ingreso y se compara
 * contra el gasto real del mes. La suma de buckets es el gasto neto del mes: lo que
 * sale de tus cuentas menos lo que te devuelven por transferencia.
 */
export function buildBudgetBreakdown(input: {
  income: number;
  rateArsPerUsd: number;
  targetUsd: number;
  budgetPct: Record<BudgetBucketKey, number>;
  transactions: Transaction[];
}): BudgetBreakdown | null {
  if (!(input.rateArsPerUsd > 0) || !(input.targetUsd >= 0)) return null;

  const spentBy: Record<BudgetBucketKey, number> = {
    fijos: 0,
    comida: 0,
    transporte: 0,
    tarjeta: 0,
    personas_otros: 0,
    gustos: 0,
  };

  for (const t of input.transactions) {
    if (t.currency !== "ARS") continue;
    const bucket = BUCKET_OF_CATEGORY[t.category];
    if (!bucket) continue;
    if (t.amount < 0) spentBy[bucket] += Math.abs(t.amount);
    else if (t.category === "transferencias_personas" || t.category === "transferencias") {
      spentBy.personas_otros -= t.amount;
    }
  }

  const income = input.income;
  const targetArs = input.targetUsd * input.rateArsPerUsd;
  const spent = BUDGET_BUCKET_ORDER.reduce((sum, k) => sum + spentBy[k], 0);
  const buckets: BudgetBucket[] = BUDGET_BUCKET_ORDER.map((key) => {
    const budget = (income * input.budgetPct[key]) / 100;
    return { key, label: BUDGET_BUCKET_LABELS[key], budget, spent: spentBy[key], diff: budget - spentBy[key] };
  });

  const planPct = BUDGET_BUCKET_ORDER.reduce((sum, k) => sum + input.budgetPct[k], 0) + (income > 0 ? (targetArs / income) * 100 : 0);

  return {
    income,
    spent,
    targetArs,
    saved: income - spent,
    freeAfterTarget: income - spent - targetArs,
    buckets,
    planPct,
  };
}
