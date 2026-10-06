import { Card } from "./ui/Card";
import type { BudgetBreakdown, BudgetBucketKey } from "../lib/savingsPlan";
import { formatCurrency, formatMonthLabel, formatPercent } from "../lib/format";

const BUCKET_COLOR: Record<BudgetBucketKey, string> = {
  fijos: "var(--series-servicios-suscripciones)",
  comida: "var(--series-comida)",
  transporte: "var(--series-transporte)",
  tarjeta: "var(--series-compras)",
  personas_otros: "var(--series-otros)",
};

export function BudgetBreakdownCard({
  month,
  breakdown,
  targetUsd,
  rateArsPerUsd,
  onTargetChange,
  onRateChange,
}: {
  month: string;
  breakdown: BudgetBreakdown | null;
  targetUsd: number;
  rateArsPerUsd: number | undefined;
  onTargetChange: (usd: number) => void;
  onRateChange: (rate: number | null) => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Tu mes en una mirada · {formatMonthLabel(month)}
        </p>
        <div className="flex gap-2">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>
            Objetivo USD
            <input
              type="number"
              min={0}
              value={targetUsd}
              onChange={(e) => onTargetChange(Number(e.target.value) || 0)}
              className="mt-1 block w-24 rounded-lg border bg-transparent px-2 py-1 text-sm tabular-nums"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </label>
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>
            Dólar del mes
            <input
              type="number"
              min={0}
              placeholder="ej. 1400"
              value={rateArsPerUsd ?? ""}
              onChange={(e) => {
                const v = Number(e.target.value);
                onRateChange(e.target.value === "" || !(v > 0) ? null : v);
              }}
              className="mt-1 block w-28 rounded-lg border bg-transparent px-2 py-1 text-sm tabular-nums"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </label>
        </div>
      </div>

      {!breakdown ? (
        <p className="mt-5 text-sm" style={{ color: "var(--text-secondary)" }}>
          Para ver el desglose necesitás tu ingreso neto del mes (pestaña Ingresos) y el dólar del mes.
        </p>
      ) : (
        <Breakdown b={breakdown} targetUsd={targetUsd} />
      )}
    </Card>
  );
}

function Breakdown({ b, targetUsd }: { b: BudgetBreakdown; targetUsd: number }) {
  const total = Math.max(b.income, b.spent, 1);
  const segments = [
    ...b.buckets.filter((x) => x.amount > 0).map((x) => ({ key: x.key, color: BUCKET_COLOR[x.key], amount: x.amount, label: x.label })),
    ...(b.saved > 0 ? [{ key: "ahorro", color: "var(--status-good)", amount: b.saved, label: "Lo que te queda" }] : []),
  ];
  const incomeMarkerPct = (b.income / total) * 100;
  const spentOverIncome = b.spent > b.income;
  const headline = b.income <= 0
    ? "Cargá tu ingreso neto de este mes para ver cómo se reparte."
    : spentOverIncome
      ? `Gastaste ${formatPercent(b.spent / b.income)} de tu ingreso: te pasaste por ${formatCurrency(b.spent - b.income)}.`
      : `Gastaste ${formatPercent(b.spent / b.income)} de tu ingreso y te quedó ${formatPercent(b.saved / b.income)}.`;

  return (
    <div className="mt-4 space-y-5">
      <p className="text-sm" style={{ color: "var(--text-primary)" }}>{headline}</p>

      <div>
        <div className="relative flex h-7 w-full overflow-hidden rounded-lg" style={{ background: "var(--border)" }}>
          {segments.map((s) => (
            <div
              key={s.key}
              title={`${s.label}: ${formatCurrency(s.amount)}`}
              style={{ width: `${(s.amount / total) * 100}%`, background: s.color }}
            />
          ))}
          {spentOverIncome && (
            <div className="absolute inset-y-0 w-0.5" style={{ left: `${incomeMarkerPct}%`, background: "var(--text-primary)" }} />
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
          <span>0</span>
          <span>Ingreso {formatCurrency(b.income)}</span>
        </div>
      </div>

      <ul className="space-y-2.5">
        {b.buckets.filter((x) => x.amount > 0).map((x) => (
          <li key={x.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BUCKET_COLOR[x.key] }} />
              <span className="truncate">{x.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 tabular-nums">
              <span style={{ color: "var(--text-secondary)" }}>{formatCurrency(x.amount)}</span>
              <span className="w-14 text-right text-xs" style={{ color: "var(--text-muted)" }}>{formatPercent(x.pctOfIncome)}</span>
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 border-t pt-2.5 text-sm font-medium" style={{ borderColor: "var(--border)" }}>
          <span style={{ color: "var(--text-primary)" }}>{b.saved >= 0 ? "Te queda" : "Te pasaste"}</span>
          <span className="tabular-nums" style={{ color: b.saved >= 0 ? "var(--status-good)" : "var(--status-critical)" }}>
            {formatCurrency(b.saved)}
          </span>
        </li>
      </ul>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Fijos + comida</p>
          <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {formatPercent(b.essentialsPct)} de tu ingreso
          </p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {b.freeAfterTarget >= 0
              ? `Libre para vos sin tocar ahorros (y llegar a USD ${targetUsd})`
              : `Para llegar a USD ${targetUsd} tenés que gastar ${formatCurrency(-b.freeAfterTarget)} menos`}
          </p>
          <p
            className="mt-1 text-lg font-semibold tabular-nums"
            style={{ color: b.freeAfterTarget >= 0 ? "var(--status-good)" : "var(--status-critical)" }}
          >
            {formatCurrency(b.freeAfterTarget >= 0 ? b.freeAfterTarget : -b.freeAfterTarget)}
          </p>
        </div>
      </div>
    </div>
  );
}
