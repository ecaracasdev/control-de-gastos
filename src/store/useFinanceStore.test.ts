import { describe, expect, it } from "vitest";
import { migrateCategory, useFinanceStore } from "./useFinanceStore";

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
