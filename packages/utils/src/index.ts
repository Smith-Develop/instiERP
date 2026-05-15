export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", options ?? { dateStyle: "long" });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
