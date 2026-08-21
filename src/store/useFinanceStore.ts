import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, IncomeEntry, MercadoPagoDetailItem, Transaction } from "../types";

function makeId(): string {
  return crypto.randomUUID();
}

export interface BankBalanceSnapshot {
  date: string;
  amount: number;
  sourceFile: string;
}

interface FinanceState {
  transactions: Transaction[];
  incomeEntries: IncomeEntry[];
  /** Saldo bancario justo antes de la fecha más antigua de los movimientos cargados, para poder comparar el balance del período contra el saldo real del banco. */
  openingBalance: number | null;
  setOpeningBalance: (amount: number | null) => void;
  /** Saldo real más reciente que reportó el banco en algún archivo importado (columna "Saldo") */
  bankBalanceSnapshot: BankBalanceSnapshot | null;
  reportBankBalance: (snapshot: BankBalanceSnapshot) => void;

  addTransactions: (txs: Omit<Transaction, "id">[]) => { added: number; duplicates: number };
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteBySourceFile: (sourceFile: string) => void;
  addManualTransaction: (tx: Omit<Transaction, "id">) => void;

  addMpDetail: (transactionId: string, item: Omit<MercadoPagoDetailItem, "id">) => void;
  updateMpDetail: (transactionId: string, itemId: string, patch: Partial<MercadoPagoDetailItem>) => void;
  removeMpDetail: (transactionId: string, itemId: string) => void;

  upsertIncome: (entry: Omit<IncomeEntry, "id"> & { id?: string }) => void;
  removeIncome: (id: string) => void;

  clearAll: () => void;
}

function isDuplicate(a: Transaction | Omit<Transaction, "id">, b: Transaction): boolean {
  const sameCore =
    a.date === b.date &&
    Math.abs(a.amount - b.amount) < 0.005 &&
    a.description.trim().toLowerCase() === b.description.trim().toLowerCase();
  if (!sameCore) return false;
  // Si ambos traen número de referencia del banco, es más confiable que el
  // combo fecha+descripción+monto: dos transferencias idénticas el mismo día
  // (mismo destino, mismo importe) son movimientos distintos con referencias distintas.
  if (a.reference && b.reference) return a.reference === b.reference;
  return true;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: [],
      incomeEntries: [],
      openingBalance: null,
      setOpeningBalance: (amount) => set({ openingBalance: amount }),
      bankBalanceSnapshot: null,
      reportBankBalance: (snapshot) => {
        const current = get().bankBalanceSnapshot;
        if (!current || snapshot.date >= current.date) {
          set({ bankBalanceSnapshot: snapshot });
        }
      },

      addTransactions: (txs) => {
        const existing = get().transactions;
        let added = 0;
        let duplicates = 0;
        const toAdd: Transaction[] = [];

        for (const tx of txs) {
          const dup = existing.some((e) => isDuplicate(tx, e)) || toAdd.some((e) => isDuplicate(tx, e));
          if (dup) {
            duplicates++;
            continue;
          }
          toAdd.push({ ...tx, id: makeId() });
          added++;
        }

        set({ transactions: [...existing, ...toAdd] });
        return { added, duplicates };
      },

      updateTransaction: (id, patch) => {
        set({
          transactions: get().transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        });
      },

      deleteTransaction: (id) => {
        set({ transactions: get().transactions.filter((t) => t.id !== id) });
      },

      deleteBySourceFile: (sourceFile) => {
        set({ transactions: get().transactions.filter((t) => t.sourceFile !== sourceFile) });
      },

      addManualTransaction: (tx) => {
        set({ transactions: [...get().transactions, { ...tx, id: makeId() }] });
      },

      addMpDetail: (transactionId, item) => {
        set({
          transactions: get().transactions.map((t) =>
            t.id === transactionId
              ? { ...t, mpDetails: [...(t.mpDetails ?? []), { ...item, id: makeId() }] }
              : t,
          ),
        });
      },

      updateMpDetail: (transactionId, itemId, patch) => {
        set({
          transactions: get().transactions.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  mpDetails: (t.mpDetails ?? []).map((d) => (d.id === itemId ? { ...d, ...patch } : d)),
                }
              : t,
          ),
        });
      },

      removeMpDetail: (transactionId, itemId) => {
        set({
          transactions: get().transactions.map((t) =>
            t.id === transactionId
              ? { ...t, mpDetails: (t.mpDetails ?? []).filter((d) => d.id !== itemId) }
              : t,
          ),
        });
      },

      upsertIncome: (entry) => {
        const existing = get().incomeEntries;
        if (entry.id) {
          set({
            incomeEntries: existing.map((e) => (e.id === entry.id ? { ...e, ...entry, id: e.id } : e)),
          });
        } else {
          set({ incomeEntries: [...existing, { ...entry, id: makeId() }] });
        }
      },

      removeIncome: (id) => {
        set({ incomeEntries: get().incomeEntries.filter((e) => e.id !== id) });
      },

      clearAll: () =>
        set({ transactions: [], incomeEntries: [], openingBalance: null, bankBalanceSnapshot: null }),
    }),
    { name: "control-de-gastos" },
  ),
);

export function monthKey(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export interface SourceFileSummary {
  sourceFile: string;
  count: number;
  firstDate: string;
  lastDate: string;
}

export function sourceFileSummaries(transactions: Transaction[]): SourceFileSummary[] {
  const byFile = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = t.sourceFile ?? "Cargados a mano";
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key)!.push(t);
  }
  return [...byFile.entries()].map(([sourceFile, txs]) => {
    const dates = txs.map((t) => t.date).sort();
    return { sourceFile, count: txs.length, firstDate: dates[0], lastDate: dates[dates.length - 1] };
  });
}

export function totalsByCategory(transactions: Transaction[]): Record<Category, number> {
  const totals: Record<Category, number> = {
    suscripciones: 0,
    consumos_automaticos: 0,
    transferencias: 0,
    consumo_tarjetas: 0,
    otros: 0,
  };
  for (const t of transactions) {
    if (t.amount < 0) totals[t.category] += Math.abs(t.amount);
  }
  return totals;
}
