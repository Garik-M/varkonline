import { validateFinancingInput, FINANCING_LIMITS } from "../validation";
import { isDate, isMonth, invalid, monthIndex } from "./calendar";
import type { MortgageEligibilityContext, MortgageRefundInput, RefundRuleSet, SalaryIncomeTaxInput } from "./input";

const MAX_AMOUNT = FINANCING_LIMITS.maxApartmentPrice;
const regions = ["aragatsotn", "ararat", "armavir", "kotayk", "shirak", "lori", "tavush", "gegharkunik", "syunik", "vayots_dzor"];
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

function object(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) invalid("Expected an object.", field);
  return value as Record<string, unknown>;
}

function shape(value: unknown, field: string, required: readonly string[], optional: readonly string[] = []) {
  const result = object(value, field);
  for (const key of required) if (!own(result, key)) invalid(`Missing ${key}.`, `${field}.${key}`);
  for (const key of Reflect.ownKeys(result)) {
    if (typeof key !== "string" || ![...required, ...optional].includes(key)) invalid(`Unsupported field ${String(key)}.`, field);
  }
  return result;
}

function number(value: unknown, field: string, max: number = MAX_AMOUNT, integer = true): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max ||
      (integer && !Number.isSafeInteger(value))) invalid(`Expected a finite nonnegative ${integer ? "whole " : ""}number up to ${max}.`, field);
}
function bool(value: unknown, field: string): asserts value is boolean {
  if (typeof value !== "boolean") invalid("Expected an explicit boolean.", field);
}
function text(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value || value.length > 500) invalid("Expected a nonempty trimmed string.", field);
}
function choice(value: unknown, options: readonly unknown[], field: string) {
  if (!options.includes(value)) invalid("Unsupported value.", field);
}
function date(value: unknown, field: string): asserts value is string {
  if (!isDate(value)) invalid("Expected a valid Gregorian YYYY-MM-DD date.", field);
}
function month(value: unknown, field: string): asserts value is string {
  if (!isMonth(value)) invalid("Expected YYYY-MM.", field);
}
function array(value: unknown, field: string, max: number): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length > max) invalid(`Expected an array of at most ${max} entries.`, field);
}
function evidence(value: unknown, field: string, validateValue: (value: unknown, field: string) => void) {
  if (value === null) return;
  const fact = shape(value, field, ["value", "verified"]);
  bool(fact.verified, `${field}.verified`);
  validateValue(fact.value, `${field}.value`);
}

function location(value: unknown, field: string) {
  const data = object(value, field);
  if (data.region === "yerevan") {
    shape(data, field, ["region", "valuationZone"]);
    choice(data.valuationZone, [1, 2, 3, "other", null], field);
  } else if (data.region === "outside_armenia") shape(data, field, ["region"]);
  else {
    shape(data, field, ["region", "governmentBorderSettlement"]);
    choice(data.region, regions, `${field}.region`);
    evidence(data.governmentBorderSettlement, `${field}.governmentBorderSettlement`, bool);
  }
}

