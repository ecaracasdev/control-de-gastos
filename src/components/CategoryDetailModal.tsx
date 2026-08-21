import { Modal } from "./ui/Modal";
import { CATEGORY_META, type Category, type Transaction } from "../types";
import { formatCurrency, formatDate } from "../lib/format";

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
