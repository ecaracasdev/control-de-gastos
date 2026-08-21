import { formatMonthLabel } from "../lib/format";

export function MonthFilter({
  months,
  value,
  onChange,
}: {
  months: string[];
  value: string | "all";
  onChange: (value: string | "all") => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border bg-transparent px-3 py-2 text-sm font-medium"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
    >
      <option value="all">Todos los meses</option>
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonthLabel(m)}
        </option>
      ))}
    </select>
  );
}
