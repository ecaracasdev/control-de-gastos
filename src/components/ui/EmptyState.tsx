import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      {icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "var(--border)", color: "var(--text-muted)" }}
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="font-medium" style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        {description && (
          <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
