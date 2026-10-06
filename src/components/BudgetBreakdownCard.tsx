import { Card } from "./ui/Card";
import type { BudgetBreakdown, BudgetBucketKey } from "../lib/savingsPlan";
import { formatCurrency, formatMonthLabel } from "../lib/format";

const BUCKET_COLOR: Record<BudgetBucketKey, string> = {
  fijos: "var(--series-servicios-suscripciones)",
  comida: "var(--series-comida)",
  transporte: "var(--series-transporte)",
  tarjeta: "var(--series-compras)",
  personas_otros: "var(--series-otros)",
  gustos: "var(--series-gustos-personales)",
};

const SAVINGS_COLOR = "var(--status-good)";

interface Row {
  key: string;
  label: string;
  color: string;
  budget: number;
  real: number;
  /** positivo = te sobró, negativo = te pasaste */
  diff: number;
  editableKey?: BudgetBucketKey;
  pct?: number;
}

export function BudgetBreakdownCard({
  month,
  breakdown,
  budgetPct,
  targetUsd,
  rateArsPerUsd,
  onBudgetPctChange,
  onTargetChange,
  onRateChange,
}: {
  month: string;
  breakdown: BudgetBreakdown | null;
  budgetPct: Record<BudgetBucketKey, number>;
  targetUsd: number;
  rateArsPerUsd: number | undefined;
  onBudgetPctChange: (key: BudgetBucketKey, pct: number) => void;
  onTargetChange: (usd: number) => void;
  onRateChange: (rate: number | null) => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Presupuesto vs. gasto real · {formatMonthLabel(month)}
        </p>
        <div className="flex gap-2">
          <NumberField label="Objetivo USD" value={targetUsd} onChange={(v) => onTargetChange(v)} width="w-24" />
          <NumberField
            label="Dólar del mes"
            value={rateArsPerUsd}
            placeholder="ej. 1400"
            onChange={(v) => onRateChange(v > 0 ? v : null)}
            width="w-28"
          />
        </div>
      </div>

      {!breakdown ? (
        <p className="mt-5 text-sm" style={{ color: "var(--text-secondary)" }}>
          Para ver el presupuesto necesitás tu ingreso neto del mes (pestaña Ingresos) y el dólar del mes.
        </p>
      ) : (
        <Body b={breakdown} budgetPct={budgetPct} onBudgetPctChange={onBudgetPctChange} />
      )}
    </Card>
  );
}

function Body({
  b,
  budgetPct,
  onBudgetPctChange,
}: {
  b: BudgetBreakdown;
  budgetPct: Record<BudgetBucketKey, number>;
  onBudgetPctChange: (key: BudgetBucketKey, pct: number) => void;
}) {
  const gustos = b.buckets.find((x) => x.key === "gustos")!;
  const rows: Row[] = [
    ...b.buckets.map((x) => ({
      key: x.key,
      label: x.label,
      color: BUCKET_COLOR[x.key],
      budget: x.budget,
      real: x.spent,
      diff: x.diff,
      editableKey: x.key,
      pct: budgetPct[x.key],
    })),
    {
      key: "ahorro",
      label: "Ahorro",
      color: SAVINGS_COLOR,
      budget: b.targetArs,
      real: b.saved,
      diff: b.saved - b.targetArs,
    },
  ];
  const scale = Math.max(1, ...rows.map((r) => Math.max(r.budget, r.real, 0)));
  const barWidth = (v: number) => `${(Math.max(v, 0) / scale) * 100}%`;

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tu mesada para gustos personales</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(gustos.budget)}
        </p>
        <p className="mt-1 text-sm" style={{ color: gustos.diff >= 0 ? "var(--status-good)" : "var(--status-critical)" }}>
          Gastaste {formatCurrency(gustos.spent)} · {gustos.diff >= 0 ? `te quedan ${formatCurrency(gustos.diff)}` : `te pasaste ${formatCurrency(-gustos.diff)}`}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm" style={{ background: "var(--text-secondary)" }} /> Presupuesto</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm opacity-40" style={{ background: "var(--text-secondary)" }} /> Gasto real</span>
      </div>

      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                <span className="truncate">{r.label}</span>
              </span>
              <span
                className="shrink-0 text-xs font-medium tabular-nums"
                style={{ color: r.diff >= 0 ? "var(--status-good)" : "var(--status-critical)" }}
              >
                {r.diff >= 0 ? `te sobró ${formatCurrency(r.diff)}` : `te pasaste ${formatCurrency(-r.diff)}`}
              </span>
            </div>
            <div className="space-y-1">
              <Bar width={barWidth(r.budget)} color={r.color} opacity={1} label={formatCurrency(r.budget)} />
              <Bar width={barWidth(r.real)} color={r.color} opacity={0.4} label={formatCurrency(r.real)} />
            </div>
            {r.editableKey && (
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>presupuesto</span>
                <input
                  type="number"
                  min={0}
                  value={r.pct ?? 0}
                  onChange={(e) => onBudgetPctChange(r.editableKey!, Number(e.target.value) || 0)}
                  className="w-16 rounded-md border bg-transparent px-1.5 py-0.5 tabular-nums"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <span>% del ingreso</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="text-xs" style={{ color: b.planPct > 100 ? "var(--status-critical)" : "var(--text-muted)" }}>
        Tu plan suma {b.planPct.toFixed(1)}% del ingreso (bloques + ahorro){b.planPct > 100 ? ". Pasate de 100%: bajá algún porcentaje." : "."}
      </p>
    </div>
  );
}

function Bar({ width, color, opacity, label }: { width: string; color: string; opacity: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 overflow-hidden rounded-sm" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-sm" style={{ width, background: color, opacity }} />
      </div>
      <span className="w-28 shrink-0 text-right text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

function NumberField({
  label,
  value,
  placeholder,
  onChange,
  width,
}: {
  label: string;
  value: number | undefined;
  placeholder?: string;
  onChange: (v: number) => void;
  width: string;
}) {
  return (
    <label className="text-xs" style={{ color: "var(--text-muted)" }}>
      {label}
      <input
        type="number"
        min={0}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`mt-1 block ${width} rounded-lg border bg-transparent px-2 py-1 text-sm tabular-nums`}
        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
      />
    </label>
  );
}