function financing(value: unknown) {
  const raw = object(value, "financing");
  const data = shape(raw, "financing", ["financingType", "currency", "isEstimate", "apartmentPrice",
    "downPaymentPercent", "downPaymentAmount", "financedPrincipal", "annualInterestRatePercent",
    "durationMonths", "regularMonthlyPayment", "totalInterest", "totalFinancedRepayment",
    "totalCostIncludingDownPayment", "schedule", ...(raw.financingType === "developer_installment" ? ["formula"] : [])]);
  const originalInput = {
    financingType: data.financingType, currency: data.currency, apartmentPrice: data.apartmentPrice,
    downPaymentPercent: data.downPaymentPercent, durationMonths: data.durationMonths,
    ...(data.financingType === "mortgage" ? { annualInterestRatePercent: data.annualInterestRatePercent } : { formula: data.formula }),
  };
  validateFinancingInput(originalInput);
  if (data.isEstimate !== true) invalid("Expected a Phase 1 estimate.", "financing.isEstimate");
  if (data.financingType === "developer_installment" && data.annualInterestRatePercent !== null) {
    invalid("Developer annual rate must be null.", "financing.annualInterestRatePercent");
  }
  for (const key of ["downPaymentAmount", "financedPrincipal", "regularMonthlyPayment", "totalInterest", "totalFinancedRepayment", "totalCostIncludingDownPayment"]) {
    number(data[key], `financing.${key}`, Number.MAX_SAFE_INTEGER);
  }
  array(data.schedule, "financing.schedule", FINANCING_LIMITS.maxDurationMonths);
  const amount = data as unknown as MortgageRefundInput["financing"];
  if (amount.apartmentPrice !== amount.downPaymentAmount + amount.financedPrincipal ||
      amount.totalCostIncludingDownPayment !== amount.downPaymentAmount + amount.totalFinancedRepayment ||
      amount.totalFinancedRepayment !== amount.financedPrincipal + amount.totalInterest ||
      amount.schedule.length !== (amount.financedPrincipal === 0 ? 0 : amount.durationMonths)) {
    invalid("Phase 1 amounts or schedule length do not reconcile.", "financing");
  }
  let balance = BigInt(amount.financedPrincipal);
  let totalInterest = 0n;
  let totalPayments = 0n;
  for (const [index, row] of amount.schedule.entries()) {
    const raw = shape(row, `financing.schedule.${index}`, ["month", "openingBalance", "scheduledPayment", "principalPaid", "interestPaid", "remainingBalance"]);
    for (const [key, value] of Object.entries(raw)) number(value, `financing.schedule.${index}.${key}`, Number.MAX_SAFE_INTEGER);
    if (row.month !== index + 1 || BigInt(row.openingBalance) !== balance ||
        BigInt(row.scheduledPayment) !== BigInt(row.principalPaid) + BigInt(row.interestPaid) ||
        BigInt(row.remainingBalance) !== balance - BigInt(row.principalPaid) ||
        (amount.financingType === "developer_installment" && row.interestPaid !== 0)) {
      invalid("Phase 1 schedule rows do not reconcile.", `financing.schedule.${index}`);
    }
    if (index < amount.schedule.length - 1) {
      const due = balance + BigInt(row.interestPaid);
      const regular = BigInt(amount.regularMonthlyPayment);
      if (BigInt(row.scheduledPayment) !== (regular < due ? regular : due)) {
        invalid("Phase 1 scheduled payments do not match the regular payment contract.", `financing.schedule.${index}`);
      }
    }
    balance = BigInt(row.remainingBalance);
    totalInterest += BigInt(row.interestPaid);
    totalPayments += BigInt(row.scheduledPayment);
  }
  if (balance !== 0n || totalInterest !== BigInt(amount.totalInterest) || totalPayments !== BigInt(amount.totalFinancedRepayment)) {
    invalid("Phase 1 schedule totals do not reconcile.", "financing.schedule");
  }
}

