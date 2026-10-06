import { describe, expect, it } from "vitest";
import type { Transaction } from "../types";
import { computeSavingsPlan, spentArsForPlan } from "./savingsPlan";

describe("computeSavingsPlan", () => {
  it("calcula el gasto máximo para ahorrar el objetivo en USD", () => {
    const r = computeSavingsPlan({ income: 2_000_000, rateArsPerUsd: 1_000, targetUsd: 1000, spent: 800_000 });
    expect(r).toEqual({
      targetArs: 1_000_000,
      maxSpend: 1_000_000,
      remainingBudget: 200_000,
      actualSaving: 1_200_000,
      onTrack: true,
    });
  });

  it("marca fuera de objetivo cuando el ahorro real no alcanza", () => {
    const r = computeSavingsPlan({ income: 2_000_000, rateArsPerUsd: 1_000, targetUsd: 1000, spent: 1_500_000 });
    expect(r?.onTrack).toBe(false);
    expect(r?.remainingBudget).toBe(-500_000);
  });

  it("no calcula sin tipo de cambio válido", () => {
    expect(computeSavingsPlan({ income: 1, rateArsPerUsd: 0, targetUsd: 1000, spent: 0 })).toBeNull();
  });
});

describe("spentArsForPlan", () => {
  const base = { id: "x", description: "", currency: "ARS" as const, bank: "santander" as const, sourceFile: "f" };

  it("suma solo gastos en pesos, excluyendo transferencias entre cuentas", () => {
    const txs: Transaction[] = [
      { ...base, id: "1", date: "2026-09-01", amount: -1000, category: "compras" },
      { ...base, id: "2", date: "2026-09-02", amount: -500, category: "transferencias" },
      { ...base, id: "3", date: "2026-09-03", amount: 3000, category: "compras" },
      { ...base, id: "4", date: "2026-09-04", amount: -20, currency: "USD", category: "compras" },
    ];
    expect(spentArsForPlan(txs)).toBe(1000);
  });
});
