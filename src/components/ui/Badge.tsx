import type { ReactNode } from "react";

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        background: color ? `color-mix(in srgb, ${color} 16%, transparent)` : "var(--border)",
        color: color ?? "var(--text-secondary)",
      }}
    >
      {color && (
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: color }}
        />
      )}
      {children}
    </span>
  );
}
