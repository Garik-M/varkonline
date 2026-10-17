import { describe, expect, it } from "vitest";
import {
  calculateFinancing,
  FINANCING_LIMITS,
  type DeveloperInstallmentInput,
  type FinancingInput,
  type FinancingCurrency,
  type FinancingResult,
  type MortgageInput,
} from "..";
import { referenceCases } from "./reference-cases";

const mortgage: MortgageInput = {
  currency: "AMD",
  financingType: "mortgage",
  apartmentPrice: 50_000_000,
  downPaymentPercent: 20,
  annualInterestRatePercent: 12,
  durationMonths: 240,
};
const developer: DeveloperInstallmentInput = {
  currency: "AMD",
  financingType: "developer_installment",
  formula: "interest_free",
  apartmentPrice: 30_000_001,
  downPaymentPercent: 10,
  durationMonths: 36,
};

const currencies: readonly FinancingCurrency[] = ["AMD", "USD"];

function expectReconciliation(result: FinancingResult): void {
  let balance = result.financedPrincipal;
  let principal = 0;
  let interest = 0;
  let payments = 0;
  const invalidRows: number[] = [];
  for (const [index, row] of result.schedule.entries()) {
    if (
      row.month !== index + 1 ||
      !Object.values(row).every(amount => Number.isSafeInteger(amount) && amount >= 0) ||
      row.openingBalance !== balance ||
      row.scheduledPayment !== row.principalPaid + row.interestPaid ||
      row.remainingBalance !== row.openingBalance - row.principalPaid ||
      (index < result.schedule.length - 1 && row.scheduledPayment !== Math.min(
        result.regularMonthlyPayment, row.openingBalance + row.interestPaid,
      ))
    ) {
      invalidRows.push(index + 1);
    }
    balance = row.remainingBalance;
    principal += row.principalPaid;
    interest += row.interestPaid;
    payments += row.scheduledPayment;
  }
  expect(invalidRows, "months violating schedule invariants").toEqual([]);
  expect(balance).toBe(0);
  expect(principal).toBe(result.financedPrincipal);
  expect(interest).toBe(result.totalInterest);
  expect(payments).toBe(result.totalFinancedRepayment);
  expect(payments).toBe(result.financedPrincipal + result.totalInterest);
  expect(result.apartmentPrice).toBe(result.downPaymentAmount + result.financedPrincipal);
  expect(result.totalCostIncludingDownPayment).toBe(result.downPaymentAmount + payments);
  expect(result.schedule).toHaveLength(result.financedPrincipal === 0 ? 0 : result.durationMonths);
}

describe("independent Decimal reference examples", () => {
  it.each(referenceCases)("matches $input.apartmentPrice $input.currency / $input.annualInterestRatePercent% / $input.durationMonths months", ({ input, expected, checkpoints }) => {
    const result = calculateFinancing(input);
    expect(result).toMatchObject(expected);
    for (const row of checkpoints) expect(result.schedule[row.month - 1]).toEqual(row);
    expectReconciliation(result);
  });

  it.each(currencies)("matches a complete hand-calculated 3-month mortgage in %s", currency => {
    const result = calculateFinancing({ ...mortgage, currency, apartmentPrice: 1_250, durationMonths: 3 });
    // Principal 1,000; nominal 12% -> 1% monthly; rounded annuity 340 whole units.
    expect(result.schedule).toEqual([
      { month: 1, openingBalance: 1000, scheduledPayment: 340, principalPaid: 330, interestPaid: 10, remainingBalance: 670 },
      { month: 2, openingBalance: 670, scheduledPayment: 340, principalPaid: 333, interestPaid: 7, remainingBalance: 337 },
      { month: 3, openingBalance: 337, scheduledPayment: 340, principalPaid: 337, interestPaid: 3, remainingBalance: 0 },
    ]);
    expect(result.totalInterest).toBe(20);
    expect(result.totalCostIncludingDownPayment).toBe(1270);
  });
});

