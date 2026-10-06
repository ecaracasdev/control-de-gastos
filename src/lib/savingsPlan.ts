import type { Category, Transaction } from "../types";

export type BudgetBucketKey = "fijos" | "comida" | "transporte" | "tarjeta" | "personas_otros";

export interface BudgetBucket {
  key: BudgetBucketKey;
  label: string;
  amount: number;
  pctOfIncome: number;
}

export interface BudgetBreakdown {
  income: number;
  spent: number;
  buckets: BudgetBucket[];
  targetArs: number;
  /** Lo que sobra después de gastar, en pesos (puede ser negativo) */
  saved: number;
  /** Ingreso libre para vos después de gastar y de tu objetivo de ahorro (puede ser negativo) */
  freeAfterTarget: number;
  /** Fijos + comida, como porcentaje del ingreso */
  essentialsPct: number;
}

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
};

export const BUDGET_BUCKET_LABELS: Record<BudgetBucketKey, string> = {
  fijos: "Gastos fijos (servicios, suscripciones, salud)",
  comida: "Comida",
  transporte: "Transporte",
  tarjeta: "Compras y tarjeta",
  personas_otros: "Personas y otros",
};

/**
 * Desglose del mes en pesos. Todo lo que sale de tus cuentas va a un bucket;
 * lo que te devuelven por transferencia resta en "Personas y otros". Así la
 * suma de buckets es exactamente el gasto neto del mes.
 */
export function buildBudgetBreakdown(input: {
  income: number;
  rateArsPerUsd: number;
  targetUsd: number;
  transactions: Transaction[];
}): BudgetBreakdown | null {
  if (!(input.rateArsPerUsd > 0) || !(input.targetUsd >= 0)) return null;

  const amounts: Record<BudgetBucketKey, number> = {
    fijos: 0,
    comida: 0,
    transporte: 0,
    tarjeta: 0,
    personas_otros: 0,
  };

  for (const t of input.transactions) {
    if (t.currency !== "ARS") continue;
    const bucket = BUCKET_OF_CATEGORY[t.category];
    if (!bucket) continue;
    if (t.amount < 0) amounts[bucket] += Math.abs(t.amount);
    else if (t.category === "transferencias_personas" || t.category === "transferencias") {
      amounts.personas_otros -= t.amount;
    }
  }

  const income = input.income;
  const spent = Object.values(amounts).reduce((sum, v) => sum + v, 0);
  const targetArs = input.targetUsd * input.rateArsPerUsd;
  const pct = (v: number) => (income > 0 ? v / income : 0);

  const buckets: BudgetBucket[] = (Object.keys(amounts) as BudgetBucketKey[]).map((key) => ({
    key,
    label: BUDGET_BUCKET_LABELS[key],
    amount: amounts[key],
    pctOfIncome: pct(amounts[key]),
  }));

  return {
    income,
    spent,
    buckets,
    targetArs,
    saved: income - spent,
    freeAfterTarget: income - spent - targetArs,
    essentialsPct: pct(amounts.fijos + amounts.comida),
  };
}
