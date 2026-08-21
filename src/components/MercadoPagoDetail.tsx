import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Transaction } from "../types";
import { formatCurrency } from "../lib/format";
import { useFinanceStore } from "../store/useFinanceStore";

export function MercadoPagoDetail({ transaction }: { transaction: Transaction }) {
  const addMpDetail = useFinanceStore((s) => s.addMpDetail);
  const removeMpDetail = useFinanceStore((s) => s.removeMpDetail);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  const details = transaction.mpDetails ?? [];
  const total = Math.abs(transaction.amount);
  const assigned = details.reduce((sum, d) => sum + d.amount, 0);
  const remaining = total - assigned;

  function submit() {
    const value = Number(amount);
    if (!desc.trim() || !value || value <= 0) return;
    addMpDetail(transaction.id, { description: desc.trim(), amount: value });
    setDesc("");
    setAmount("");
  }

  return (
    <div
      className="mx-4 mb-3 rounded-xl border px-4 py-3"
      style={{ borderColor: "var(--border)", background: "var(--page-bg)" }}
    >
      <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
        Esta transferencia fue a Mercado Pago. Anotá manualmente en qué se usó esa plata — cuando
        conectemos la cuenta de Mercado Pago esto se va a completar solo.
      </p>

      {details.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {details.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
              <span style={{ color: "var(--text-primary)" }}>{d.description}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {formatCurrency(d.amount)}
                </span>
                <button
                  onClick={() => removeMpDetail(transaction.id, d.id)}
                  className="cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="¿En qué se gastó? (ej: supermercado)"
          className="min-w-[180px] flex-1 rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monto"
          className="w-28 rounded-lg border bg-transparent px-2.5 py-1.5 text-sm tabular-nums"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          onClick={submit}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium cursor-pointer"
          style={{ background: "var(--accent)", color: "white" }}
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      <p className="mt-2 text-xs tabular-nums" style={{ color: remaining < -0.005 ? "var(--status-critical)" : "var(--text-muted)" }}>
        Asignado {formatCurrency(assigned)} de {formatCurrency(total)}
        {remaining > 0.005 && ` · sin asignar ${formatCurrency(remaining)}`}
        {remaining < -0.005 && " · asignaste más de lo que se transfirió"}
      </p>
    </div>
  );
}
