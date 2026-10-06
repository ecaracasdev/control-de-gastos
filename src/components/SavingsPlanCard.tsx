import { Card } from "./ui/Card";
import { computeSavingsPlan } from "../lib/savingsPlan";
import { formatCurrency, formatMonthLabel } from "../lib/format";

export function SavingsPlanCard({
  month,
  income,
  spent,
  targetUsd,
  rateArsPerUsd,
  onTargetChange,
  onRateChange,
}: {
  month: string;
  income: number;
  spent: number;
  targetUsd: number;
  rateArsPerUsd: number | undefined;
  onTargetChange: (usd: number) => void;
  onRateChange: (rate: number | null) => void;
}) {
  const plan = computeSavingsPlan({
    income,
    rateArsPerUsd: rateArsPerUsd ?? 0,
    targetUsd,
    spent,
  });

  return (
    <Card>
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        ¿Cuánto podés gastar para ahorrar? · {formatMonthLabel(month)}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs" style={{ color: "var(--text-muted)" }}>
          Objetivo de ahorro (USD)
          <input
            type="number"
            min={0}
            value={targetUsd}
            onChange={(e) => onTargetChange(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm tabular-nums"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </label>
        <label className="text-xs" style={{ color: "var(--text-muted)" }}>
          Tipo de cambio de este mes (pesos por USD)
          <input
            type="number"
            min={0}
            placeholder="ej. 1400"
            value={rateArsPerUsd ?? ""}
            onChange={(e) => {
              const v = Number(e.target.value);
              onRateChange(e.target.value === "" || !(v > 0) ? null : v);
            }}
            className="mt-1 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm tabular-nums"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </label>
      </div>

      {!plan ? (
        <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          Cargá el tipo de cambio del mes para calcularlo. {income === 0 && "También te falta el ingreso neto del mes (pestaña Ingresos)."}
        </p>
      ) : (
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Ingreso neto del mes" value={formatCurrency(income)} />
          <Row label={`Ahorro objetivo (${targetUsd} USD)`} value={formatCurrency(plan.targetArs)} />
          <Row label="Gasto máximo para cumplirlo" value={formatCurrency(plan.maxSpend)} strong />
          <Row label="Gastaste este mes" value={formatCurrency(spent)} />
          <Row
            label={plan.remainingBudget >= 0 ? "Te quedan para gastar" : "Te pasaste del máximo"}
            value={formatCurrency(plan.remainingBudget)}
            color={plan.remainingBudget >= 0 ? "var(--status-good)" : "var(--status-critical)"}
            strong
          />
          <p className="pt-1 text-xs" style={{ color: plan.onTrack ? "var(--status-good)" : "var(--status-critical)" }}>
            {plan.onTrack
              ? `Vas bien: ahorraste ${formatCurrency(plan.actualSaving)} este mes.`
              : `Te faltan ${formatCurrency(plan.targetArs - plan.actualSaving)} para tu objetivo este mes.`}
          </p>
        </dl>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt style={{ color: "var(--text-secondary)" }}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : ""}`} style={{ color: color ?? "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}
