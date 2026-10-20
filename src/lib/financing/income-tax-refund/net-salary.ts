import { roundRatio } from "../arithmetic";
import { FinancingCalculationError } from "../errors";

/** Versioned illustration, not a payroll assessment. One resident employee/job,
 * mandatory pension participant, standard 20% income tax, no exemptions/other
 * deductions; stable 2026 health-insurance status inferred from the salary band.
 * Sources and transition limitations are documented in README.md. */
export const NET_SALARY_MODEL = "AM-STANDARD-EMPLOYEE-2026-10";
export interface NetSalaryEstimate {
  model: typeof NET_SALARY_MODEL;
  grossSalaryAMD: number;
  incomeTaxAMD: number;
  pensionAMD: number;
  stampDutyAMD: number;
  healthInsuranceAMD: number;
  netSalaryAMD: number;
}
const percent = (gross: number, divisor: number) =>
  Number(roundRatio(BigInt(gross), BigInt(divisor)));
export function standardEmployeePayroll(gross: number): NetSalaryEstimate {
  if (!Number.isSafeInteger(gross) || gross < 0 || gross > 1e12)
    throw new FinancingCalculationError(
      "INVALID_INPUT",
      "Salary must be a whole AMD amount from 0 to 1e12.",
      "salary",
    );
  const incomeTaxAMD = percent(gross, 5);
  const pensionAMD =
    gross <= 500_000
      ? percent(gross, 20)
      : Math.min(percent(gross, 10) - 25_000, 87_500);
  const stampDutyAMD = gross === 0 ? 0 : gross <= 1_000_000 ? 1_000 : 15_000;
  const healthInsuranceAMD =
    gross <= 200_000 ? 0 : gross <= 500_000 ? 4_800 : 10_800;
  return {
    model: NET_SALARY_MODEL,
    grossSalaryAMD: gross,
    incomeTaxAMD,
    pensionAMD,
    stampDutyAMD,
    healthInsuranceAMD,
    netSalaryAMD: Math.max(
      0,
      gross - incomeTaxAMD - pensionAMD - stampDutyAMD - healthInsuranceAMD,
    ),
  };
}

/** Invert each monotone band independently: deductions introduce downward jumps
 * and overlapping net salaries. Prefer the lowest gross/tax of equally close
 * candidates, avoiding an optimistic refund. No binary search across jumps. */
export function estimateIncomeTaxFromNetSalary(net: number): NetSalaryEstimate {
  if (!Number.isSafeInteger(net) || net < 0 || net > 1e12)
    throw new FinancingCalculationError(
      "INVALID_INPUT",
      "Net salary must be a whole AMD amount from 0 to 1e12.",
      "salary",
    );
  if (net === 0) return standardEmployeePayroll(0);
  const bands = [
    [1, 200_000],
    [200_001, 500_000],
    [500_001, 1_000_000],
    [1_000_001, 1_125_000],
    [1_125_001, 1e12],
  ];
  const candidates: NetSalaryEstimate[] = [];
  for (const [start, end] of bands) {
    let low = start,
      high = end;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (standardEmployeePayroll(mid).netSalaryAMD < net) low = mid + 1;
      else high = mid;
    }
    candidates.push(standardEmployeePayroll(low));
    if (low > start) candidates.push(standardEmployeePayroll(low - 1));
  }
  candidates.sort(
    (a, b) =>
      Math.abs(a.netSalaryAMD - net) - Math.abs(b.netSalaryAMD - net) ||
      a.grossSalaryAMD - b.grossSalaryAMD,
  );
  if (Math.abs(candidates[0].netSalaryAMD - net) > 1)
    throw new FinancingCalculationError(
      "CALCULATION_OUT_OF_RANGE",
      "Net salary exceeds the payroll model range.",
      "salary",
    );
  return candidates[0];
}
