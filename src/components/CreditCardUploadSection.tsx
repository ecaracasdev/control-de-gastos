import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, CreditCard, Link2, Link2Off, Loader2 } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { parseCreditCardXlsx, type CreditCardStatement } from "../lib/creditcard";
import { formatCurrency, formatDate } from "../lib/format";
import { useFinanceStore } from "../store/useFinanceStore";

export function CreditCardUploadSection() {
  const addCreditCardStatement = useFinanceStore((s) => s.addCreditCardStatement);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<CreditCardStatement[] | null>(null);
  const [saved, setSaved] = useState<{ label: string; linked: boolean }[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setSaved(null);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Por ahora este detalle solo se puede cargar en Excel (.xlsx).");
      return;
    }
    setLoading(true);
    try {
      const statements = await parseCreditCardXlsx(file);
      if (statements.length === 0) {
        setError("No pude reconocer el detalle de consumos en este archivo. ¿Es el export de \"Últimos consumos\"?");
        return;
      }
      setParsed(statements);
    } catch (err) {
      console.error(err);
      setError("Hubo un error leyendo el archivo.");
    } finally {
      setLoading(false);
    }
  }

  function confirm() {
    if (!parsed) return;
    const results = parsed.map((s) => {
      const { linked } = addCreditCardStatement(s);
      return { label: s.cardLabel, linked };
    });
    setSaved(results);
    setParsed(null);
  }

  return (
    <Card padded={false} className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium cursor-pointer"
        style={{ color: "var(--text-primary)" }}
      >
        <span className="flex items-center gap-2 text-left">
          <CreditCard size={15} style={{ color: "var(--text-muted)" }} />
          ¿Querés cargar el detalle de consumo de tu(s) tarjeta(s) de crédito? Subí el resumen acá
        </span>
        {open ? <ChevronUp size={15} className="shrink-0" /> : <ChevronDown size={15} className="shrink-0" />}
      </button>

      {open && (
        <div className="space-y-3 border-t px-4 py-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Subí el Excel de "Últimos consumos" del último resumen de tu tarjeta (el que corresponde al pago que
            ya aparece en tus movimientos). Vamos a intentar conectarlo automáticamente con ese pago para
            mostrarte en qué se fue esa plata.
          </p>

          {!parsed && !saved && (
            <div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
              <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={loading}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                {loading ? "Leyendo..." : "Elegir archivo"}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm" style={{ color: "var(--status-critical)" }}>
              {error}
            </p>
          )}

          {parsed && (
            <div className="space-y-4">
              {parsed.map((s) => (
                <div key={s.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {s.cardLabel}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {s.closingDate && `Cierre ${formatDate(s.closingDate)} · `}
                    {s.items.length} consumos
                    {s.paymentAmount !== undefined && ` · pago del resumen: ${formatCurrency(s.paymentAmount)}`}
                  </p>
                  <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-sm">
                    {s.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate" style={{ color: "var(--text-primary)" }}>
                          {item.description}
                          {item.installment && (
                            <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                              ({item.installment.current}/{item.installment.total})
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
              ))}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setParsed(null)}>
                  Cancelar
                </Button>
                <Button onClick={confirm}>Guardar detalle</Button>
              </div>
            </div>
          )}

          {saved && (
            <div className="space-y-2">
              {saved.map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-sm">
                  {r.linked ? (
                    <Link2 size={14} style={{ color: "var(--status-good)" }} />
                  ) : (
                    <Link2Off size={14} style={{ color: "var(--status-warning)" }} />
                  )}
                  <span style={{ color: "var(--text-primary)" }}>{r.label}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {r.linked
                      ? "— conectado con un pago en tus movimientos"
                      : "— guardado, pero no encontramos un pago que coincida exactamente"}
                  </span>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setSaved(null)}>
                Cargar otro
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
