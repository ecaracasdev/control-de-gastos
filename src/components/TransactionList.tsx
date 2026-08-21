import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, Search, Trash2, Wallet } from "lucide-react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { MonthFilter } from "./MonthFilter";
import { CATEGORY_META, CATEGORY_ORDER, type Category } from "../types";
import { formatCurrency, formatDate } from "../lib/format";
import { monthKey, useFinanceStore } from "../store/useFinanceStore";
import { MercadoPagoDetail } from "./MercadoPagoDetail";
import { ImportedFiles } from "./ImportedFiles";

function exportCsv(rows: { date: string; description: string; category: Category; amount: number }[]) {
  const header = "Fecha,Descripcion,Categoria,Monto\n";
  const body = rows
    .map(
      (r) =>
        `${r.date},"${r.description.replace(/"/g, '""')}",${CATEGORY_META[r.category].label},${r.amount}`,
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "movimientos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type FilterKey = Category | "ingreso";

export function TransactionList() {
  const transactions = useFinanceStore((s) => s.transactions);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string | "all">("all");
  const [selectedFilters, setSelectedFilters] = useState<Set<FilterKey>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const months = useMemo(
    () => [...new Set(transactions.map((t) => monthKey(t.date)))].sort().reverse(),
    [transactions],
  );

  function toggleFilter(c: FilterKey) {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => selectedMonth === "all" || monthKey(t.date) === selectedMonth)
      .filter((t) => {
        if (selectedFilters.size === 0) return true;
        // Un ingreso (monto >= 0) solo se ve si el filtro "Ingresos" está
        // activo, sin importar qué categoría interna tenga — si no, un
        // filtro de gasto como "Compras" siempre te mezclaba los ingresos
        // que internamente quedaron en esa misma categoría.
        if (t.amount >= 0) return selectedFilters.has("ingreso");
        return selectedFilters.has(t.category);
      })
      .filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, selectedFilters, search]);

  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Wallet size={22} />} title="Todavía no hay movimientos cargados" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Movimientos
        </h1>
        <Button variant="secondary" onClick={() => exportCsv(filtered)}>
          <Download size={15} /> Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descripción..."
            className="rounded-xl border bg-transparent py-2 pl-8 pr-3 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <MonthFilter months={months} value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <ImportedFiles />

      <div className="flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((c) => {
          const active = selectedFilters.has(c);
          const meta = CATEGORY_META[c];
          return (
            <button
              key={c}
              onClick={() => toggleFilter(c)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
              style={{
                borderColor: active ? meta.colorVar : "var(--border)",
                color: active ? meta.colorVar : "var(--text-secondary)",
                background: active ? `color-mix(in srgb, ${meta.colorVar} 12%, transparent)` : "transparent",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.colorVar }} />
              {meta.shortLabel}
            </button>
          );
        })}
        {(() => {
          const active = selectedFilters.has("ingreso");
          return (
            <button
              onClick={() => toggleFilter("ingreso")}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
              style={{
                borderColor: active ? "var(--status-good)" : "var(--border)",
                color: active ? "var(--status-good)" : "var(--text-secondary)",
                background: active ? "color-mix(in srgb, var(--status-good) 12%, transparent)" : "transparent",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--status-good)" }} />
              Ingresos
            </button>
          );
        })()}
        {selectedFilters.size > 0 && (
          <button
            onClick={() => setSelectedFilters(new Set())}
            className="text-xs underline cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            limpiar filtro
          </button>
        )}
      </div>

      <Card padded={false} className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No hay movimientos que coincidan con el filtro" />
        ) : (
          <ul>
            {filtered.map((t) => {
              const meta = CATEGORY_META[t.category];
              const isMpTopUp = t.category === "mercado_pago" && t.amount < 0;
              const isOpen = expanded === t.id;
              return (
                <li key={t.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => setExpanded(isOpen ? null : isMpTopUp ? t.id : null)}
                      className="shrink-0 cursor-pointer"
                      style={{ color: isMpTopUp ? "var(--text-secondary)" : "transparent" }}
                      disabled={!isMpTopUp}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="w-24 shrink-0 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {formatDate(t.date)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {t.description}
                        {t.installment && (
                          <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                            cuota {t.installment.current}/{t.installment.total}
                          </span>
                        )}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {t.amount >= 0 ? (
                          <Badge color="var(--status-good)">Ingreso</Badge>
                        ) : (
                          <Badge color={meta.colorVar}>{meta.shortLabel}</Badge>
                        )}
                        {isMpTopUp && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {(t.mpDetails?.length ?? 0) > 0
                              ? `${t.mpDetails!.length} gasto(s) detallado(s)`
                              : "sin detalle todavía"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="w-28 shrink-0 text-right text-sm font-medium tabular-nums"
                      style={{ color: t.amount < 0 ? "var(--status-critical)" : "var(--status-good)" }}
                    >
                      {formatCurrency(t.amount, t.currency)}
                    </div>

                    <button
                      onClick={() => deleteTransaction(t.id)}
                      className="shrink-0 cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                      title="Eliminar movimiento"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {isOpen && isMpTopUp && <MercadoPagoDetail transaction={t} />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