export function validateRefundRules(input: unknown): asserts input is RefundRuleSet {
  const data = shape(input, "rules", ["version", "reviewedAsOf", "supportedOriginationsFrom", "maxContractPriceAMD", "quarterlyCaps", "salaryRates", "yerevanCutoffs", "permitExceptionBefore", "firstRegionalCutoff", "firstRestrictedRegions", "otherRegionalCutoff", "sources"]);
  text(data.version, "rules.version");
  for (const key of ["reviewedAsOf", "supportedOriginationsFrom", "permitExceptionBefore", "firstRegionalCutoff", "otherRegionalCutoff"]) date(data[key], `rules.${key}`);
  number(data.maxContractPriceAMD, "rules.maxContractPriceAMD");
  if (data.maxContractPriceAMD === 0) invalid("Contract limit must be positive.", "rules.maxContractPriceAMD");
  const zones = shape(data.yerevanCutoffs, "rules.yerevanCutoffs", ["1", "2", "3", "other"]);
  for (const key of Object.keys(zones)) date(zones[key], `rules.yerevanCutoffs.${key}`);
  array(data.firstRestrictedRegions, "rules.firstRestrictedRegions", 10);
  const seen = new Set<string>();
  for (const value of data.firstRestrictedRegions) {
    choice(value, regions, "rules.firstRestrictedRegions");
    if (seen.has(String(value))) invalid("Duplicate region.", "rules.firstRestrictedRegions");
    seen.add(String(value));
  }
  for (const [key, timeKey, valueKey] of [["quarterlyCaps", "fromDate", "amountAMD"], ["salaryRates", "fromMonth", "ratePercent"]]) {
    const rows = data[key]; array(rows, `rules.${key}`, 100);
    if (rows.length === 0) invalid("At least one rule is required.", `rules.${key}`);
    let previous = "";
    for (const row of rows) {
      const entry = shape(row, `rules.${key}`, [timeKey, valueKey]);
      if (timeKey === "fromDate") date(entry[timeKey], `rules.${key}`); else month(entry[timeKey], `rules.${key}`);
      number(entry[valueKey], `rules.${key}`, valueKey === "ratePercent" ? 100 : MAX_AMOUNT, valueKey !== "ratePercent");
      const time = String(entry[timeKey]);
      if (time <= previous) invalid("Rules must be strictly ordered without duplicate dates.", `rules.${key}`);
      previous = time;
    }
  }
  array(data.sources, "rules.sources", 50);
  if (data.sources.length === 0) invalid("Rules require traceable legal sources.", "rules.sources");
  for (const value of data.sources) {
    const source = shape(value, "rules.sources", ["id", "url", "description"]);
    for (const key of Object.keys(source)) text(source[key], `rules.sources.${key}`);
    if (!String(source.url).startsWith("https://")) invalid("Source URL must use HTTPS.", "rules.sources.url");
  }
}

export function validateSalaryTaxInput(input: unknown): asserts input is SalaryIncomeTaxInput {
  const data = shape(input, "salary", ["month", "grossRegisteredSalaryAMD"], ["actualIncomeTaxWithheldAMD", "taxRatePercent"]);
  month(data.month, "salary.month");
  number(data.grossRegisteredSalaryAMD, "salary.grossRegisteredSalaryAMD");
  if (own(data, "actualIncomeTaxWithheldAMD")) number(data.actualIncomeTaxWithheldAMD, "salary.actualIncomeTaxWithheldAMD", data.grossRegisteredSalaryAMD);
  if (own(data, "taxRatePercent")) number(data.taxRatePercent, "salary.taxRatePercent", 100, false);
}

function validateContext(data: Record<string, unknown>) {
  if (own(data, "evidenceMode")) choice(data.evidenceMode, ["verified", "declared"], "evidenceMode");
  financing(data.financing);
  date(data.loanOriginationDate, "loanOriginationDate");
  bool(data.originationDateVerified, "originationDateVerified");
  const facts = shape(data.eligibility, "eligibility", ["residentFinancialLender", "fundsUsedForHousing", "acquisitionType", "contractPriceAMD", "location", "permitDecisionDate", "propertyRightsRegistered", "requiredDocumentsAvailable", "validSelfBuildPermit"]);
  for (const key of ["residentFinancialLender", "fundsUsedForHousing", "propertyRightsRegistered", "requiredDocumentsAvailable", "validSelfBuildPermit"]) evidence(facts[key], `eligibility.${key}`, bool);
  evidence(facts.contractPriceAMD, "eligibility.contractPriceAMD", (value, field) => { number(value, field); if (value === 0) invalid("Contract price must be positive.", field); });
  evidence(facts.acquisitionType, "eligibility.acquisitionType", (value, field) => choice(value, ["developer_apartment", "developer_house", "state_or_community_apartment", "self_build_house", "secondary_market", "assignment_from_individual", "construction_right_acquisition"], field));
  evidence(facts.location, "eligibility.location", location);
  evidence(facts.permitDecisionDate, "eligibility.permitDecisionDate", (value, field) => { if (value !== null) date(value, field); });
}

