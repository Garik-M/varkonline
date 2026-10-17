import type { WidgetConfiguration } from "./types";
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function integrationSnippet(
  origin: string,
  config: WidgetConfiguration,
): string {
  const attrs: Record<string, string | number | undefined> = {
    class: "varkonline-widget",
    "data-partner": config.partner,
    "data-apartment-id": config.apartmentId,
    [config.currency === "USD" ? "data-price-usd" : "data-price-amd"]:
      config.apartmentPrice,
    "data-financing-type": config.financingType,
    "data-annual-interest-rate": config.annualInterestRatePercent,
    "data-down-payment-percent": config.downPaymentPercent,
    "data-duration-months": config.durationMonths,
    "data-development": config.developmentId,
    "data-contract-price-amd": config.contractPriceAMD,
    "data-loan-origination-date": config.loanOriginationDate,
    "data-first-payment-date": config.firstPaymentDate,
  };
  return `<div\n${Object.entries(attrs)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `  ${key}="${escape(String(value))}"`)
    .join(
      "\n",
    )}\n></div>\n<script async src="${escape(new URL("/sdk/v1.js", origin).href)}"></script>`;
}
