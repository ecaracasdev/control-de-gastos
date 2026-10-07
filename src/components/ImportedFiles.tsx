import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, CreditCard, Download, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { Card } from "./ui/Card";
import { formatCurrency, formatDate } from "../lib/format";
import { sourceFileSummaries, useFinanceStore, type BackupData } from "../store/useFinanceStore";

function isBackupData(value: unknown): value is BackupData {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "transactions" in value &&
    "incomeEntries" in value &&
    Array.isArray((value as BackupData).transactions) &&
    Array.isArray((value as BackupData).incomeEntries)
  );
}

export function ImportedFiles() {
  const transactions = useFinanceStore((s) => s.transactions);
  const deleteBySourceFile = useFinanceStore((s) => s.deleteBySourceFile);
  const clearAll = useFinanceStore((s) => s.clearAll);
  const exportBackup = useFinanceStore((s) => s.exportBackup);
  const restoreBackup = useFinanceStore((s) => s.restoreBackup);
  const creditCardStatements = useFinanceStore((s) => s.creditCardStatements);
  const deleteCreditCardStatement = useFinanceStore((s) => s.deleteCreditCardStatement);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = sourceFileSummaries(transactions);
  const unlinkedStatements = creditCardStatements.filter((s) => !s.linkedTransactionId);

  function downloadBackup() {
    const data = exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mis-finanzas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRestoreFile(file: File) {
    setRestoreError(null);
    if (
      transactions.length > 0 &&
      !window.confirm(
        `Ya tenés ${transactions.length} movimientos cargados. Restaurar este backup los va a REEMPLAZAR por completo (no se suman). ¿Confirmás?`,
      )
    ) {
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isBackupData(parsed)) {
        setRestoreError("Ese archivo no tiene el formato de un backup de Mis Finanzas.");
        return;
      }
      restoreBackup(parsed);
    } catch {
      setRestoreError("No pude leer ese archivo. Verificá que sea un backup exportado desde acá.");
    }
  }

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

          {unlinkedStatements.length > 0 && (
            <div className="border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                <CreditCard size={13} /> Resúmenes de tarjeta sin vincular
              </p>
              <ul className="space-y-2">
                {unlinkedStatements.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>
                      {s.cardLabel} · {s.items.length} consumo(s) ya cargados como movimientos propios
                      {s.paymentAmount !== undefined && ` · pago del resumen ${formatCurrency(s.paymentAmount)}`}
                      {" — no encontramos un \"pago de tarjeta\" que coincida en monto para excluirlo; revisá que no quede contado dos veces"}
                    </span>
                    <button
                      onClick={() => deleteCreditCardStatement(s.id)}
                      className="flex shrink-0 items-center gap-1 cursor-pointer"
                      style={{ color: "var(--status-critical)" }}
                    >
                      <Trash2 size={12} /> eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={downloadBackup}
                  className="flex items-center gap-1 text-xs underline cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Download size={12} /> exportar backup completo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs underline cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Upload size={12} /> restaurar backup
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleRestoreFile(file);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => setConfirmingAll(true)}
                  className="text-xs underline cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  borrar todos los movimientos cargados
                </button>
              </div>
            )}
          </div>
          {restoreError && (
            <p className="px-4 pb-3 text-xs" style={{ color: "var(--status-critical)" }}>
              {restoreError}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
