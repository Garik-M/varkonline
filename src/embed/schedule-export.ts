import writeExcelFile, {
  type Cell,
  type CellObject,
  type Sheet,
} from "write-excel-file/universal";
import type { FinancingResult } from "@/lib/financing";
import type { MortgageRefundResult } from "@/lib/financing/income-tax-refund";
import { translate, type MessageKey, type WidgetLanguage } from "./messages";

export interface ScheduleExport {
  financing: FinancingResult;
  projection: MortgageRefundResult | null;
  apartmentId: string;
  language: WidgetLanguage;
}

/** A snapshot of the authoritative engine results, not a second loan formula.
 * Explicit string cells keep apartment text from becoming Excel formulas.
 * Payroll inputs, personal answers and analytics identifiers are never exported. */
export function paymentScheduleSheets(input: ScheduleExport): Sheet<Blob>[] {
  const { financing: result, projection, language } = input;
  const t = (key: MessageKey) => translate(language, key);
  const text = (value: string): CellObject => ({
    value,
    type: String,
    wrap: true,
  });
  const numeric = (value: number): CellObject => ({
    value,
    type: Number,
    format: "#,##0",
  });
  const header = (value: string): CellObject => ({
    ...text(value),
    fontWeight: "bold",
    backgroundColor: "#173453",
    textColor: "#ffffff",
    height: 42,
  });
  const hasRefund =
    result.financingType === "mortgage" &&
    result.currency === "AMD" &&
    projection?.totalEstimatedRefundAMD != null &&
    projection.totalEffectiveFinancingCostAMD != null &&
    projection.monthlySchedule.length === result.schedule.length &&
    projection.monthlySchedule.every(
      (entry, index) =>
        entry.month === result.schedule[index].month &&
        entry.bankPaymentAMD === result.schedule[index].scheduledPayment &&
        entry.allocatedRefundAMD != null &&
        entry.costAfterAllocatedRefundAMD != null,
    );
  const moneyLabel = (key: MessageKey) => `${t(key)} (${result.currency})`;
  const summary: Cell[][] = [
    [header(t("exportSummary")), header(result.currency)],
    [text(t("exportApartment")), text(input.apartmentId)],
    [
      text(t("repaymentMethod")),
      text(
        t(
          result.financingType === "mortgage"
            ? result.repaymentMethod === "equal_principal"
              ? "equalPrincipal"
              : "annuity"
            : "interestFree",
        ),
      ),
    ],
    [text(moneyLabel("price")), numeric(result.apartmentPrice)],
    [text(moneyLabel("downAmount")), numeric(result.downPaymentAmount)],
    [text(moneyLabel("principal")), numeric(result.financedPrincipal)],
    result.financingType === "mortgage"
      ? [
          text(t("durationYears")),
          { value: result.durationMonths / 12, type: Number, format: "0.##" },
        ]
      : [text(`${t("duration")} (${t("months")})`), numeric(result.durationMonths)],
    ...(result.financingType === "mortgage"
      ? [
          [
            text(t("annualRate")),
            {
              value: result.annualInterestRatePercent / 100,
              type: Number,
              format: "0.############%",
            } satisfies Cell,
          ],
        ]
      : []),
    [
      text(moneyLabel("exportFirstPayment")),
      numeric(result.schedule[0]?.scheduledPayment ?? 0),
    ],
    [
      text(moneyLabel("exportFinalPayment")),
      numeric(result.schedule.at(-1)?.scheduledPayment ?? 0),
    ],
    [text(moneyLabel("totalInterest")), numeric(result.totalInterest)],
    [
      text(
        moneyLabel(
          result.financingType === "mortgage"
            ? "totalBankPayment"
            : "totalInstallments",
        ),
      ),
      numeric(result.totalFinancedRepayment),
    ],
    [
      text(moneyLabel("totalCost")),
      numeric(result.totalCostIncludingDownPayment),
    ],
    ...(hasRefund
      ? [
          [
            text(moneyLabel("exportFirstRefund")),
            numeric(projection!.monthlySchedule[0]?.allocatedRefundAMD ?? 0),
          ],
          [
            text(moneyLabel("exportFirstNetPayment")),
            numeric(projection!.monthlySchedule[0]?.costAfterAllocatedRefundAMD ?? 0),
          ],
          [
            text(moneyLabel("totalRefund")),
            numeric(projection!.totalEstimatedRefundAMD!),
          ],
          [
            text(moneyLabel("totalWithRefund")),
            numeric(projection!.totalEffectiveFinancingCostAMD!),
          ],
          [
            text(moneyLabel("exportTotalCostAfterRefund")),
            numeric(result.totalCostIncludingDownPayment - projection!.totalEstimatedRefundAMD!),
          ],
        ]
      : []),
    [],
    [text(t("estimate"))],
    [text(t("exportSnapshot"))],
    [text(t("roundingNote"))],
    ...(hasRefund
      ? [
          [text(t("financialScenarioNotice"))],
          [text(t("refundAllocationNote"))],
          [text(t("netPayrollAssumptions"))],
        ]
      : []),
  ];
  // Give the explanatory notes the full worksheet width.
  summary.forEach((row) => {
    if (row.length === 1 && row[0])
      row[0] = {
        ...(row[0] as CellObject),
        columnSpan: 2,
        height: hasRefund ? 70 : 42,
      };
  });
  const schedule: Cell[][] = [
    [
      "month",
      "openingBalance",
      "payment",
      "principalColumn",
      "interest",
      "balance",
      ...(hasRefund ? ["allocatedRefund", "costAfterRefund"] : []),
    ].map((key, index) =>
      header(index ? moneyLabel(key as MessageKey) : t("month")),
    ),
    ...result.schedule.map((entry, index) =>
      [
        entry.month,
        entry.openingBalance,
        entry.scheduledPayment,
        entry.principalPaid,
        entry.interestPaid,
        entry.remainingBalance,
        ...(hasRefund
          ? [
              projection!.monthlySchedule[index].allocatedRefundAMD!,
              projection!.monthlySchedule[index].costAfterAllocatedRefundAMD!,
            ]
          : []),
      ].map(numeric),
    ),
    [
      text(t("total")),
      null,
      numeric(result.totalFinancedRepayment),
      numeric(result.financedPrincipal),
      numeric(result.totalInterest),
      numeric(0),
      ...(hasRefund
        ? [
            numeric(projection!.totalEstimatedRefundAMD!),
            numeric(projection!.totalEffectiveFinancingCostAMD!),
          ]
        : []),
    ].map((cell) =>
      cell
        ? {
            ...(cell as CellObject),
            fontWeight: "bold",
            backgroundColor: "#eaf0f6",
          }
        : null,
    ),
  ];
  return [
    {
      sheet: t("exportSummary"),
      data: summary,
      columns: [{ width: 55 }, { width: 55 }],
      showGridLines: false,
    },
    {
      sheet: t("schedule"),
      data: schedule,
      columns: schedule[0].map((_, index) => ({ width: index ? 25 : 10 })),
      stickyRowsCount: 1,
      stickyColumnsCount: 1,
      orientation: "landscape",
    },
  ];
}

export function paymentScheduleFilename(apartmentId: string) {
  const safeId = apartmentId
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `payment-schedule${safeId ? `-${safeId}` : ""}.xlsx`;
}

export async function downloadPaymentSchedule(input: ScheduleExport) {
  const blob = await writeExcelFile(paymentScheduleSheets(input), {
    fontFamily: "Arial",
    fontSize: 11,
  }).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = paymentScheduleFilename(input.apartmentId);
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Leave time for browsers to begin reading the download before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
