import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_META, CATEGORY_ORDER, type Category } from "../types";
import { formatCurrency, formatPercent } from "../lib/format";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { PieChart as PieIcon } from "lucide-react";

export function CategoryDonutChart({ totals }: { totals: Record<Category, number> }) {
  const total = CATEGORY_ORDER.reduce((sum, c) => sum + totals[c], 0);
  const data = CATEGORY_ORDER.filter((c) => totals[c] > 0).map((c) => ({
    key: c,
    name: CATEGORY_META[c].label,
    value: totals[c],
    color: CATEGORY_META[c].colorVar,
  }));

  if (total === 0) {
    return (
      <Card>
        <EmptyState
          icon={<PieIcon size={22} />}
          title="Todavía no hay gastos categorizados"
          description="Cargá un resumen bancario para ver la distribución de tus gastos por categoría."
        />
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Distribución de gastos por categoría
      </p>
      <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
        Total del período: {formatCurrency(total)}
      </p>
      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="var(--surface-1)"
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={
                  ((value: number, _name: string, item: { payload: { name: string } }) => [
                    formatCurrency(value),
                    item.payload.name,
                  ]) as never
                }
                contentStyle={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-2.5">
          {data
            .sort((a, b) => b.value - a.value)
            .map((entry) => (
              <li key={entry.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 min-w-0" style={{ color: "var(--text-primary)" }}>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: entry.color }}
                  />
                  <span className="truncate">{entry.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span style={{ color: "var(--text-secondary)" }}>{formatCurrency(entry.value)}</span>
                  <span
                    className="w-12 text-right text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {formatPercent(entry.value / total)}
                  </span>
                </span>
              </li>
            ))}
        </ul>
      </div>
    </Card>
  );
}
