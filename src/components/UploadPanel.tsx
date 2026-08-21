import { useCallback, useRef, useState } from "react";
import { FileWarning, Landmark, Loader2, UploadCloud } from "lucide-react";
import clsx from "clsx";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { parseStatementPdf } from "../lib/pdf";
import { parseStatementXlsx } from "../lib/excel";
import type { Bank, ParsedTransactionDraft } from "../types";

const BANKS: { key: Bank; label: string }[] = [
  { key: "santander", label: "Banco Santander" },
  { key: "nacion", label: "Banco Nación" },
  { key: "manual", label: "Otro / genérico" },
];

export interface UploadMeta {
  fileName: string;
  lineCount: number;
  latestBalance?: { date: string; amount: number };
}

export function UploadPanel({
  onParsed,
}: {
  onParsed: (drafts: ParsedTransactionDraft[], meta: UploadMeta) => void;
}) {
  const [bank, setBank] = useState<Bank>("santander");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const name = file.name.toLowerCase();
      const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
      const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

      if (!isPdf && !isExcel) {
        setError("Ese archivo no es un PDF ni un Excel. Subí el resumen tal como lo descargaste del banco.");
        return;
      }

      setLoading(true);
      try {
        const { drafts, lineCount, latestBalance } = isPdf
          ? await parseStatementPdf(file, bank).then((r) => ({ ...r, latestBalance: undefined }))
          : await parseStatementXlsx(file, bank).then((r) => ({
              drafts: r.drafts,
              lineCount: r.rowCount,
              latestBalance: r.latestBalance,
            }));

        if (drafts.length === 0) {
          setError(
            `No pude detectar movimientos en este ${isPdf ? "PDF" : "Excel"}. Puede tener un formato distinto al esperado${isPdf ? " o estar protegido" : ""} — igual podés cargarlos a mano desde 'Movimientos'.`,
          );
          return;
        }
        onParsed(drafts, { fileName: file.name, lineCount, latestBalance });
      } catch (err) {
        console.error(err);
        setError(
          isPdf
            ? "Hubo un error leyendo el PDF. Si tiene contraseña, quitala antes de subirlo e intentá de nuevo."
            : "Hubo un error leyendo el Excel. Verificá que sea el archivo .xlsx tal como lo exportó el banco.",
        );
      } finally {
        setLoading(false);
      }
    },
    [bank, onParsed],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Cargar resumen bancario
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Subí el resumen de tu banco en PDF o Excel (.xlsx). Todo el procesamiento ocurre en tu
          navegador — el archivo no se envía a ningún servidor.
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Tip: si tu banco te deja elegir, preferí el Excel — se lee de forma mucho más precisa que el
          PDF (algunos PDF de homebanking mezclan columnas al extraer el texto).
        </p>
      </div>

      <Card>
        <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          ¿De qué banco es el resumen?
        </p>
        <div className="flex flex-wrap gap-2">
          {BANKS.map((b) => (
            <button
              key={b.key}
              onClick={() => setBank(b.key)}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
              style={{
                borderColor: bank === b.key ? "var(--series-suscripciones)" : "var(--border)",
                color: bank === b.key ? "var(--series-suscripciones)" : "var(--text-secondary)",
                background:
                  bank === b.key ? "color-mix(in srgb, var(--series-suscripciones) 10%, transparent)" : "transparent",
              }}
            >
              <Landmark size={14} />
              {b.label}
            </button>
          ))}
        </div>
      </Card>

      <Card
        className={clsx(
          "flex flex-col items-center justify-center gap-3 border-2 border-dashed py-14 text-center transition-colors",
        )}
        padded={false}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className="flex w-full flex-col items-center gap-3 px-6 py-4"
          style={{ outline: dragging ? "2px solid var(--series-suscripciones)" : "none", borderRadius: 12 }}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={32} style={{ color: "var(--series-suscripciones)" }} />
          ) : (
            <UploadCloud size={32} style={{ color: "var(--text-muted)" }} />
          )}
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {loading ? "Leyendo el archivo..." : "Arrastrá el PDF o Excel acá o elegilo manualmente"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Vas a poder revisar y corregir los movimientos antes de guardarlos
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={loading}>
            Elegir archivo
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="flex items-start gap-3" style={{ borderColor: "var(--status-critical)" }}>
          <FileWarning size={18} style={{ color: "var(--status-critical)" }} className="mt-0.5 shrink-0" />
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            {error}
          </p>
        </Card>
      )}
    </div>
  );
}
