import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-white hover:opacity-90",
  secondary:
    "bg-transparent border hover:bg-black/[.03] dark:hover:bg-white/[.06]",
  ghost: "bg-transparent hover:bg-black/[.03] dark:hover:bg-white/[.06]",
  danger: "bg-transparent text-[var(--status-critical)] hover:bg-[var(--status-critical)]/10",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
        VARIANT_CLASS[variant],
        className,
      )}
      style={variant === "secondary" ? { borderColor: "var(--border)", color: "var(--text-primary)" } : undefined}
      {...props}
    />
  );
}
