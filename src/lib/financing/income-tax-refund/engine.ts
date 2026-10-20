import { roundRatio, toWholeAmount } from "../arithmetic";
import { quarterFor } from "./calendar";
import { decision, evaluateLoanEligibility, reason } from "./eligibility";
import { quarterParticipantTax } from "./income";
import type { MortgageRefundInput, RefundRuleSet } from "./input";
import type { MortgageRefundResult, QuarterlyRefundResult, RefundReason } from "./output";
import { quarterlyCap } from "./rules";
import { validateMortgageRefundInput, validateRefundRules } from "./validation";

/** Unknown components stay unknown; never coerce missing financial data to zero. */
function sum(amounts: readonly (number | null)[]): number | null {
  if (amounts.some(amount => amount === null)) return null;
  return toWholeAmount(amounts.reduce<bigint>((total, amount) => total + BigInt(amount as number), 0n));
}

/** Refunds are independent quarterly estimates; bank payment obligations never change. */
export function calculateMortgageIncomeTaxRefund(
  input: MortgageRefundInput, rules: RefundRuleSet,
): MortgageRefundResult {
  validateRefundRules(rules);
  validateMortgageRefundInput(input);
  const mode = input.evidenceMode ?? "verified";
  const loanEligibility = evaluateLoanEligibility(input, rules);
  const cap = quarterlyCap(input.loanOriginationDate, rules);
  const groups = new Map<string, { period: ReturnType<typeof quarterFor>; indices: number[] }>();
  input.payments.forEach((payment, index) => {
    const period = quarterFor(payment.paymentDate);
    const group = groups.get(period.key);
    if (group) group.indices.push(index);
    else groups.set(period.key, { period, indices: [index] });
  });
  const monthlyIncomeTax: MortgageRefundResult["monthlyIncomeTax"][number][] = [];
  const quarterlySchedule: QuarterlyRefundResult[] = [];
  for (const { period, indices } of groups.values()) {
    const rows = indices.map(index => {
      const payment = input.payments[index];
      const schedule = input.financing.schedule[index];
      const isAMD = input.financing.currency === "AMD";
      return {
        month: schedule.month,
        projected: payment.interestBasis === "projected",
        scheduledInterest: isAMD ? schedule.interestPaid : payment.amountsAMD?.scheduledInterest ?? null,
        interest: isAMD ? (payment.interestBasis === "projected" ? schedule.interestPaid : payment.actualInterestPaid as number) : payment.amountsAMD?.interest ?? null,
        subsidy: isAMD ? payment.subsidizedInterest : payment.amountsAMD?.subsidizedInterest ?? null,
        mortgagePayment: isAMD ? schedule.scheduledPayment : payment.amountsAMD?.mortgagePayment ?? null,
      };
    });
    const projectedMortgageInterestAMD = sum(rows.map(row => row.scheduledInterest));
    const interestUsedAMD = sum(rows.map(row => row.interest));
    const subsidizedInterestAMD = sum(rows.map(row => row.subsidy));
    const eligibleInterestAMD = sum(rows.map(row => row.interest === null || row.subsidy === null ? null : row.interest - row.subsidy));
    const mortgagePaymentsBeforeRefundAMD = sum(rows.map(row => row.mortgagePayment));
    const taxes = input.participants.map(person => quarterParticipantTax(person, period.months, rules, mode));
    for (const tax of taxes) monthlyIncomeTax.push(...tax.monthly);
    const eligibleIncomeTaxAMD = sum(taxes.map(tax => tax.result.eligibleIncomeTaxAMD));
    const reasons: RefundReason[] = loanEligibility.reasons.filter(item => item.code !== "CONDITIONS_VERIFIED" && item.code !== "CONDITIONS_DECLARED");
    if (cap === null) reasons.push(reason("LEGACY_LOAN_REVIEW", "No supported quarterly cap covers this origination date.", "requires_verification"));
    if (eligibleInterestAMD === null || mortgagePaymentsBeforeRefundAMD === null) reasons.push(reason(
      "AMD_AMOUNTS_REQUIRED", "Supply explicit AMD payment, interest and subsidy amounts for this USD quarter; no FX conversion is assumed.", "requires_verification", period.key,
    ));
    for (const tax of taxes) if (tax.result.eligibility.status === "requires_verification") {
      reasons.push(...tax.result.eligibility.reasons);
    }
    if (taxes.every(tax => tax.result.eligibility.status === "ineligible")) {
      reasons.push(reason("NO_ELIGIBLE_PARTICIPANT", "No supplied participant has eligible salary income tax in this quarter.", "ineligible", period.key));
    }
    const eligibility = decision(reasons, mode);
    const estimatedRefundAMD = eligibility.status === "ineligible" ? 0 :
      eligibility.status === "requires_verification" || eligibleInterestAMD === null || eligibleIncomeTaxAMD === null || cap === null
        ? null : Math.min(eligibleInterestAMD, eligibleIncomeTaxAMD, cap);
    quarterlySchedule.push({
      year: period.year, quarter: period.quarter, periodStart: period.periodStart, periodEnd: period.periodEnd,
      paymentMonths: rows.map(row => row.month), projectedMortgageInterestAMD, interestUsedAMD,
      subsidizedInterestAMD, eligibleInterestAMD,
      verifiedInterestPaidAMD: sum(rows.map(row => row.projected ? 0 : row.interest)),
      hasProjectedInterest: rows.some(row => row.projected),
      hasProjectedTaxPayments: taxes.some(tax => tax.projected),
      eligibleIncomeTaxAMD, quarterlyRefundCapAMD: cap, estimatedRefundAMD,
      mortgagePaymentsBeforeRefundAMD,
      effectiveFinancingCostAMD: mortgagePaymentsBeforeRefundAMD === null || estimatedRefundAMD === null ? null : mortgagePaymentsBeforeRefundAMD - estimatedRefundAMD,
      eligibility, participants: taxes.map(tax => tax.result),
    });
  }
  const byYear = new Map<number, (number | null)[]>();
  for (const quarter of quarterlySchedule) {
    const values = byYear.get(quarter.year) ?? [];
    values.push(quarter.estimatedRefundAMD); byYear.set(quarter.year, values);
  }
  const totalEstimatedRefundAMD = sum(quarterlySchedule.map(row => row.estimatedRefundAMD));
  const totalMortgagePaymentsBeforeRefundAMD = sum(quarterlySchedule.map(row => row.mortgagePaymentsBeforeRefundAMD));
  const totalEffectiveFinancingCostAMD = sum(quarterlySchedule.map(row => row.effectiveFinancingCostAMD));
  const periodReasons = quarterlySchedule.filter(row => row.eligibility.status === "requires_verification")
    .flatMap(row => row.eligibility.reasons.filter(item => item.effect === "requires_verification"));
  const allPeriodsIneligible = quarterlySchedule.length > 0 && quarterlySchedule.every(row => row.eligibility.status === "ineligible");
  const eligibility = decision([...loanEligibility.reasons.filter(item => item.code !== "CONDITIONS_VERIFIED" && item.code !== "CONDITIONS_DECLARED"), ...periodReasons,
    ...(allPeriodsIneligible ? [reason("NO_ELIGIBLE_PARTICIPANT", "No quarter currently meets all refund conditions.", "ineligible")] : [])], mode);
  return {
    isEstimate: true, evidenceMode: mode, refundCurrency: "AMD", financingCurrency: input.financing.currency,
    originalRegularMonthlyBankPayment: input.financing.regularMonthlyPayment,
    bankPayments: input.payments.map((payment, index) => ({ month: payment.month,
      paymentDate: payment.paymentDate, originalBankPayment: input.financing.schedule[index].scheduledPayment })),
    monthlyIncomeTax, loanEligibility, eligibility, quarterlySchedule,
    annualRefunds: [...byYear].map(([year, amounts]) => ({ year, estimatedRefundAMD: sum(amounts) })),
    totalEstimatedRefundAMD, totalMortgagePaymentsBeforeRefundAMD, totalEffectiveFinancingCostAMD,
    effectiveAverageMonthlyFinancingCostAMD: totalEffectiveFinancingCostAMD === null ? null :
      toWholeAmount(roundRatio(BigInt(totalEffectiveFinancingCostAMD), BigInt(input.financing.durationMonths))),
    rules: { ...rules,
      quarterlyCaps: rules.quarterlyCaps.map(row => ({ ...row })),
      salaryRates: rules.salaryRates.map(row => ({ ...row })),
      yerevanCutoffs: { ...rules.yerevanCutoffs },
      firstRestrictedRegions: [...rules.firstRestrictedRegions],
      sources: rules.sources.map(source => ({ ...source })),
    },
    assumptions: [
      ...(mode === "declared" ? ["Conditional scenario: declared facts and explicitly accepted assumptions are used without document checks. This does not confirm entitlement."] : []),
      "This is an estimate, not SRC approval. Evidence verification flags are supplied by the caller; no government checks occur.",
      "Refunds are separate quarterly transfers. The effective monthly average is informational and never reduces the bank obligation.",
      "All amounts are whole units; refunds and salary tax are AMD. No exchange-rate conversion is performed.",
      "Interest is taken from the Phase 1 schedule unless a bank-confirmed paid amount is supplied; subsidies are excluded from refundable interest.",
      "Salary tax estimates use gross registered salary only; net salary, social payments and other payroll deductions are not calculated.",
      "Projected tax payments assume full settlement of salary tax for all three calendar months; withheld amounts alone do not prove payment.",
      "Quarterly caps are shared across all participants; unused tax, interest or caps do not carry between quarters.",
      "Annual refunds refer to interest/tax reporting quarters, not the year a refund is received. No receipt dates are predicted.",
      "Future projections hold the selected versioned rules constant; changes in law, salary, ownership and eligibility require recalculation.",
      "Effective financing costs exclude the down payment and subtract only the tax refund; other subsidy cash flows are not netted against bank payments.",
      "Participant IDs must identify distinct people across all jobs. Income inputs aggregate salary tax across employers whose obligations are fully settled.",
    ],
  };
}
