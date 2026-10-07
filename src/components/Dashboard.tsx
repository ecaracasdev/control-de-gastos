import { useMemo, useState } from "react";
import { useFinanceStore, monthKey, totalsByCategory } from "../store/useFinanceStore";
import { findReconciledInternalTransferIds, findSupersededCardPaymentIds } from "../lib/reconciliation";
import { SummaryCards } from "./SummaryCards";
import { BalanceCheck } from "./BalanceCheck";
import { RealBalanceCard } from "./RealBalanceCard";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { CategoryDetailModal, type CategoryDetailItem } from "./CategoryDetailModal";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { MonthFilter } from "./MonthFilter";
import { BudgetBreakdownCard } from "./BudgetBreakdownCard";
import { buildBudgetBreakdown } from "../lib/savingsPlan";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { UploadCloud } from "lucide-react";
import { Button } from "./ui/Button";
import type { Category, Transaction } from "../types";

function getCategoryModalItems(transactions: Transaction[], category: Category): CategoryDetailItem[] {
  return transactions.filter((t) => t.category === category && t.amount < 0);
}

export function Dashboard({ onGoToUpload }: { onGoToUpload: () => void }) {
  const transactions = useFinanceStore((s) => s.transactions);
  const incomeEntries = useFinanceStore((s) => s.incomeEntries);
  const bankBalanceSnapshot = useFinanceStore((s) => s.bankBalanceSnapshot);
  const creditCardStatements = useFinanceStore((s) => s.creditCardStatements);
  const savingsTargetUsd = useFinanceStore((s) => s.savingsTargetUsd);
  const setSavingsTargetUsd = useFinanceStore((s) => s.setSavingsTargetUsd);
  const budgetPct = useFinanceStore((s) => s.budgetPct);
  const setBudgetPct = useFinanceStore((s) => s.setBudgetPct);
  const exchangeRateByMonth = useFinanceStore((s) => s.exchangeRateByMonth);
  const setExchangeRate = useFinanceStore((s) => s.setExchangeRate);
  const [selectedMonth, setSelectedMonth] = useState<string | "all">("all");
  const [modalCategory, setModalCategory] = useState<Category | null>(null);

  const months = useMemo(
    () => [...new Set(transactions.map((t) => monthKey(t.date)))].sort().reverse(),
    [transactions],
  );

  const filtered = useMemo(
    () =>
      selectedMonth === "all" ? transactions : transactions.filter((t) => monthKey(t.date) === selectedMonth),
    [transactions, selectedMonth],
  );

  const manualIncome = useMemo(() => {
    const entries =
      selectedMonth === "all" ? incomeEntries : incomeEntries.filter((e) => e.month === selectedMonth);
    return entries.reduce((sum, e) => sum + e.amount, 0);
  }, [incomeEntries, selectedMonth]);

  // "movimientos_internos" que son la misma transferencia vista desde el
  // banco y desde Mercado Pago (ej. transferencia a MP + "Ingreso de dinero"
  // en MP) se excluyen del panel del hogar: si se cuentan los dos lados, esa
  // plata queda contada como gasto Y como ingreso a la vez, cuando en
  // realidad no cambió el patrimonio del hogar (se gastó de verdad recién
  // cuando sale de Mercado Pago, y eso ya se categoriza aparte).
  const reconciledIds = useMemo(() => findReconciledInternalTransferIds(transactions), [transactions]);
  // El pago en bloque de la tarjeta que ya tiene un resumen vinculado se
  // excluye del gasto del hogar: sus consumos reales ya están cargados como
  // movimientos propios (ver store.addCreditCardStatement), contarlo también
  // sería gastar esa plata dos veces.
  const supersededCardIds = useMemo(() => findSupersededCardPaymentIds(creditCardStatements), [creditCardStatements]);
  const excludedIds = useMemo(
    () => new Set([...reconciledIds, ...supersededCardIds]),
    [reconciledIds, supersededCardIds],
  );
  const netted = useMemo(() => filtered.filter((t) => !excludedIds.has(t.id)), [filtered, excludedIds]);
  const budgetBreakdown = useMemo(
    () =>
      buildBudgetBreakdown({
        income: manualIncome,
        rateArsPerUsd: exchangeRateByMonth[selectedMonth === "all" ? "" : selectedMonth] ?? 0,
        targetUsd: savingsTargetUsd,
        budgetPct,
        transactions: netted,
      }),
    [manualIncome, exchangeRateByMonth, selectedMonth, savingsTargetUsd, budgetPct, netted],
  );
  const nettedAll = useMemo(
    () => transactions.filter((t) => !excludedIds.has(t.id)),
    [transactions, excludedIds],
  );

  // Las transferencias (a otras personas, no a Mercado Pago) se tratan aparte:
  // si mandás $900.000 y te los devuelven, sumar esa devolución como "ingreso"
  // sin contar el envío como "gasto" infla ambos números con plata que en
  // realidad ya era tuya. Se muestran como un neto propio en vez de mezclarlas.
  const detectedIncome = useMemo(
    () =>
      netted
        .filter((t) => t.amount > 0 && t.category !== "transferencias")
        .reduce((sum, t) => sum + t.amount, 0),
    [netted],
  );

  const transfersNet = useMemo(
    () => netted.filter((t) => t.category === "transferencias").reduce((sum, t) => sum + t.amount, 0),
    [netted],
  );

  // El Balance SIEMPRE se calcula con los créditos detectados en los propios
  // movimientos, nunca con el ingreso cargado a mano — si el sueldo declarado
  // no incluye TODOS los créditos reales (reintegros, etc.), reemplazarlo
  // rompe la cuenta contra el banco. El ingreso manual se muestra aparte,
  // solo como referencia informativa.
  const income = detectedIncome;

  const totals = useMemo(() => totalsByCategory(netted), [netted]);
  const expenses = useMemo(
    () =>
      Object.entries(totals).reduce((sum, [category, amount]) => (category === "transferencias" ? sum : sum + amount), 0),
    [totals],
  );
  // Ingresos - Gastos + neto de transferencias sigue dando exactamente el
  // flujo neto real del período (se puede verificar: es la misma cuenta que
  // antes, solo reagrupada). Este es el balance "del hogar" (banco + Mercado
  // Pago combinados); el que compara contra el saldo real del banco es
  // bankBalance, más abajo.
  const balance = income - expenses + transfersNet;

  // "¿Cierra con tu banco?" se calcula SOLO con movimientos del banco: el
  // detalle de en qué se gastó adentro de Mercado Pago nunca toca la cuenta
  // bancaria (esa plata ya salió del banco al hacer la transferencia), así
  // que mezclarlo rompe la comparación contra el saldo real que reporta el
  // banco.
  // El detalle de consumos de la tarjeta (bank: "tarjeta_credito") tampoco
  // toca la cuenta bancaria directamente: es el desglose del pago en bloque,
  // que ese sí es un movimiento real del banco.
  const bankOnly = useMemo(
    () => filtered.filter((t) => t.bank !== "mercadopago" && t.bank !== "tarjeta_credito"),
    [filtered],
  );
  const bankIncome = useMemo(
    () =>
      bankOnly
        .filter((t) => t.amount > 0 && t.category !== "transferencias")
        .reduce((sum, t) => sum + t.amount, 0),
    [bankOnly],
  );
  const bankTransfersNet = useMemo(
    () => bankOnly.filter((t) => t.category === "transferencias").reduce((sum, t) => sum + t.amount, 0),
    [bankOnly],
  );
  const bankTotals = useMemo(() => totalsByCategory(bankOnly), [bankOnly]);
  const bankExpenses = useMemo(
    () =>
      Object.entries(bankTotals).reduce(
        (sum, [category, amount]) => (category === "transferencias" ? sum : sum + amount),
        0,
      ),
    [bankTotals],
  );
  const bankBalance = bankIncome - bankExpenses + bankTransfersNet;

  const earliestDate = useMemo(
    () => (bankOnly.length === 0 ? null : bankOnly.reduce((min, t) => (t.date < min ? t.date : min), bankOnly[0].date)),
    [bankOnly],
  );

  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<UploadCloud size={22} />}
          title="Todavía no cargaste ningún movimiento"
          description="Subí el PDF de tu resumen bancario para empezar a ver tus gastos organizados por categoría."
          action={<Button onClick={onGoToUpload}>Cargar mi primer resumen</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Panel financiero
        </h1>
        <MonthFilter months={months} value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {bankBalanceSnapshot && <RealBalanceCard snapshot={bankBalanceSnapshot} />}
      <SummaryCards
        income={income}
        expenses={expenses}
        manualIncome={manualIncome}
        transfersNet={transfersNet}
        balance={balance}
      />
      {selectedMonth !== "all" && (
        <BudgetBreakdownCard
          month={selectedMonth}
          breakdown={budgetBreakdown}
          budgetPct={budgetPct}
          onBudgetPctChange={setBudgetPct}
          targetUsd={savingsTargetUsd}
          rateArsPerUsd={exchangeRateByMonth[selectedMonth]}
          onTargetChange={setSavingsTargetUsd}
          onRateChange={(rate) => setExchangeRate(selectedMonth, rate)}
        />
      )}
      <BalanceCheck balance={bankBalance} earliestDate={earliestDate} />
      <CategoryDonutChart totals={totals} onSelectCategory={setModalCategory} />
      <MonthlyTrendChart transactions={nettedAll} />

      {modalCategory && (
        <CategoryDetailModal
          category={modalCategory}
          items={getCategoryModalItems(netted, modalCategory)}
          onClose={() => setModalCategory(null)}
        />
      )}
    </div>
  );
}
