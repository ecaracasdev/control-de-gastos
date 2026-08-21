import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, HelpCircle, Trash2 } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { CATEGORY_META, CATEGORY_ORDER, type Category, type ParsedTransactionDraft, type Transaction } from "../types";
import { formatCurrency } from "../lib/format";
import { useFinanceStore } from "../store/useFinanceStore";

interface Row extends ParsedTransactionDraft {
  key: string;
  include: boolean;
}

const CONFIDENCE_META: Record<Row["confidence"], { label: string; icon: typeof CheckCircle2; color: string }> = {
  alta: { label: "Detectado con confianza", icon: CheckCircle2, color: "var(--status-good)" },
  media: { label: "Revisar: había más de un importe en la línea", icon: HelpCircle, color: "var(--status-warning)" },
  baja: { label: "Revisar con atención", icon: AlertTriangle, color: "var(--status-critical)" },
};

export function ReviewImport({
  drafts,
  fileName,
  latestBalance,
  onDone,
  onCancel,
}: {
  drafts: ParsedTransactionDraft[];
  fileName: string;
  latestBalance?: { date: string; amount: number };
  onDone: () => void;
  onCancel: () => void;
}) {
  const addTransactions = useFinanceStore((s) => s.addTransactions);
  const reportBankBalance = useFinanceStore((s) => s.reportBankBalance);
  const [rows, setRows] = useState<Row[]>(
    drafts.map((d, i) => ({ ...d, key: `${i}-${d.date}-${d.description.slice(0, 10)}`, include: true })),
  );
  const [result, setResult] = useState<{ added: number; duplicates: number } | null>(null);

  const included = useMemo(() => rows.filter((r) => r.include), [rows]);
  // Igual que en el Panel: una transferencia recibida (ej. te devolvieron
  // plata que vos mandaste) no es "ingreso nuevo", así que no se mezcla acá.
  const totalGasto = useMemo(
    () =>
      included
        .filter((r) => r.amount < 0 && r.category !== "transferencias")
        .reduce((sum, r) => sum + Math.abs(r.amount), 0),
    [included],
  );
  const totalIngreso = useMemo(
    () =>
      included
        .filter((r) => r.amount > 0 && r.category !== "transferencias")
        .reduce((sum, r) => sum + r.amount, 0),
    [included],
  );
  const transfersNet = useMemo(
    () => included.filter((r) => r.category === "transferencias").reduce((sum, r) => sum + r.amount, 0),
    [included],
  );

  function patchRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function confirm() {
    const toImport: Omit<Transaction, "id">[] = included.map(({ key, include, confidence, ...tx }) => tx);
    const res = addTransactions(toImport);
    if (latestBalance) {
      reportBankBalance({ ...latestBalance, sourceFile: fileName });
    }
    setResult(res);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 size={36} style={{ color: "var(--status-good)" }} />
          <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Importación completa
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Se agregaron {result.added} movimientos.
            {result.duplicates > 0 && ` Se omitieron ${result.duplicates} por parecer duplicados.`}
          </p>
          <Button onClick={onDone}>Ir al panel</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Revisá los movimientos antes de guardar
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Detectamos {rows.length} movimientos en <span className="font-medium">{fileName}</span>. Corregí lo
            que haga falta y confirmá abajo para guardarlos.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[160px] !p-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Seleccionados</p>
          <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {included.length} / {rows.length}
          </p>
        </Card>
        <Card className="flex-1 min-w-[160px] !p-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Gastos detectados</p>
          <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--status-critical)" }}>
            {formatCurrency(-totalGasto)}
          </p>
        </Card>
        <Card className="flex-1 min-w-[160px] !p-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ingresos/acreditaciones</p>
          <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--status-good)" }}>
            {formatCurrency(totalIngreso)}
          </p>
        </Card>
        <Card className="flex-1 min-w-[160px] !p-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Transferencias (neto)</p>
          <p
            className="text-lg font-semibold tabular-nums"
            style={{ color: transfersNet >= 0 ? "var(--status-good)" : "var(--status-critical)" }}
          >
            {formatCurrency(transfersNet)}
          </p>
        </Card>
      </div>

      <Card padded={false} className="overflow-hidden">
        {/* Tabla: pantallas medianas en adelante */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)" }}>
                <th className="w-10 p-3"></th>
                <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Fecha</th>
                <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Descripción</th>
                <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Categoría</th>
                <th className="p-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>Monto</th>
                <th className="w-10 p-3"></th>
                <th className="w-10 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = CONFIDENCE_META[row.confidence];
                const Icon = meta.icon;
                return (
                  <tr
                    key={row.key}
                    className="border-b last:border-0"
                    style={{ borderColor: "var(--border)", opacity: row.include ? 1 : 0.4 }}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) => patchRow(row.key, { include: e.target.checked })}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => patchRow(row.key, { date: e.target.value })}
                        className="w-36 rounded-lg border bg-transparent px-2 py-1"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => patchRow(row.key, { description: e.target.value })}
                        className="w-64 rounded-lg border bg-transparent px-2 py-1"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={row.category}
                        onChange={(e) => patchRow(row.key, { category: e.target.value as Category })}
                        className="rounded-lg border bg-transparent px-2 py-1"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {CATEGORY_ORDER.map((c) => (
                          <option key={c} value={c}>
                            {CATEGORY_META[c].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Invertir signo (gasto/ingreso)"
                          onClick={() => patchRow(row.key, { amount: -row.amount })}
                          className="rounded p-1 cursor-pointer"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <ArrowLeftRight size={14} />
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={row.amount}
                          onChange={(e) => patchRow(row.key, { amount: Number(e.target.value) })}
                          className="w-28 rounded-lg border bg-transparent px-2 py-1 text-right tabular-nums"
                          style={{
                            borderColor: "var(--border)",
                            color: row.amount < 0 ? "var(--status-critical)" : "var(--status-good)",
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-3" title={meta.label}>
                      <Icon size={16} style={{ color: meta.color }} />
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => patchRow(row.key, { include: false })}
                        className="rounded p-1 cursor-pointer"
                        style={{ color: "var(--text-muted)" }}
                        title="Descartar esta fila"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tarjetas: mobile — la tabla no entra en pantallas chicas */}
        <ul className="sm:hidden">
          {rows.map((row) => {
            const meta = CONFIDENCE_META[row.confidence];
            const Icon = meta.icon;
            return (
              <li
                key={row.key}
                className="space-y-2 border-b p-3 last:border-0"
                style={{ borderColor: "var(--border)", opacity: row.include ? 1 : 0.4 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) => patchRow(row.key, { include: e.target.checked })}
                    />
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => patchRow(row.key, { date: e.target.value })}
                      className="rounded-lg border bg-transparent px-2 py-1 text-sm"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span title={meta.label}>
                      <Icon size={16} style={{ color: meta.color }} />
                    </span>
                    <button
                      onClick={() => patchRow(row.key, { include: false })}
                      className="cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                      title="Descartar esta fila"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => patchRow(row.key, { description: e.target.value })}
                  className="w-full rounded-lg border bg-transparent px-2 py-1.5 text-sm"
                  style={{ borderColor: "var(--border)" }}
                />

                <div className="flex items-center gap-2">
                  <select
                    value={row.category}
                    onChange={(e) => patchRow(row.key, { category: e.target.value as Category })}
                    className="min-w-0 flex-1 rounded-lg border bg-transparent px-2 py-1.5 text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_META[c].label}
                      </option>
                    ))}
                  </select>
                  <button
                    title="Invertir signo (gasto/ingreso)"
                    onClick={() => patchRow(row.key, { amount: -row.amount })}
                    className="shrink-0 cursor-pointer rounded p-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => patchRow(row.key, { amount: Number(e.target.value) })}
                    className="w-24 shrink-0 rounded-lg border bg-transparent px-2 py-1.5 text-right text-sm tabular-nums"
                    style={{
                      borderColor: "var(--border)",
                      color: row.amount < 0 ? "var(--status-critical)" : "var(--status-good)",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 shadow-lg backdrop-blur"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--surface-1) 92%, transparent)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 sm:justify-end">
          <p className="text-xs sm:hidden" style={{ color: "var(--text-muted)" }}>
            {included.length} de {rows.length} seleccionados
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={confirm} disabled={included.length === 0}>
              Guardar {included.length} movimientos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
