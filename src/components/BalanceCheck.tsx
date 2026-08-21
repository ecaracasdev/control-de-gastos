import { useState } from "react";
import { Calculator, Pencil, X } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { formatCurrency, formatDate } from "../lib/format";
import { useFinanceStore } from "../store/useFinanceStore";

export function BalanceCheck({ balance, earliestDate }: { balance: number; earliestDate: string | null }) {
  const openingBalance = useFinanceStore((s) => s.openingBalance);
  const setOpeningBalance = useFinanceStore((s) => s.setOpeningBalance);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function save() {
    const value = Number(draft);
    if (Number.isNaN(value)) return;
    setOpeningBalance(value);
    setEditing(false);
  }

  if (openingBalance !== null && !editing) {
    const estimated = openingBalance + balance;
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 !py-3">
        <div className="flex items-center gap-2 text-sm">
          <Calculator size={15} style={{ color: "var(--text-muted)" }} />
          <span style={{ color: "var(--text-secondary)" }}>
            Saldo estimado a hoy ({formatCurrency(openingBalance)} inicial + balance del período): {" "}
          </span>
          <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(estimated)}
          </span>
          <span style={{ color: "var(--text-muted)" }}>— compará este número con el saldo real de tu banco</span>
        </div>
        <button
          onClick={() => {
            setDraft(String(openingBalance));
            setEditing(true);
          }}
          className="flex items-center gap-1 text-xs cursor-pointer"
          style={{ color: "var(--text-muted)" }}
        >
          <Pencil size={12} /> editar
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-wrap items-center gap-2 !py-3 text-sm">
      <Calculator size={15} style={{ color: "var(--text-muted)" }} className="shrink-0" />
      <span style={{ color: "var(--text-secondary)" }}>
        ¿Querés comprobar que el balance de este período cierra con tu banco? Cargá el saldo que tenías
        {earliestDate ? ` antes del ${formatDate(earliestDate)}` : " antes de tu primer movimiento cargado"}:
      </span>
      <input
        type="number"
        step="0.01"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Saldo inicial"
        className="w-32 rounded-lg border bg-transparent px-2 py-1 text-sm tabular-nums"
        style={{ borderColor: "var(--border)" }}
      />
      <Button onClick={save} disabled={draft.trim() === ""}>
        Comprobar
      </Button>
      {editing && (
        <button onClick={() => setEditing(false)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}>
          <X size={14} />
        </button>
      )}
    </Card>
  );
}
