import { LayoutDashboard, List, UploadCloud, Wallet } from "lucide-react";
import clsx from "clsx";

export type Tab = "dashboard" | "transactions" | "upload" | "income";

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Panel", icon: LayoutDashboard },
  { key: "transactions", label: "Movimientos", icon: List },
  { key: "upload", label: "Cargar PDF", icon: UploadCloud },
  { key: "income", label: "Ingresos", icon: Wallet },
];

export function TopNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--surface-1) 88%, transparent)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-2 py-4 font-semibold" style={{ color: "var(--text-primary)" }}>
          <Wallet size={20} style={{ color: "var(--accent)" }} />
          Mis Finanzas
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={clsx(
                "flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer",
              )}
              style={{
                borderColor: active === key ? "var(--accent)" : "transparent",
                color: active === key ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
