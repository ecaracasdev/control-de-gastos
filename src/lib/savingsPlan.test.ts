import { describe, expect, it } from "vitest";
import type { Transaction } from "../types";
import { buildBudgetBreakdown } from "./savingsPlan";

const base = { id: "x", description: "", currency: "ARS" as const, bank: "santander" as const, sourceFile: "f", date: "2026-09-01" };

function tx(id: string, amount: number, category: Transaction["category"], extra: Partial<Transaction> = {}): Transaction {
  return { ...base, id, amount, category, ...extra };
}

describe("buildBudgetBreakdown", () => {
  it("agrupa los gastos en buckets y calcula % del ingreso", () => {
    const b = buildBudgetBreakdown({
      income: 1_000_000,
      rateArsPerUsd: 1000,
      targetUsd: 100,
      transactions: [
        tx("1", -200_000, "servicios_suscripciones"),
        tx("2", -100_000, "salud"),
        tx("3", -150_000, "comida"),
        tx("4", -50_000, "transporte"),
        tx("5", -80_000, "compras"),
      ],
    });
    expect(b).not.toBeNull();
    expect(b!.spent).toBe(580_000);
    expect(b!.buckets.find((x) => x.key === "fijos")!.amount).toBe(300_000);
    expect(b!.buckets.find((x) => x.key === "fijos")!.pctOfIncome).toBeCloseTo(0.3);
    expect(b!.essentialsPct).toBeCloseTo(0.45);
  });

  it("calcula cuánto queda libre después del objetivo de ahorro", () => {
    const b = buildBudgetBreakdown({
      income: 1_000_000,
      rateArsPerUsd: 1000,
      targetUsd: 100,
      transactions: [tx("1", -600_000, "comida")],
    });
    expect(b!.saved).toBe(400_000);
    expect(b!.targetArs).toBe(100_000);
    expect(b!.freeAfterTarget).toBe(300_000);
  });

  it("las transferencias recibidas restan en personas y otros; los ingresos comunes no cuentan", () => {
    const b = buildBudgetBreakdown({
      income: 1_000_000,
      rateArsPerUsd: 1000,
      targetUsd: 0,
      transactions: [
        tx("1", -300_000, "transferencias_personas"),
        tx("2", 100_000, "transferencias_personas"),
        tx("3", 500_000, "compras"),
      ],
    });
    expect(b!.spent).toBe(200_000);
    expect(b!.buckets.find((x) => x.key === "personas_otros")!.amount).toBe(200_000);
  });

  it("no calcula sin tipo de cambio válido", () => {
    expect(buildBudgetBreakdown({ income: 1, rateArsPerUsd: 0, targetUsd: 1000, transactions: [] })).toBeNull();
  });
});
