import { Landmark } from "lucide-react";
import { Card } from "./ui/Card";
import { formatCurrency, formatDate } from "../lib/format";
import type { BankBalanceSnapshot } from "../store/useFinanceStore";

export function RealBalanceCard({ snapshot }: { snapshot: BankBalanceSnapshot }) {
  return (
    <Card
      className="flex flex-wrap items-center gap-3"
      style={{
        borderColor: "var(--series-transferencias)",
        background: "color-mix(in srgb, var(--series-transferencias) 6%, var(--surface-1))",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: "color-mix(in srgb, var(--series-transferencias) 18%, transparent)" }}
      >
        <Landmark size={18} style={{ color: "var(--series-transferencias)" }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Saldo real según tu banco (al {formatDate(snapshot.date)})
        </p>
        <p className="text-2xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(snapshot.amount)}
        </p>
      </div>
    </Card>
  );
}
