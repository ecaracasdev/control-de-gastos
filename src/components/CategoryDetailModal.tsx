import { Modal } from "./ui/Modal";
import { CATEGORY_META, SUBCATEGORY_META, type Category, type Subcategory, type Transaction } from "../types";
import { formatCurrency, formatDate, formatPercent } from "../lib/format";

interface SubcategoryBreakdown {
  key: Subcategory | "sin_subcategoria";
  label: string;
  amount: number;
}

export function CategoryDetailModal({
  category,
  transactions,
  onClose,
}: {
  category: Category;
  transactions: Transaction[];
  onClose: () => void;
}) {
  const meta = CATEGORY_META[category];
  const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const sorted = [...transactions].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  const bySubcategory = new Map<string, number>();
  for (const t of transactions) {
    const key = t.subcategory ?? "sin_subcategoria";
    bySubcategory.set(key, (bySubcategory.get(key) ?? 0) + Math.abs(t.amount));
  }
  const subcategoryBreakdown: SubcategoryBreakdown[] =
    meta.subcategories.length === 0
      ? []
      : [...meta.subcategories, "sin_subcategoria" as const]
          .map((key) => ({
            key,
            label: key === "sin_subcategoria" ? "Sin subcategoría" : SUBCATEGORY_META[key].label,
            amount: bySubcategory.get(key) ?? 0,
          }))
          .filter((s) => s.amount > 0)
          .sort((a, b) => b.amount - a.amount);

  return (
    <Modal
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.colorVar }} />
          <span>{meta.label}</span>
          <span style={{ color: "var(--text-muted)" }} className="font-normal">
            · {formatCurrency(total)} · {transactions.length} movimiento{transactions.length === 1 ? "" : "s"}
          </span>
        </div>
      }
    >
      {subcategoryBreakdown.length > 0 && (
        <div className="space-y-3 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Por subcategoría
          </p>
          {subcategoryBreakdown.map((s) => {
            const pct = total > 0 ? s.amount / total : 0;
            return (
              <div key={s.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                  <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {formatCurrency(s.amount)} · {formatPercent(pct)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(pct * 100, 2)}%`, background: meta.colorVar }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {sorted.length === 0 ? (
        <p className="px-5 py-6 text-sm" style={{ color: "var(--text-muted)" }}>
          No hay movimientos en esta categoría para el período seleccionado.
        </p>
      ) : (
        <ul>
          {sorted.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 border-b px-5 py-3 last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {t.description}
                </p>
                <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {formatDate(t.date)}
                  {t.installment && ` · cuota ${t.installment.current}/${t.installment.total}`}
                </p>
              </div>
              <span
                className="shrink-0 text-sm font-medium tabular-nums"
                style={{ color: t.amount < 0 ? "var(--status-critical)" : "var(--status-good)" }}
              >
                {formatCurrency(t.amount, t.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
