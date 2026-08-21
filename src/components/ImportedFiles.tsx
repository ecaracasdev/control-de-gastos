import { useState } from "react";
import { ChevronDown, ChevronUp, FileSpreadsheet, Trash2 } from "lucide-react";
import { Card } from "./ui/Card";
import { formatDate } from "../lib/format";
import { sourceFileSummaries, useFinanceStore } from "../store/useFinanceStore";

export function ImportedFiles() {
  const transactions = useFinanceStore((s) => s.transactions);
  const deleteBySourceFile = useFinanceStore((s) => s.deleteBySourceFile);
  const clearAll = useFinanceStore((s) => s.clearAll);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);

  const files = sourceFileSummaries(transactions);

  return (
    <Card padded={false}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium cursor-pointer"
        style={{ color: "var(--text-primary)" }}
      >
        <span className="flex items-center gap-2">
          <FileSpreadsheet size={15} style={{ color: "var(--text-muted)" }} />
          Archivos importados ({files.length})
        </span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          <ul>
            {files.map((f) => (
              <li
                key={f.sourceFile}
                className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                    {f.sourceFile}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {f.count} movimientos · {formatDate(f.firstDate)} a {formatDate(f.lastDate)}
                  </p>
                </div>
                {confirming === f.sourceFile ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>¿Eliminar estos {f.count} movimientos?</span>
                    <button
                      onClick={() => {
                        deleteBySourceFile(f.sourceFile);
                        setConfirming(null);
                      }}
                      className="rounded-lg px-2 py-1 font-medium cursor-pointer"
                      style={{ background: "var(--status-critical)", color: "white" }}
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming(f.sourceFile)}
                    className="flex shrink-0 items-center gap-1 text-xs cursor-pointer"
                    style={{ color: "var(--status-critical)" }}
                  >
                    <Trash2 size={13} /> eliminar estos movimientos
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end px-4 py-3">
            {confirmingAll ? (
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: "var(--text-secondary)" }}>
                  ¿Borrar todos los movimientos, ingresos y saldo cargados?
                </span>
                <button
                  onClick={() => {
                    clearAll();
                    setConfirmingAll(false);
                  }}
                  className="rounded-lg px-2 py-1 font-medium cursor-pointer"
                  style={{ background: "var(--status-critical)", color: "white" }}
                >
                  Sí, borrar todo
                </button>
                <button
                  onClick={() => setConfirmingAll(false)}
                  className="cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingAll(true)}
                className="text-xs underline cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                borrar todos los movimientos cargados
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
