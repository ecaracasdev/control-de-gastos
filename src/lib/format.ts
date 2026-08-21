export function formatCurrency(amount: number, currency: "ARS" | "USD" = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(y, (m ?? 1) - 1, d ?? 1),
  );
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(y, (m ?? 1) - 1, 1),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 1 }).format(value);
}
