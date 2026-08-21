import { useState } from "react";
import { Trash2, Wallet } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { useFinanceStore } from "../store/useFinanceStore";
import { formatCurrency, formatMonthLabel } from "../lib/format";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function IncomeManager() {
  const incomeEntries = useFinanceStore((s) => s.incomeEntries);
  const upsertIncome = useFinanceStore((s) => s.upsertIncome);
  const removeIncome = useFinanceStore((s) => s.removeIncome);

  const [month, setMonth] = useState(currentMonth());
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("Sueldo neto");

  function submit() {
    const value = Number(amount);
    if (!value || value <= 0) return;
    upsertIncome({ month, amount: value, label: label || "Ingreso" });
    setAmount("");
  }

  const sorted = [...incomeEntries].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Tus ingresos netos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Cargá lo que cobrás por mes (después de impuestos y descuentos), como referencia.
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Esto es solo informativo — el Balance del Panel siempre se calcula con los créditos que
          aparecen en tus movimientos importados, no con lo que cargues acá, para que nunca deje de
          coincidir con tu banco.
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm">
            <span className="mb-1 block" style={{ color: "var(--text-secondary)" }}>Mes</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-lg border bg-transparent px-2.5 py-2"
              style={{ borderColor: "var(--border)" }}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block" style={{ color: "var(--text-secondary)" }}>Monto neto</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border bg-transparent px-2.5 py-2 tabular-nums"
              style={{ borderColor: "var(--border)" }}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block" style={{ color: "var(--text-secondary)" }}>Concepto (opcional)</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border bg-transparent px-2.5 py-2"
              style={{ borderColor: "var(--border)" }}
            />
          </label>
          <div className="flex items-end">
            <Button onClick={submit} className="w-full sm:w-auto">
              Guardar
            </Button>
          </div>
        </div>
      </Card>

      <Card padded={false}>
        {sorted.length === 0 ? (
          <EmptyState icon={<Wallet size={20} />} title="Sin ingresos cargados todavía" />
        ) : (
          <ul>
            {sorted.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatMonthLabel(entry.month)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{entry.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium" style={{ color: "var(--status-good)" }}>
                    {formatCurrency(entry.amount)}
                  </span>
                  <button
                    onClick={() => removeIncome(entry.id)}
                    className="cursor-pointer"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
