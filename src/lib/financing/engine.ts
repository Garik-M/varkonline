import { annuityPayment, decimalRatio, roundRatio, toWholeAmount } from "./arithmetic";
import type { FinancingInput } from "./input";
import type { FinancingResult, FinancingScheduleEntry } from "./output";
import { validateFinancingInput } from "./validation";

/** Pure estimates in the supplied currency; no conversion or external state. */
export function calculateFinancing(input: FinancingInput): FinancingResult {
  validateFinancingInput(input);
  const price = BigInt(input.apartmentPrice);
  const [downNumerator, downDenominator] = decimalRatio(input.downPaymentPercent);
  const downPayment = roundRatio(price * downNumerator, downDenominator * 100n);
  const principal = price - downPayment;
  const [rateNumerator, annualRateDenominator] = decimalRatio(
    input.financingType === "mortgage" ? input.annualInterestRatePercent : 0,
  );
  // Annual percentage points -> nominal monthly fraction (divide by 100 * 12).
  const rateDenominator = annualRateDenominator * 1200n;
  const regularPayment = principal === 0n ? 0n : annuityPayment(
    principal, rateNumerator, rateDenominator, input.durationMonths,
  );
  const schedule: FinancingScheduleEntry[] = [];
  let balance = principal;
  let totalInterest = 0n;
  let totalRepayment = 0n;

  // A fully paid purchase has no financing schedule. Otherwise retain all months,
  // including zero rows if whole-unit rounding settles a tiny principal early.
  for (let month = 1; principal > 0n && month <= input.durationMonths; month++) {
    const interest = roundRatio(balance * rateNumerator, rateDenominator);
    const amountDue = balance + interest;
    const payment = month === input.durationMonths || regularPayment > amountDue
      ? amountDue : regularPayment;
    const principalPaid = payment - interest;
    const remaining = balance - principalPaid;
    schedule.push({
      month,
      openingBalance: toWholeAmount(balance),
      scheduledPayment: toWholeAmount(payment),
      principalPaid: toWholeAmount(principalPaid),
      interestPaid: toWholeAmount(interest),
      remainingBalance: toWholeAmount(remaining),
    });
    balance = remaining;
    totalInterest += interest;
    totalRepayment += payment;
  }

  const common = {
    currency: input.currency,
    isEstimate: true as const,
    apartmentPrice: input.apartmentPrice,
    downPaymentPercent: input.downPaymentPercent,
    downPaymentAmount: toWholeAmount(downPayment),
    financedPrincipal: toWholeAmount(principal),
    durationMonths: input.durationMonths,
    regularMonthlyPayment: toWholeAmount(regularPayment),
    totalInterest: toWholeAmount(totalInterest),
    totalFinancedRepayment: toWholeAmount(totalRepayment),
    totalCostIncludingDownPayment: toWholeAmount(downPayment + totalRepayment),
    schedule,
  };
  return input.financingType === "mortgage"
    ? { ...common, financingType: "mortgage", annualInterestRatePercent: input.annualInterestRatePercent }
    : { ...common, financingType: "developer_installment", formula: input.formula, annualInterestRatePercent: null };
}
