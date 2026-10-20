export { calculateMortgageIncomeTaxRefund, calculateMortgageRefundScenario } from "./engine";
export { calculateSalaryIncomeTax } from "./income";
export { evaluateMortgageRefundEligibility } from "./eligibility";
export { ARMENIA_REFUND_RULES_2026_10 } from "./rules";
export { validateMortgageRefundInput, validateRefundRules, validateRefundEligibilityContext, validateSalaryTaxInput } from "./validation";
export { FinancingCalculationError } from "../errors";
export type {
  Evidence, EvidenceMode, EligibilityStatus, ArmenianRegion, PropertyLocation, AcquisitionType,
  MortgageEligibilityFacts, ParticipantEligibilityFacts, IncomePeriod, SalaryIncomeTaxInput,
  RefundParticipant, DatedMortgagePayment, MortgageRefundInput, MortgageRefundScenarioInput, MortgageEligibilityContext, RefundRuleSet,
} from "./input";
export type {
  RefundReasonCode, RefundReason, RefundEligibilityResult, SalaryIncomeTaxResult,
  MonthlyIncomeTaxResult, QuarterlyParticipantTax, QuarterlyRefundResult, MortgageRefundResult,
} from "./output";
export { estimateIncomeTaxFromNetSalary, standardEmployeePayroll, NET_SALARY_MODEL } from "./net-salary";
export type { NetSalaryEstimate } from "./net-salary";
