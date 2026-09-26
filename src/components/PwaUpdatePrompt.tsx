import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "./ui/Button";

export function PwaUpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 border-t px-4 py-3 text-sm"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <span className="flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <RefreshCw size={15} style={{ color: "var(--accent)" }} />
        Hay una versión nueva de la app disponible.
      </span>
      <Button onClick={() => updateServiceWorker(true)}>Actualizar</Button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="cursor-pointer"
        style={{ color: "var(--text-muted)" }}
        aria-label="Descartar"
      >
        <X size={16} />
      </button>
    </div>
  );
}
