import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border shadow-sm",
        padded && "p-5",
        className,
      )}
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
