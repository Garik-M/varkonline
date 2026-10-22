import { describe, expect, it } from "vitest";
import type { CellObject } from "write-excel-file/universal";
import { calculateFinancing } from "@/lib/financing";
import {
  calculateMortgageRefundScenario,
  ARMENIA_REFUND_RULES_2026_10,
} from "@/lib/financing/income-tax-refund";
import { sample } from "@/lib/financing/income-tax-refund/__tests__/fixtures";
import {
  paymentScheduleSheets,
  paymentScheduleFilename,
  type ScheduleExport,
} from "../schedule-export";

function fixture(): ScheduleExport {
  const input = sample();
  return {
    financing: input.financing,
    projection: calculateMortgageRefundScenario(
      {
        financing: input.financing,
        loanOriginationDate: input.loanOriginationDate,
        payments: input.payments,
        participants: input.participants.map(({ id, role, incomePeriods }) => ({
          id,
          role,
          incomePeriods,
        })),
      },
      ARMENIA_REFUND_RULES_2026_10,
    ),
    apartmentId: "../A-101",
    language: "en",
  };
}
const values = (sheet: ReturnType<typeof paymentScheduleSheets>[number]) =>
  sheet.data.map((row) =>
    row.map((cell) => (cell as CellObject | null)?.value ?? null),
  );

describe("Excel schedule snapshot", () => {
  it("exports every monthly result and exact refund allocations, never payroll or participant data", () => {
    const input = fixture();
    const before = JSON.stringify(input);
    const [summary, schedule] = paymentScheduleSheets(input);
    // Independent reference: principal 1000, interest 10+7+3, payments 340+340+340.
    expect(values(schedule)).toEqual([
      [
        "Month",
        "Opening balance (AMD)",
        "Payment (AMD)",
        "Principal (AMD)",
        "Interest (AMD)",
        "Balance (AMD)",
        "Refund allocation (AMD)",
        "Cost after refund (AMD)",
      ],
      [1, 1000, 340, 330, 10, 670, 10, 330],
      [2, 670, 340, 333, 7, 337, 7, 333],
      [3, 337, 340, 337, 3, 0, 3, 337],
      ["Total", null, 1020, 1000, 20, 0, 20, 1000],
    ]);
    expect(JSON.stringify(summary)).not.toMatch(
      /grossRegisteredSalaryAMD|incomePeriods|participants|netSalary/,
    );
    expect(JSON.stringify(input)).toBe(before);
    expect((summary.data[1][1] as CellObject).type).toBe(String);
    expect((schedule.data[1][2] as CellObject).type).toBe(Number);
  });

  it("provides useful unbranded summary amounts from the same calculation", () => {
    const [summary] = paymentScheduleSheets(fixture());
    const rows = values(summary);
    expect(JSON.stringify(summary)).not.toMatch(/varkonline/i);
    expect(rows).toEqual(expect.arrayContaining([
      ["Summary", "AMD"],
      ["Term, years", 0.25],
      ["First monthly payment (AMD)", 340],
      ["Final monthly payment (AMD)", 340],
      ["Estimated first-month refund (AMD)", 10],
      ["First-month cost after refund (AMD)", 330],
      ["Total payments to the bank (AMD)", 1020],
      ["Total cost including down payment, after refund (AMD)", 1250],
    ]));
    const apartmentId = '=HYPERLINK("https://example.invalid")';
    const [untrusted] = paymentScheduleSheets({ ...fixture(), apartmentId });
    expect(untrusted.data[1][1]).toMatchObject({ value: apartmentId, type: String });
    expect(paymentScheduleFilename("A-101")).not.toMatch(/varkonline/i);
  });

  it.each(["hy", "en", "ru"] as const)(
    "localizes workbook and labels in %s without changing amounts",
    (language) => {
      const result = paymentScheduleSheets({ ...fixture(), language });
      expect(result.map((sheet) => sheet.sheet)).toEqual(
        {
          hy: ["Ամփոփում", "Վճարումների գրաֆիկ"],
          en: ["Summary", "Payment schedule"],
          ru: ["Сводка", "График платежей"],
        }[language],
      );
      expect(values(result[1])[3]).toEqual([3, 337, 340, 337, 3, 0, 3, 337]);
    },
  );

  it("exports the full term, including varying equal-principal and final payments", () => {
    const financing = calculateFinancing({
      financingType: "mortgage",
      currency: "AMD",
      apartmentPrice: 35000000,
      downPaymentPercent: 20,
      annualInterestRatePercent: 13.25,
      durationMonths: 240,
      repaymentMethod: "equal_principal",
    });
    const rows = values(
      paymentScheduleSheets({ ...fixture(), financing, projection: null })[1],
    );
    expect(rows).toHaveLength(242);
    expect(rows[1][2]).toBe(425834);
    expect(rows[240][2]).toBe(117955);
    expect(rows[241][2]).toBe(65254587);
    expect(rows[240][5]).toBe(0);
  });

  it("omits unresolved or stale refund projections rather than exporting zero refunds", () => {
    const input = fixture();
    expect(
      values(paymentScheduleSheets({ ...input, projection: null })[1])[0],
    ).toHaveLength(6);
    const financing = calculateFinancing({
      financingType: "mortgage",
      currency: "AMD",
      apartmentPrice: 2500,
      downPaymentPercent: 20,
      annualInterestRatePercent: 12,
      durationMonths: 3,
    });
    expect(
      values(paymentScheduleSheets({ ...input, financing })[1])[0],
    ).toHaveLength(6);
  });

  it.each([0, 100])(
    "supports USD interest-free installments and %i%% down payment",
    (downPaymentPercent) => {
      const financing = calculateFinancing({
        financingType: "developer_installment",
        currency: "USD",
        apartmentPrice: 100,
        downPaymentPercent,
        durationMonths: 3,
        formula: "interest_free",
      });
      const rows = values(
        paymentScheduleSheets({ ...fixture(), financing })[1],
      );
      expect(rows[0]).toHaveLength(6);
      expect(rows).toHaveLength(downPaymentPercent === 100 ? 2 : 5);
      expect(rows.at(-1)).toEqual([
        "Total",
        null,
        downPaymentPercent === 100 ? 0 : 100,
        downPaymentPercent === 100 ? 0 : 100,
        0,
        0,
      ]);
      if (downPaymentPercent === 0)
        expect(rows[3]).toEqual([3, 34, 34, 34, 0, 0]);
    },
  );

  it("bounds filenames and removes path separators and control characters", () => {
    expect(paymentScheduleFilename("../A-101\n")).toBe(
      "payment-schedule-A-101.xlsx",
    );
    expect(paymentScheduleFilename("a".repeat(200)).length).toBeLessThan(100);
  });
});
