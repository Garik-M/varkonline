import type { WidgetLanguage } from "./messages";
const formatters = {
  hy: new Intl.NumberFormat("hy-AM", { maximumFractionDigits: 20 }),
  en: new Intl.NumberFormat("en-US", { maximumFractionDigits: 20 }),
  ru: new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 20 }),
};
// Preserve supplied percentage precision; do not display a positive tiny rate as 0%.
export const number = (value: number, language: WidgetLanguage = "hy") =>
  value !== 0 && Math.abs(value) < 1e-20
    ? String(value)
    : formatters[language].format(value);
export const money = (
  value: number,
  currency: "AMD" | "USD" = "AMD",
  language: WidgetLanguage = "hy",
) => `${number(value, language)} ${currency === "AMD" ? "֏" : "$"}`;