export function validateRefundEligibilityContext(input: unknown): asserts input is MortgageEligibilityContext {
  const data = shape(input, "eligibilityContext", ["financing", "loanOriginationDate", "originationDateVerified", "eligibility"], ["evidenceMode"]);
  validateContext(data);
}

export function validateMortgageRefundInput(input: unknown): asserts input is MortgageRefundInput {
  const data = shape(input, "refund", ["financing", "loanOriginationDate", "originationDateVerified", "eligibility", "participants", "payments"], ["evidenceMode"]);
  validateContext(data);
  array(data.participants, "participants", 20);
  if (data.participants.length === 0) invalid("A borrower is required.", "participants");
  const ids = new Set<string>(); let borrowers = 0;
  for (const [index, value] of data.participants.entries()) {
    const field = `participants.${index}`;
    const person = shape(value, field, ["id", "role", "eligibility", "incomePeriods"]);
    text(person.id, `${field}.id`);
    if (ids.has(person.id)) invalid("Duplicate participant: income tax must not be counted twice.", `${field}.id`);
    ids.add(person.id);
    choice(person.role, ["borrower", "co_borrower"], `${field}.role`);
    if (person.role === "borrower") borrowers++;
    const eligibility = shape(person.eligibility, `${field}.eligibility`, ["employee", "ownerOrCoOwner", "requiredIdentityOrResidenceDocument", "priorBenefitUse"]);
    for (const key of ["employee", "ownerOrCoOwner", "requiredIdentityOrResidenceDocument"]) evidence(eligibility[key], `${field}.eligibility.${key}`, bool);
    evidence(eligibility.priorBenefitUse, `${field}.eligibility.priorBenefitUse`, (value, path) => choice(value, ["none", "same_mortgage", "other_post_2018_mortgage", "pre_2018_only"], path));
    array(person.incomePeriods, `${field}.incomePeriods`, 612);
    const spans: { from: string; to: string }[] = [];
    for (const value of person.incomePeriods) {
      const path = `${field}.incomePeriods`;
      const period = shape(value, path, ["fromMonth", "toMonth", "grossRegisteredSalaryAMD", "taxPaymentStatus", "tuitionRefundClaimed", "taxAlreadyAllocatedAMD"], ["actualIncomeTaxWithheldAMD", "taxRatePercent"]);
      month(period.fromMonth, `${path}.fromMonth`); month(period.toMonth, `${path}.toMonth`);
      if (period.fromMonth > period.toMonth) invalid("Income range ends before it starts.", path);
      spans.push({ from: period.fromMonth, to: period.toMonth });
      number(period.grossRegisteredSalaryAMD, `${path}.grossRegisteredSalaryAMD`);
      for (const key of ["actualIncomeTaxWithheldAMD", "taxRatePercent"]) if (own(period, key)) {
        number(period[key], `${path}.${key}`, key === "taxRatePercent" ? 100 : period.grossRegisteredSalaryAMD, key !== "taxRatePercent");
      }
      choice(period.taxPaymentStatus, ["projected", "verified_paid", "unpaid", "unknown"], `${path}.taxPaymentStatus`);
      if (period.taxPaymentStatus === "verified_paid" && !own(period, "actualIncomeTaxWithheldAMD")) invalid("Verified paid tax requires an actual withheld amount.", path);
      if (period.tuitionRefundClaimed !== null) bool(period.tuitionRefundClaimed, `${path}.tuitionRefundClaimed`);
      if (period.taxAlreadyAllocatedAMD !== null) number(period.taxAlreadyAllocatedAMD, `${path}.taxAlreadyAllocatedAMD`, period.grossRegisteredSalaryAMD);
    }
    spans.sort((a, b) => a.from < b.from ? -1 : a.from > b.from ? 1 : 0);
    for (let i = 1; i < spans.length; i++) if (spans[i].from <= spans[i - 1].to) invalid("Overlapping income periods would count tax twice.", `${field}.incomePeriods`);
  }
  if (borrowers !== 1) invalid("Supply exactly one borrower, followed by optional distinct co-borrowers.", "participants");

  const finance = data.financing as MortgageRefundInput["financing"];
  const originated = data.loanOriginationDate as string; // Validated by validateContext.
  array(data.payments, "payments", FINANCING_LIMITS.maxDurationMonths);
  if (data.payments.length !== finance.schedule.length) invalid("Supply one explicit payment date for every Phase 1 schedule row.", "payments");
  let previousMonth: number | null = null;
  for (const [index, value] of data.payments.entries()) {
    const path = `payments.${index}`;
    const payment = shape(value, path, ["month", "paymentDate", "interestBasis", "subsidizedInterest"], ["actualInterestPaid", "amountsAMD"]);
    if (payment.month !== index + 1) invalid("Payment month must match the Phase 1 schedule row.", `${path}.month`);
    date(payment.paymentDate, `${path}.paymentDate`);
    if (payment.paymentDate <= originated) invalid("Payments must follow origination.", `${path}.paymentDate`);
    const current = monthIndex(payment.paymentDate.slice(0, 7));
    if (index === 0 && current - monthIndex(originated.slice(0, 7)) > 1) invalid("The first Phase 1 payment must be in the origination month or the following month; grace periods are not modeled.", `${path}.paymentDate`);
    if (previousMonth !== null && current !== previousMonth + 1) invalid("Phase 1 requires consecutive monthly payment dates; irregular/arrears schedules need separate verification.", `${path}.paymentDate`);
    previousMonth = current;
    choice(payment.interestBasis, ["projected", "verified_paid"], `${path}.interestBasis`);
    const scheduledInterest = finance.schedule[index].interestPaid;
    if (payment.interestBasis === "verified_paid") {
      if (!own(payment, "actualInterestPaid")) invalid("Verified paid interest requires an actual amount.", path);
      number(payment.actualInterestPaid, `${path}.actualInterestPaid`, scheduledInterest);
    } else if (own(payment, "actualInterestPaid")) invalid("Projected and actual interest must not be mixed on the same row.", path);
    const selected = payment.interestBasis === "verified_paid" ? payment.actualInterestPaid as number : scheduledInterest;
    number(payment.subsidizedInterest, `${path}.subsidizedInterest`, selected);
    if (own(payment, "amountsAMD")) {
      if (finance.currency === "AMD") invalid("AMD amounts already come from Phase 1; overrides are forbidden.", `${path}.amountsAMD`);
      const amounts = shape(payment.amountsAMD, `${path}.amountsAMD`, ["mortgagePayment", "scheduledInterest", "interest", "subsidizedInterest", "source"]);
      number(amounts.mortgagePayment, `${path}.amountsAMD.mortgagePayment`);
      number(amounts.scheduledInterest, `${path}.amountsAMD.scheduledInterest`, amounts.mortgagePayment);
      number(amounts.interest, `${path}.amountsAMD.interest`, amounts.scheduledInterest);
      number(amounts.subsidizedInterest, `${path}.amountsAMD.subsidizedInterest`, amounts.interest);
      choice(amounts.source, ["bank_certificate", "supplied_projection"], `${path}.amountsAMD.source`);
      if (payment.interestBasis === "verified_paid" && amounts.source !== "bank_certificate") invalid("Verified USD interest requires bank-certified AMD amounts.", `${path}.amountsAMD.source`);
      if (payment.interestBasis === "projected" && amounts.interest !== amounts.scheduledInterest) invalid("Projected interest must match its scheduled AMD amount.", `${path}.amountsAMD.interest`);
      if ((scheduledInterest === 0 && amounts.scheduledInterest !== 0) || (finance.schedule[index].scheduledPayment === 0 && amounts.mortgagePayment !== 0)) invalid("AMD equivalents contradict a zero scheduled amount.", `${path}.amountsAMD`);
      if ((selected === 0 && amounts.interest !== 0) || (payment.subsidizedInterest === 0 && amounts.subsidizedInterest !== 0)) invalid("AMD equivalents contradict zero interest/subsidy amounts.", `${path}.amountsAMD`);
    }
  }
}
