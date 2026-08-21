import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORY_META, CATEGORY_ORDER, type Transaction } from "../types";
import { formatCurrency, formatMonthLabel } from "../lib/format";
import { monthKey } from "../store/useFinanceStore";
import { Card } from "./ui/Card";

export function MonthlyTrendChart({ transactions }: { transactions: Transaction[] }) {
  const byMonth = new Map<string, Record<string, number>>();

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const key = monthKey(t.date);
    if (!byMonth.has(key)) {
      byMonth.set(
        key,
        Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0])) as Record<string, number>,
      );
    }
    byMonth.get(key)![t.category] += Math.abs(t.amount);
  }

  const months = [...byMonth.keys()].sort();
  if (months.length < 2) return null;

  const data = months.map((m) => ({ month: formatMonthLabel(m).split(" ")[0], ...byMonth.get(m) }));

  return (
    <Card>
      <p className="mb-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Evolución de gastos mes a mes
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v) => formatCurrency(v).replace(/,00$/, "")}
            />
            <Tooltip
              formatter={((value: number, name: string) => [formatCurrency(value), name]) as never}
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
            {CATEGORY_ORDER.map((c) => (
              <Bar
                key={c}
                dataKey={c}
                name={CATEGORY_META[c].label}
                stackId="gasto"
                fill={CATEGORY_META[c].colorVar}
                radius={c === CATEGORY_ORDER[CATEGORY_ORDER.length - 1] ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
