import { useMemo, useState } from "react";
import { useFinanceStore, monthKey, totalsByCategory } from "../store/useFinanceStore";
import { findReconciledInternalTransferIds } from "../lib/reconciliation";
import { SummaryCards } from "./SummaryCards";
import { BalanceCheck } from "./BalanceCheck";
import { RealBalanceCard } from "./RealBalanceCard";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { CategoryDetailModal, type CategoryDetailItem } from "./CategoryDetailModal";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { MonthFilter } from "./MonthFilter";
import { SavingsPlanCard } from "./SavingsPlanCard";
import { spentArsForPlan } from "../lib/savingsPlan";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { UploadCloud } from "lucide-react";
import { Button } from "./ui/Button";
import type { Category, Transaction } from "../types";
import type { CreditCardStatement } from "../lib/creditcard";

function getCategoryModalItems(
  transactions: Transaction[],
  creditCardStatements: CreditCardStatement[],
  category: Category,
): CategoryDetailItem[] {
  const catTxns = transactions.filter((t) => t.category === category && t.amount < 0);
  if (category !== "pago_tarjeta_credito") return catTxns;

  // Para "pago de tarjeta de crédito" mostramos el detalle de consumos si lo
  // cargaste (mucho más útil que ver solo el pago en bloque); si algún pago
  // todavía no tiene resumen vinculado, esa línea se muestra tal cual para
  // no esconder nada.
  const items: CategoryDetailItem[] = [];
  for (const t of catTxns) {
    const statement = creditCardStatements.find((s) => s.linkedTransactionId === t.id);
    if (statement) items.push(...statement.items);
    else items.push(t);
  }
  return items;
}

export function Dashboard({ onGoToUpload }: { onGoToUpload: () => void }) {
  const transactions = useFinanceStore((s) => s.transactions);
  const incomeEntries = useFinanceStore((s) => s.incomeEntries);
  const bankBalanceSnapshot = useFinanceStore((s) => s.bankBalanceSnapshot);
  const creditCardStatements = useFinanceStore((s) => s.creditCardStatements);
  const savingsTargetUsd = useFinanceStore((s) => s.savingsTargetUsd);
  const setSavingsTargetUsd = useFinanceStore((s) => s.setSavingsTargetUsd);
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
  const netted = useMemo(() => filtered.filter((t) => !reconciledIds.has(t.id)), [filtered, reconciledIds]);
  const nettedAll = useMemo(
    () => transactions.filter((t) => !reconciledIds.has(t.id)),
    [transactions, reconciledIds],
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
  const bankOnly = useMemo(() => filtered.filter((t) => t.bank !== "mercadopago"), [filtered]);
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
        <SavingsPlanCard
          month={selectedMonth}
          income={manualIncome}
          spent={spentArsForPlan(netted)}
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
          items={getCategoryModalItems(netted, creditCardStatements, modalCategory)}
          onClose={() => setModalCategory(null)}
        />
      )}
    </div>
  );
}
