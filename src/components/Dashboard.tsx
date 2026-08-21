import { useMemo, useState } from "react";
import { useFinanceStore, monthKey, totalsByCategory } from "../store/useFinanceStore";
import { SummaryCards } from "./SummaryCards";
import { BalanceCheck } from "./BalanceCheck";
import { RealBalanceCard } from "./RealBalanceCard";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { MonthFilter } from "./MonthFilter";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { UploadCloud } from "lucide-react";
import { Button } from "./ui/Button";

export function Dashboard({ onGoToUpload }: { onGoToUpload: () => void }) {
  const transactions = useFinanceStore((s) => s.transactions);
  const incomeEntries = useFinanceStore((s) => s.incomeEntries);
  const bankBalanceSnapshot = useFinanceStore((s) => s.bankBalanceSnapshot);
  const [selectedMonth, setSelectedMonth] = useState<string | "all">("all");

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

  const detectedIncome = useMemo(
    () => filtered.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    [filtered],
  );

  // El Balance SIEMPRE se calcula con los créditos detectados en los propios
  // movimientos, nunca con el ingreso cargado a mano — si el sueldo declarado
  // no incluye TODOS los créditos reales (transferencias recibidas, reintegros,
  // etc.), reemplazarlo rompe la cuenta contra el banco. El ingreso manual se
  // muestra aparte, solo como referencia informativa.
  const income = detectedIncome;

  const totals = useMemo(() => totalsByCategory(filtered), [filtered]);
  const expenses = useMemo(() => Object.values(totals).reduce((a, b) => a + b, 0), [totals]);
  const balance = income - expenses;

  const earliestDate = useMemo(
    () => (filtered.length === 0 ? null : filtered.reduce((min, t) => (t.date < min ? t.date : min), filtered[0].date)),
    [filtered],
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
      <SummaryCards income={income} expenses={expenses} manualIncome={manualIncome} />
      <BalanceCheck balance={balance} earliestDate={earliestDate} />
      <CategoryDonutChart totals={totals} />
      <MonthlyTrendChart transactions={transactions} />
    </div>
  );
}