describe("interest-free financing", () => {
  it.each(currencies)("divides developer principal equally and adjusts the final installment in %s", currency => {
    const result = calculateFinancing({ ...developer, currency });
    // 30,000,001 - round(3,000,000.1) = 27,000,001 = 35 * 750,000 + 750,001.
    expect(result).toMatchObject({
      currency, financingType: "developer_installment", formula: "interest_free", annualInterestRatePercent: null,
      downPaymentAmount: 3_000_000, financedPrincipal: 27_000_001,
      regularMonthlyPayment: 750_000, totalInterest: 0,
      totalFinancedRepayment: 27_000_001, totalCostIncludingDownPayment: 30_000_001,
    });
    expect(result.schedule[35].scheduledPayment).toBe(750_001);
    expect(result.schedule.every(row => row.interestPaid === 0)).toBe(true);
    expectReconciliation(result);
  });

  it("handles a downward final adjustment", () => {
    const result = calculateFinancing({ ...developer, apartmentPrice: 100, downPaymentPercent: 0, durationMonths: 6 });
    expect(result.regularMonthlyPayment).toBe(17);
    expect(result.schedule.map(row => row.scheduledPayment)).toEqual([17, 17, 17, 17, 17, 15]);
    expectReconciliation(result);
  });

  it("calculates the same cash flows for an explicit zero-rate mortgage", () => {
    const installment = calculateFinancing(developer);
    const result = calculateFinancing({ ...mortgage, apartmentPrice: developer.apartmentPrice,
      downPaymentPercent: developer.downPaymentPercent, durationMonths: developer.durationMonths,
      annualInterestRatePercent: 0 });
    expect(result.annualInterestRatePercent).toBe(0);
    expect(result.schedule).toEqual(installment.schedule);
    expect(result.totalCostIncludingDownPayment).toBe(installment.totalCostIncludingDownPayment);
  });
});

describe("explicit AMD and USD denominations", () => {
  it.each([mortgage, developer])("preserves currency without converting amounts for $financingType", input => {
    const amd = calculateFinancing({ ...input, currency: "AMD" });
    const usd = calculateFinancing({ ...input, currency: "USD" });
    expect(usd.currency).toBe("USD");
    expect({ ...usd, currency: "AMD" }).toEqual(amd);
    expect(JSON.parse(JSON.stringify(usd))).toEqual(usd);
  });

  it.each(currencies)("rounds half-unit ties upward in %s", currency => {
    const loan = calculateFinancing({ ...mortgage, currency, apartmentPrice: 50,
      downPaymentPercent: 0, durationMonths: 1 });
    expect(loan.regularMonthlyPayment).toBe(51);
    expect(loan.totalInterest).toBe(1);
    const plan = calculateFinancing({ ...developer, currency, apartmentPrice: 101,
      downPaymentPercent: 50, durationMonths: 1 });
    expect(plan.downPaymentAmount).toBe(51);
    expect(plan.totalFinancedRepayment).toBe(50);
  });

  it.each(currencies)("supports down payment boundaries and zero rates in %s", currency => {
    for (const input of [mortgage, developer]) {
      for (const downPaymentPercent of [0, 100]) {
        const result = calculateFinancing({ ...input, currency, downPaymentPercent });
        expect(result.currency).toBe(currency);
        expect(result.downPaymentAmount).toBe(downPaymentPercent === 0 ? 0 : input.apartmentPrice);
        expectReconciliation(result);
      }
    }
    const zeroRate = calculateFinancing({ ...mortgage, currency, apartmentPrice: 100,
      downPaymentPercent: 0, annualInterestRatePercent: 0, durationMonths: 6 });
    expect(zeroRate.regularMonthlyPayment).toBe(17);
    expect(zeroRate.totalInterest).toBe(0);
    expect(zeroRate.schedule.map(row => row.scheduledPayment)).toEqual([17, 17, 17, 17, 17, 15]);
    expectReconciliation(zeroRate);
  });
});

