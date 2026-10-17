import { decimalRatio, roundRatio, toWholeAmount } from "../arithmetic";
import { invalid } from "./calendar";
import { decision, evaluateParticipant, reason } from "./eligibility";
import type { RefundParticipant, RefundRuleSet, SalaryIncomeTaxInput } from "./input";
import type { MonthlyIncomeTaxResult, QuarterlyParticipantTax, RefundReason, SalaryIncomeTaxResult } from "./output";
import { validateRefundRules, validateSalaryTaxInput } from "./validation";

/** Gross salary and salary income tax only; no net-salary or payroll deductions. */
export function calculateSalaryIncomeTax(input: SalaryIncomeTaxInput, rules: RefundRuleSet): SalaryIncomeTaxResult {
  validateRefundRules(rules);
  validateSalaryTaxInput(input);
  return salaryTax(input, rules);
}

function salaryTax(input: SalaryIncomeTaxInput, rules: RefundRuleSet): SalaryIncomeTaxResult {
  let rate: number | null = input.taxRatePercent ?? null;
  if (rate === null) for (const row of rules.salaryRates) if (input.month >= row.fromMonth) rate = row.ratePercent;
  let estimated: number | null = null;
  if (rate !== null) {
    const [numerator, denominator] = decimalRatio(rate);
    estimated = toWholeAmount(roundRatio(BigInt(input.grossRegisteredSalaryAMD) * numerator, denominator * 100n));
  }
  const actual = input.actualIncomeTaxWithheldAMD ?? null;
  return {
    month: input.month,
    estimatedSalaryIncomeTaxAMD: estimated,
    actualIncomeTaxWithheldAMD: actual,
    selectedIncomeTaxAMD: actual ?? estimated,
    taxRatePercent: rate,
    taxSource: actual !== null ? "actual_withheld" : rate === null ? "unresolved" :
      input.taxRatePercent === undefined ? "standard_rate" : "custom_rate",
  };
}

export function quarterParticipantTax(
  participant: RefundParticipant, months: readonly string[], rules: RefundRuleSet,
): { result: QuarterlyParticipantTax; monthly: MonthlyIncomeTaxResult[]; projected: boolean } {
  const legal = evaluateParticipant(participant);
  const reasons: RefundReason[] = legal.status === "eligible" ? [] : [...legal.reasons];
  const monthly: MonthlyIncomeTaxResult[] = [];
  let available = 0n;
  let projected = false;
  const add = (code: RefundReason["code"], message: string, effect: RefundReason["effect"], field: string) =>
    reasons.push(reason(code, message, effect, field, participant.id));
  for (const month of months) {
    const period = participant.incomePeriods.find(row => row.fromMonth <= month && row.toMonth >= month);
    if (period === undefined) {
      monthly.push({ participantId: participant.id, month, estimatedSalaryIncomeTaxAMD: null,
        actualIncomeTaxWithheldAMD: null, selectedIncomeTaxAMD: null, taxRatePercent: null,
        taxSource: "unresolved", taxPaymentStatus: "missing" });
      add("MISSING_INCOME_MONTH", `Supply income/tax data for ${month}, including an explicit zero if applicable.`, "requires_verification", month);
      continue;
    }
    const tax = salaryTax({ month, grossRegisteredSalaryAMD: period.grossRegisteredSalaryAMD,
      ...(period.actualIncomeTaxWithheldAMD === undefined ? {} : { actualIncomeTaxWithheldAMD: period.actualIncomeTaxWithheldAMD }),
      ...(period.taxRatePercent === undefined ? {} : { taxRatePercent: period.taxRatePercent }) }, rules);
    monthly.push({ ...tax, participantId: participant.id, taxPaymentStatus: period.taxPaymentStatus });
    if (tax.selectedIncomeTaxAMD === null) add("TAX_RATE_REQUIRES_VERIFICATION", `No standard flat rate covers ${month}; supply the actual withheld tax or a verified applicable rate.`, "requires_verification", month);
    if (period.taxPaymentStatus === "unknown") add("TAX_PAYMENT_UNKNOWN", `Tax payment status for ${month} is unknown. Withholding alone does not prove Treasury payment.`, "requires_verification", month);
    if (period.taxPaymentStatus === "unpaid") add("TAX_NOT_FULLY_PAID", `Salary income-tax obligations for ${month} are not fully paid; exclude this person's quarter until settled.`, "ineligible", month);
    if (period.taxPaymentStatus === "projected") projected = true;
    if (period.tuitionRefundClaimed === true) add("TUITION_BENEFIT_OVERLAP", `Tuition-tax refund overlaps ${month}; this person's quarter cannot also claim mortgage refunds.`, "ineligible", month);
    if (period.tuitionRefundClaimed === null || period.taxAlreadyAllocatedAMD === null) {
      add("OTHER_BENEFIT_REVIEW", `Resolve other tax benefits/allocations for ${month} before counting this tax.`, "requires_verification", month);
    }
    if (tax.selectedIncomeTaxAMD !== null && period.taxAlreadyAllocatedAMD !== null) {
      if (period.taxAlreadyAllocatedAMD > tax.selectedIncomeTaxAMD) invalid("Allocated tax exceeds the salary income tax available in this month.", `participants.${participant.id}.${month}.taxAlreadyAllocatedAMD`);
      available += BigInt(tax.selectedIncomeTaxAMD - period.taxAlreadyAllocatedAMD);
    }
  }
  const eligibility = decision(reasons);
  return { result: { participantId: participant.id, eligibility,
    eligibleIncomeTaxAMD: eligibility.status === "eligible" ? toWholeAmount(available) :
      eligibility.status === "ineligible" ? 0 : null }, monthly, projected };
}
