import { describe, expect, it } from "vitest";
import type { Transaction } from "../types";
import { DEFAULT_BUDGET_PCT, buildBudgetBreakdown } from "./savingsPlan";

const base = { id: "x", description: "", currency: "ARS" as const, bank: "santander" as const, sourceFile: "f", date: "2026-09-01" };

function tx(id: string, amount: number, category: Transaction["category"], extra: Partial<Transaction> = {}): Transaction {
  return { ...base, id, amount, category, ...extra };
}

const run = (income: number, transactions: Transaction[], budgetPct = DEFAULT_BUDGET_PCT) =>
  buildBudgetBreakdown({ income, rateArsPerUsd: 1000, targetUsd: 100, budgetPct, transactions });

describe("buildBudgetBreakdown", () => {
  it("compara presupuesto y gasto real por bloque", () => {
    const b = run(1_000_000, [tx("1", -200_000, "servicios_suscripciones"), tx("2", -150_000, "comida")]);
    const fijos = b!.buckets.find((x) => x.key === "fijos")!;
    expect(fijos.budget).toBe(300_000);
    expect(fijos.spent).toBe(200_000);
    expect(fijos.diff).toBe(100_000);
    const comida = b!.buckets.find((x) => x.key === "comida")!;
    expect(comida.diff).toBe(0);
  });

  it("un bloque pasado de presupuesto da diferencia negativa", () => {
    const b = run(1_000_000, [tx("1", -500_000, "gustos_personales")]);
    const gustos = b!.buckets.find((x) => x.key === "gustos")!;
    expect(gustos.budget).toBe(100_000);
    expect(gustos.diff).toBe(-400_000);
  });

  it("gustos personales se cuentan en su bloque, no en otros", () => {
    const b = run(1_000_000, [tx("1", -50_000, "gustos_personales")]);
    expect(b!.buckets.find((x) => x.key === "gustos")!.spent).toBe(50_000);
    expect(b!.buckets.find((x) => x.key === "personas_otros")!.spent).toBe(0);
  });

  it("transferencias recibidas restan en personas y otros; los ingresos comunes no cuentan", () => {
    const b = run(1_000_000, [
      tx("1", -300_000, "transferencias_personas"),
      tx("2", 100_000, "transferencias_personas"),
      tx("3", 500_000, "compras"),
    ]);
    expect(b!.spent).toBe(200_000);
    expect(b!.buckets.find((x) => x.key === "personas_otros")!.spent).toBe(200_000);
  });

  it("calcula lo que sobra después del objetivo de ahorro", () => {
    const b = run(1_000_000, [tx("1", -600_000, "comida")]);
    expect(b!.saved).toBe(400_000);
    expect(b!.targetArs).toBe(100_000);
    expect(b!.freeAfterTarget).toBe(300_000);
  });

  it("no calcula sin tipo de cambio válido", () => {
    expect(buildBudgetBreakdown({ income: 1, rateArsPerUsd: 0, targetUsd: 1000, budgetPct: DEFAULT_BUDGET_PCT, transactions: [] })).toBeNull();
  });
});