describe("precision and down payment boundaries", () => {
  it.each([mortgage, developer])("supports 0% down for $financingType", input => {
    const result = calculateFinancing({ ...input, downPaymentPercent: 0 });
    expect(result.downPaymentAmount).toBe(0);
    expect(result.financedPrincipal).toBe(input.apartmentPrice);
    expectReconciliation(result);
  });

  it.each([mortgage, developer])("returns no financing for 100% down for $financingType", input => {
    const result = calculateFinancing({ ...input, downPaymentPercent: 100 });
    expect(result).toMatchObject({ downPaymentAmount: input.apartmentPrice, financedPrincipal: 0,
      regularMonthlyPayment: 0, totalInterest: 0, totalFinancedRepayment: 0,
      totalCostIncludingDownPayment: input.apartmentPrice, durationMonths: input.durationMonths, schedule: [] });
    expectReconciliation(result);
  });

  it("rounds exact half-AMD down payments upward", () => {
    const result = calculateFinancing({ ...developer, apartmentPrice: 101, downPaymentPercent: 50, durationMonths: 1 });
    expect(result.downPaymentAmount).toBe(51);
    expect(result.schedule[0].scheduledPayment).toBe(50);
  });

  it("rounds exact half-AMD interest and annuity payments upward", () => {
    const result = calculateFinancing({ ...mortgage, apartmentPrice: 50, downPaymentPercent: 0, durationMonths: 1 });
    expect(result.regularMonthlyPayment).toBe(51);
    expect(result.totalInterest).toBe(1); // 50 * 12 / 1200 = 0.5.
    expect(result.totalFinancedRepayment).toBe(51);
  });

  it("rounds exact half-AMD interest-free payments upward", () => {
    const result = calculateFinancing({ ...developer, apartmentPrice: 101, downPaymentPercent: 0, durationMonths: 2 });
    expect(result.regularMonthlyPayment).toBe(51);
    expect(result.schedule.map(row => row.scheduledPayment)).toEqual([51, 50]);
  });

  it("evaluates decimal interest ties exactly instead of binary floating point", () => {
    const result = calculateFinancing({ ...mortgage, apartmentPrice: 100_000, downPaymentPercent: 0,
      annualInterestRatePercent: 0.006, durationMonths: 1 });
    expect(result.totalInterest).toBe(1); // Exactly 0.5 AMD, sometimes 0.499999... in binary.
    expect(result.regularMonthlyPayment).toBe(100_001);
  });

  it("supports percentage numbers expressed in scientific notation", () => {
    const result = calculateFinancing({ ...mortgage, apartmentPrice: 1_000_000_000_000,
      downPaymentPercent: 1e-7, annualInterestRatePercent: 3e-7, durationMonths: 1 });
    expect(result.downPaymentAmount).toBe(1000);
    expect(result.totalInterest).toBe(250);
    expect(result.regularMonthlyPayment).toBe(999_999_999_250);
  });

  it("handles the smallest finite rate without cancellation or underflow", () => {
    const result = calculateFinancing({ ...mortgage, apartmentPrice: 600,
      downPaymentPercent: 0, annualInterestRatePercent: Number.MIN_VALUE, durationMonths: 600 });
    expect(result.regularMonthlyPayment).toBe(1);
    expect(result.totalInterest).toBe(0);
    expectReconciliation(result);
  });

  it.each([mortgage, developer])("handles tiny principals and zero regular payments for $financingType", input => {
    const result = calculateFinancing({ ...input, apartmentPrice: 1, downPaymentPercent: 0, durationMonths: 600 });
    expect(result.regularMonthlyPayment).toBe(0);
    expect(result.schedule[599].scheduledPayment).toBe(1);
    expectReconciliation(result);
  });

  it("retains zero rows after a tiny balance settles early", () => {
    const result = calculateFinancing({ ...developer, apartmentPrice: 2, downPaymentPercent: 0, durationMonths: 3 });
    expect(result.schedule.map(row => row.scheduledPayment)).toEqual([1, 1, 0]);
    expectReconciliation(result);
  });

  it("can round a near-100% down payment to the full price", () => {
    const result = calculateFinancing({ ...mortgage, apartmentPrice: 1, downPaymentPercent: 99.9 });
    expect(result.financedPrincipal).toBe(0);
    expectReconciliation(result);
  });
});

describe("determinism, serialization and reconciliation across the supported domain", () => {
  it("does not mutate inputs or retain shared output state", () => {
    const input = Object.freeze({ ...mortgage });
    const first = calculateFinancing(input);
    const second = calculateFinancing(input);
    expect(first).toEqual(second);
    expect(first.schedule).not.toBe(second.schedule);
    expect(first.schedule[0]).not.toBe(second.schedule[0]);
    expect(input).toEqual(mortgage);
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
    expect(first).toMatchObject({ currency: "AMD", isEstimate: true });
  });

  const reconciliationCases = currencies.flatMap(currency =>
    [1, 2, 101, 123_457, 37_123_459, FINANCING_LIMITS.maxApartmentPrice]
      .map(apartmentPrice => ({ currency, apartmentPrice })),
  );
  it.each(reconciliationCases)("reconciles rates, terms and deposits for $apartmentPrice $currency", ({ currency, apartmentPrice }) => {
    for (const annualInterestRatePercent of [0, 0.006, 9.5, 100]) {
      for (const durationMonths of [1, 3, 120, 600]) {
        for (const downPaymentPercent of [0, 12.5, 99.9, 100]) {
          const input: FinancingInput = { currency, financingType: "mortgage", apartmentPrice,
            annualInterestRatePercent, durationMonths, downPaymentPercent };
          expectReconciliation(calculateFinancing(input));
          if (annualInterestRatePercent === 0) {
            expectReconciliation(calculateFinancing({ ...developer, currency, apartmentPrice,
              durationMonths, downPaymentPercent }));
          }
        }
      }
    }
  });
});
