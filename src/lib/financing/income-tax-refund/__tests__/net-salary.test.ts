import { describe, expect, it } from "vitest";
import {
  estimateIncomeTaxFromNetSalary,
  standardEmployeePayroll,
} from "../net-salary";
import { allocateQuarterRefund } from "../allocation";
import { calculateFinancing } from "../../engine";
import { calculateMortgageRefundScenario } from "../engine";
import { ARMENIA_REFUND_RULES_2026_10 } from "../rules";
import { sample } from "./fixtures";

describe("2026 standard net-salary illustration", () => {
  // Independently evaluated with Python Decimal/ROUND_HALF_UP, using official
  // tax/pension/stamp/health schedules. No calls to the implementation generator.
  it.each([
    [100000, 74000, 20000],
    [200000, 149000, 40000],
    [300000, 219200, 60000],
    [500000, 369200, 100000],
    [600000, 433200, 120000],
    [1000000, 713200, 200000],
    [1125000, 786700, 225000],
    [2000000, 1486700, 400000],
  ])("gross %i → net %i, income tax %i", (gross, net, tax) => {
    expect(standardEmployeePayroll(gross).netSalaryAMD).toBe(net);
    expect(standardEmployeePayroll(gross).incomeTaxAMD).toBe(tax);
  });
  it("500000 take-home corresponds to 695429 gross and 139086 income tax", () => {
    expect(estimateIncomeTaxFromNetSalary(500000)).toMatchObject({
      grossSalaryAMD: 695429,
      incomeTaxAMD: 139086,
      netSalaryAMD: 500000,
    });
  });
  it("chooses the lower-tax exact candidate across discontinuous bands", () => {
    expect(estimateIncomeTaxFromNetSalary(369200).incomeTaxAMD).toBe(100000);
    expect(estimateIncomeTaxFromNetSalary(149000).incomeTaxAMD).toBe(40000);
  });
  it("zero take-home does not invent taxable income", () => {
    expect(estimateIncomeTaxFromNetSalary(0)).toMatchObject({
      grossSalaryAMD: 0,
      incomeTaxAMD: 0,
      pensionAMD: 0,
      healthInsuranceAMD: 0,
    });
  });
  it.each([NaN, Infinity, -1, 0.1, 1e12 + 1, 1e12])(
    "rejects invalid or unrepresentable net amount %s",
    (value) => {
      expect(() => estimateIncomeTaxFromNetSalary(value)).toThrow();
    },
  );
});

describe("quarterly benefit allocations", () => {
  it("refunds interest up to the available tax; never reduces principal", () => {
    expect(
      allocateQuarterRefund(
        300000,
        [200000, 200000, 200000],
        [100000, 100000, 100000],
      ),
    ).toEqual([100000, 100000, 100000]);
    expect(
      allocateQuarterRefund(
        150000,
        [50000, 50000, 50000],
        [100000, 100000, 100000],
      ),
    ).toEqual([50000, 50000, 50000]);
  });
  it("quarter pooling is preserved rather than losing unused tax between months", () => {
    const rows = allocateQuarterRefund(
      300000,
      [200000, 100000, 50000],
      [100000, 100000, 100000],
    );
    expect(rows).toEqual([150000, 100000, 50000]);
  });
  it("reconciles tiny and capped allocations exactly", () => {
    expect(allocateQuarterRefund(2, [1, 1, 1], [10, 10, 10])).toEqual([
      1, 1, 0,
    ]);
    expect(
      allocateQuarterRefund(
        750000,
        [900000, 900000, 900000],
        [500000, 500000, 500000],
      ),
    ).toEqual([250000, 250000, 250000]);
  });
  it("declining payment reference reconciles with the refund API", () => {
    const financing = calculateFinancing({
      financingType: "mortgage",
      currency: "AMD",
      apartmentPrice: 35000000,
      downPaymentPercent: 20,
      downPaymentAmount: 7000000,
      annualInterestRatePercent: 13.25,
      durationMonths: 240,
      repaymentMethod: "equal_principal",
    });
    expect(financing.schedule[0]).toMatchObject({
      scheduledPayment: 425834,
      principalPaid: 116667,
      interestPaid: 309167,
    });
    expect(financing.schedule[239]).toMatchObject({
      scheduledPayment: 117955,
      remainingBalance: 0,
      interestPaid: 1288,
    });
    expect(financing.totalFinancedRepayment).toBe(65254587);
    const original = sample({ financing });
    original.participants[0].incomePeriods[0] = {
      ...original.participants[0].incomePeriods[0],
      toMonth: "2045-12",
    };
    const result = calculateMortgageRefundScenario(
      {
        financing,
        loanOriginationDate: original.loanOriginationDate,
        participants: original.participants.map(
          ({ id, role, incomePeriods }) => ({ id, role, incomePeriods }),
        ),
        payments: original.payments,
      },
      ARMENIA_REFUND_RULES_2026_10,
    );
    expect(
      result.monthlySchedule.reduce(
        (total, row) => total + row.allocatedRefundAMD!,
        0,
      ),
    ).toBe(result.totalEstimatedRefundAMD);
    expect(
      result.monthlySchedule.every(
        (row) => row.allocatedRefundAMD! <= row.eligibleInterestAMD!,
      ),
    ).toBe(true);
  });
});
