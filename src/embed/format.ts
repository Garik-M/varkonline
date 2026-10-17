const formatter = new Intl.NumberFormat("hy-AM", { maximumFractionDigits: 20 });
// Preserve supplied percentage precision; do not display a positive tiny rate as 0%.
export const number = (value: number) =>
  value !== 0 && Math.abs(value) < 1e-20
    ? String(value)
    : formatter.format(value);
export const money = (value: number, currency: "AMD" | "USD" = "AMD") =>
  `${number(value)} ${currency === "AMD" ? "֏" : "$"}`;
