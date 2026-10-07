import { describe, expect, it } from "vitest";
import { migrateCategory, useFinanceStore } from "./useFinanceStore";
import type { CreditCardStatement } from "../lib/creditcard";

describe("migrateCategory", () => {
  it("mapea 1 a 1 las 6 categorías viejas a las nuevas", () => {
    expect(migrateCategory("compras_tarjeta")).toBe("compras");
    expect(migrateCategory("pago_tarjeta_credito")).toBe("pago_tarjeta_credito");
    expect(migrateCategory("mercado_pago")).toBe("movimientos_internos");
    expect(migrateCategory("transferencias")).toBe("transferencias");
    expect(migrateCategory("debitos_automaticos")).toBe("servicios_suscripciones");
    expect(migrateCategory("otros")).toBe("otros");
  });

  it("cae en otros ante una categoría desconocida", () => {
    expect(migrateCategory("categoria_inexistente")).toBe("otros");
  });
});

describe("exportBackup / restoreBackup", () => {
  it("hace un roundtrip completo del estado", () => {
    const store = useFinanceStore.getState();
    store.clearAll();
    store.addManualTransaction({
      date: "2026-08-01",
      description: "Test",
      amount: -100,
      currency: "ARS",
      category: "compras",
      bank: "manual",
    });
    store.upsertIncome({ month: "2026-08", label: "Sueldo", amount: 5000 });
    store.setOpeningBalance(1000);

    const backup = store.exportBackup();
    expect(backup.transactions).toHaveLength(1);
    expect(backup.incomeEntries).toHaveLength(1);
    expect(backup.openingBalance).toBe(1000);

    store.clearAll();
    expect(useFinanceStore.getState().transactions).toHaveLength(0);

    store.restoreBackup(backup);
    const restored = useFinanceStore.getState();
    expect(restored.transactions).toHaveLength(1);
    expect(restored.transactions[0].description).toBe("Test");
    expect(restored.incomeEntries).toHaveLength(1);
    expect(restored.openingBalance).toBe(1000);
  });
});

describe("addCreditCardStatement", () => {
  function baseStatement(overrides: Partial<CreditCardStatement> = {}): CreditCardStatement {
    return {
      id: "stmt-1",
      cardLabel: "Visa terminada en 1234",
      cardLast4: "1234",
      paymentAmount: -1500,
      items: [
        { id: "i1", date: "2026-09-05", description: "Netflix.com", amount: -500, currency: "ARS" as const },
        { id: "i2", date: "2026-09-10", description: "Super Mercado", amount: -1000, currency: "ARS" as const },
      ],
      sourceFile: "tarjeta.xlsx",
      ...overrides,
    };
  }

  it("convierte cada consumo en un movimiento propio y categorizado", () => {
    const store = useFinanceStore.getState();
    store.clearAll();
    const { added, duplicates, linked } = store.addCreditCardStatement(baseStatement());

    expect(added).toBe(2);
    expect(duplicates).toBe(0);
    expect(linked).toBe(false);

    const txs = useFinanceStore.getState().transactions;
    expect(txs).toHaveLength(2);
    expect(txs.find((t) => t.description === "Netflix.com")?.category).toBe("servicios_suscripciones");
    expect(txs.every((t) => t.bank === "tarjeta_credito")).toBe(true);
    expect(txs.every((t) => t.creditCardStatementId === "stmt-1")).toBe(true);
  });

  it("vincula el pago en bloque cuando el monto coincide, y eso lo excluye de los totales", () => {
    const store = useFinanceStore.getState();
    store.clearAll();
    store.addManualTransaction({
      date: "2026-09-01",
      description: "Pago tarjeta de credito",
      amount: -1500,
      currency: "ARS",
      category: "pago_tarjeta_credito",
      bank: "santander",
    });

    const { linked } = store.addCreditCardStatement(baseStatement());
    expect(linked).toBe(true);

    const statements = useFinanceStore.getState().creditCardStatements;
    expect(statements[0].linkedTransactionId).toBeDefined();
  });

  it("deleteCreditCardStatement borra también los movimientos que generó", () => {
    const store = useFinanceStore.getState();
    store.clearAll();
    store.addCreditCardStatement(baseStatement());
    expect(useFinanceStore.getState().transactions).toHaveLength(2);

    store.deleteCreditCardStatement("stmt-1");
    expect(useFinanceStore.getState().transactions).toHaveLength(0);
    expect(useFinanceStore.getState().creditCardStatements).toHaveLength(0);
  });

  it("no duplica movimientos si el mismo resumen se carga dos veces", () => {
    const store = useFinanceStore.getState();
    store.clearAll();
    store.addCreditCardStatement(baseStatement());
    const second = store.addCreditCardStatement(baseStatement({ id: "stmt-2" }));

    expect(second.added).toBe(0);
    expect(second.duplicates).toBe(2);
    expect(useFinanceStore.getState().transactions).toHaveLength(2);
  });
});
