import { useEffect } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    // Bloqueamos el scroll de la página de fondo mientras el modal está
    // abierto — si no, al llegar al final de la lista del modal el scroll
    // "se pasaba" a la página de atrás.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ overscrollBehavior: "contain" }}
      onClick={onClose}
      onWheel={(e) => e.preventDefault()}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-lg"
        style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {title}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-lg p-1"
            style={{ color: "var(--text-muted)" }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }} onWheel={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}
