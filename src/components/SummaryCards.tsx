import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, PiggyBank, Scale } from "lucide-react";
import { Card } from "./ui/Card";
import { formatCurrency, formatPercent } from "../lib/format";

export function SummaryCards({
  income,
  expenses,
  manualIncome,
  transfersNet,
  balance,
}: {
  /** Ingresos detectados, sin contar transferencias entre personas (esas van en transfersNet) */
  income: number;
  /** Gastos detectados, sin contar transferencias entre personas */
  expenses: number;
  /** Ingreso cargado a mano en la pestaña Ingresos — solo informativo, no se usa para el Balance */
  manualIncome: number;
  /** Neto de transferencias enviadas/recibidas (no Mercado Pago): positivo si recibiste más de lo que mandaste */
  transfersNet: number;
  balance: number;
}) {
  const savingsRate = income > 0 ? balance / income : null;

  const items = [
    {
      label: "Ingresos netos",
      caption:
        income === 0
          ? undefined
          : manualIncome > 0
            ? `detectados en tus movimientos · declaraste ${formatCurrency(manualIncome)} a mano`
            : "detectados en tus movimientos, sin contar transferencias",
      value: formatCurrency(income),
      icon: ArrowUpRight,
      color: "var(--status-good)",
    },
    {
      label: "Gastos del período",
      caption: "sin contar transferencias",
      value: formatCurrency(expenses),
      icon: ArrowDownRight,
      color: "var(--status-critical)",
    },
    {
      label: "Transferencias (neto)",
      caption:
        transfersNet === 0
          ? "lo que mandaste y lo que recibiste se cancela"
          : transfersNet > 0
            ? "recibiste más de lo que mandaste"
            : "mandaste más de lo que recibiste",
      value: formatCurrency(transfersNet),
      icon: ArrowLeftRight,
      color: transfersNet >= 0 ? "var(--status-good)" : "var(--status-critical)",
    },
    {
      label: "Balance",
      caption: "de este período, no el saldo actual de tu cuenta",
      value: formatCurrency(balance),
      icon: Scale,
      color: balance >= 0 ? "var(--status-good)" : "var(--status-critical)",
    },
    {
      label: "Tasa de ahorro",
      value: savingsRate === null ? "Cargá tus ingresos" : formatPercent(savingsRate),
      icon: PiggyBank,
      color: "var(--accent)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ label, caption, value, icon: Icon, color }) => (
        <Card key={label} className="!p-4">
          <div className="mb-2 flex items-center gap-2">
            <Icon size={15} style={{ color }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
          </div>
          <p className="text-lg font-semibold tabular-nums truncate" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
          {caption && (
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
              {caption}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
