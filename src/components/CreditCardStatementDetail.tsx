import { Trash2 } from "lucide-react";
import type { CreditCardStatement } from "../lib/creditcard";
import { formatCurrency, formatDate } from "../lib/format";
import { useFinanceStore } from "../store/useFinanceStore";

export function CreditCardStatementDetail({ statement }: { statement: CreditCardStatement }) {
  const deleteCreditCardStatement = useFinanceStore((s) => s.deleteCreditCardStatement);

  return (
    <div
      className="mx-4 mb-3 rounded-xl border px-4 py-3"
      style={{ borderColor: "var(--border)", background: "var(--page-bg)" }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Detalle de consumos de {statement.cardLabel}
          {statement.closingDate && ` · cierre ${formatDate(statement.closingDate)}`}
        </p>
        <button
          onClick={() => deleteCreditCardStatement(statement.id)}
          className="flex shrink-0 items-center gap-1 text-xs cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          title="Eliminar este detalle"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <ul className="space-y-1.5">
        {statement.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate" style={{ color: "var(--text-primary)" }}>
              {formatDate(item.date)} · {item.description}
              {item.installment && (
                <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  cuota {item.installment.current}/{item.installment.total}
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums" style={{ color: "var(--status-critical)" }}>
              {formatCurrency(item.amount, item.currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
