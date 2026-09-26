import { describe, expect, it } from "vitest";
import type { Transaction } from "../types";
import { findReconciledInternalTransferIds } from "./reconciliation";
import { totalsByCategory } from "../store/useFinanceStore";

function tx(partial: Partial<Transaction> & Pick<Transaction, "id" | "date" | "amount" | "category" | "bank">): Transaction {
  return {
    description: "",
    currency: "ARS",
    ...partial,
  };
}

describe("findReconciledInternalTransferIds", () => {
  it("matchea una transferencia banco -> Mercado Pago con su contraparte", () => {
    const transactions = [
      tx({ id: "bank-out", date: "2026-08-08", amount: -60000, category: "movimientos_internos", bank: "santander" }),
      tx({ id: "mp-in", date: "2026-08-08", amount: 60000, category: "movimientos_internos", bank: "mercadopago" }),
    ];
    const result = findReconciledInternalTransferIds(transactions);
    expect(result).toEqual(new Set(["bank-out", "mp-in"]));
  });

  it("tolera un par de días de diferencia entre las dos fechas", () => {
    const transactions = [
      tx({ id: "bank-out", date: "2026-08-08", amount: -60000, category: "movimientos_internos", bank: "santander" }),
      tx({ id: "mp-in", date: "2026-08-10", amount: 60000, category: "movimientos_internos", bank: "mercadopago" }),
    ];
    expect(findReconciledInternalTransferIds(transactions)).toEqual(new Set(["bank-out", "mp-in"]));
  });

  it("no matchea si la diferencia de fecha es demasiado grande", () => {
    const transactions = [
      tx({ id: "bank-out", date: "2026-08-08", amount: -60000, category: "movimientos_internos", bank: "santander" }),
      tx({ id: "mp-in", date: "2026-08-20", amount: 60000, category: "movimientos_internos", bank: "mercadopago" }),
    ];
    expect(findReconciledInternalTransferIds(transactions)).toEqual(new Set());
  });

  it("no matchea dos movimientos de la misma fuente (no es un cruce entre banco y MP)", () => {
    const transactions = [
      tx({ id: "a", date: "2026-08-08", amount: -60000, category: "movimientos_internos", bank: "santander" }),
      tx({ id: "b", date: "2026-08-08", amount: 60000, category: "movimientos_internos", bank: "santander" }),
    ];
    expect(findReconciledInternalTransferIds(transactions)).toEqual(new Set());
  });

  it("no toca movimientos que no sean 'movimientos_internos', aunque el monto matchee", () => {
    const transactions = [
      tx({ id: "a", date: "2026-08-08", amount: -60000, category: "compras", bank: "santander" }),
      tx({ id: "b", date: "2026-08-08", amount: 60000, category: "movimientos_internos", bank: "mercadopago" }),
    ];
    expect(findReconciledInternalTransferIds(transactions)).toEqual(new Set());
  });

  it("deja sin matchear un movimiento interno huérfano (solo se importó un lado)", () => {
    const transactions = [
      tx({ id: "bank-out", date: "2026-08-08", amount: -60000, category: "movimientos_internos", bank: "santander" }),
    ];
    expect(findReconciledInternalTransferIds(transactions)).toEqual(new Set());
  });

  it("caso completo: excluir el par reconciliado deja los totales por categoría sin doble conteo", () => {
    const transactions = [
      tx({ id: "bank-out", date: "2026-08-08", amount: -60000, category: "movimientos_internos", bank: "santander" }),
      tx({ id: "mp-in", date: "2026-08-08", amount: 60000, category: "movimientos_internos", bank: "mercadopago" }),
      tx({ id: "mp-farmacia", date: "2026-08-09", amount: -3000, category: "salud", subcategory: "farmacia", bank: "mercadopago" }),
    ];
    const reconciled = findReconciledInternalTransferIds(transactions);
    const netted = transactions.filter((t) => !reconciled.has(t.id));
    const totals = totalsByCategory(netted);

    expect(totals.movimientos_internos).toBe(0);
    expect(totals.salud).toBe(3000);
  });
});
