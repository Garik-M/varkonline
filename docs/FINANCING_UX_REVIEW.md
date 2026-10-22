# Financing widget review — 21 October 2026

| Request | Current behavior |
| --- | --- |
| Refund visible immediately | Branded refund section and take-home salary are always visible for supported mortgages; no dropdown. |
| Simpler borrower form | No property/employment questionnaire, loan/payment date fields, actual-withholding override or acknowledgement checkbox. |
| Down payment in drams | Exact whole-AMD input, default 10,000 increment, default 10% minimum and 100% maximum; inline bounds errors. |
| Term in years | Mortgage widget and everyday partner/staff settings display years, including legacy saved configurations; SDK/engine still use months. Default mortgage bounds remain 10–20 years. Installments retain months. |
| Optional annual rate | A matching-currency configured price rule removes the default-rate requirement. Standard AMD rule is 12.75% below 35m and 13.25% at/above 35m. Explicit permitted apartment rates still override it. No USD exchange rate or mortgage rate is invented. |
| Rate editor | Separate responsive control with a clear percentage suffix; comma/fractional input, configured bounds and inline errors. Default visitor bounds are 1–30%. |
| Fixed bank payment | Monthly annuity remains the default, as confirmed by the user after research. Only the final payment adjusts for whole-unit reconciliation. Existing explicitly configured equal-principal functionality is preserved. |
| Monthly refund correction | Conservative estimate is bounded by each payment month's available tax and interest, then the shared quarterly cap. No first-quarter spike from tax belonging to a month with no loan payment. |
| Clear savings | Full bank payment minus estimated monthly refund equals that month's cost. Original bank amounts remain visible; full-term deduction uses exact totals. |
| Instant recalculation | Salary remains filled while down payment, term and rate change; invalid intermediate input hides stale results. |
| Full schedule and Excel | Complete monthly rows and totals, including exact final installment and corrected refund/net costs; real `.xlsx` download in the current language. |
| Appearance and languages | Partner accent controls the widget with readable text; navy default. Armenian, English and Russian labels, validation, schedules and exports. |
| Partner controls | Limits, rate rules, repayment settings, refund visibility, appearance, independent local draft, saved SDK preview and generated code. |
| Analytics and security | Named interactions only; scoped company access, signed event tokens, bounds/rate limits and no payroll values, arbitrary DOM text or third-party visitor surveillance. |

Default limits are configurable by the partner; existing saved financial terms are not silently overwritten. A displayed year is converted to months at the UI boundary. Pure engines stay deterministic and framework independent.

The widget uses `calculateMonthlyMortgageRefundEstimate`, identified by `calculationMethod: "monthly_tax_limit"`. This conservative financial illustration is distinct from statutory quarterly pooling. Existing entitlement/scenario APIs remain available with `calculationMethod: "quarterly_pool"`; neither confirms SRC approval.

For the reported 10% / 28m principal / 240-month example, 500,000 AMD take-home salary maps to the existing standard-model estimate of 139,086 AMD income tax. Months 1 and 2 now each show 139,086 refund and 131,120 net cost. Full refund estimate is 28,114,727, full bank repayment 64,849,495 and net financing cost 36,734,768 AMD. These exclude the down payment and use independent Decimal references.

Research: [Ardshinbank's public calculator](https://ardshinbank.am/for-you/calculators?lang=en) implements monthly annuity, while its [lending rules §2.1.6–2.1.9](https://ardshinbank.am/api/files/documents/lending-rules-eng-1377033d-fbfd-4f29-87b2-97f9e3032269.pdf) describe daily accrual and non-working-day adjustments. Those do not identify a universal up-and-down payment formula. The user explicitly chose to retain a fixed payment; no unconfirmed bank-specific algorithm was introduced.
