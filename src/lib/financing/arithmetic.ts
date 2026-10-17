import { FinancingCalculationError } from "./errors";

/** Exact rational form of the number's canonical decimal representation. */
export function decimalRatio(value: number): readonly [bigint, bigint] {
  const [coefficient, exponent = "0"] = value.toString().toLowerCase().split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  const numerator = BigInt(whole + fraction);
  const scale = fraction.length - Number(exponent);
  return scale >= 0
    ? [numerator, 10n ** BigInt(scale)]
    : [numerator * 10n ** BigInt(-scale), 1n];
}

/** Half-up for nonnegative rationals. No floating point monetary arithmetic. */
export function roundRatio(numerator: bigint, denominator: bigint): bigint {
  return (2n * numerator + denominator) / (2n * denominator);
}

export function toWholeAmount(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new FinancingCalculationError(
      "CALCULATION_OUT_OF_RANGE", "Calculated amount is outside the safe nonnegative integer range.",
    );
  }
  return Number(value);
}

export function annuityPayment(
  principal: bigint,
  rateNumerator: bigint,
  rateDenominator: bigint,
  months: number,
): bigint {
  if (rateNumerator === 0n) return roundRatio(principal, BigInt(months));
  // P * r * (1+r)^n / ((1+r)^n - 1), evaluated as an exact rational.
  // Integer powers avoid cancellation at tiny rates and ambiguous half-unit ties.
  const growthNumerator = (rateDenominator + rateNumerator) ** BigInt(months);
  const growthDenominator = rateDenominator ** BigInt(months);
  return roundRatio(
    principal * rateNumerator * growthNumerator,
    rateDenominator * (growthNumerator - growthDenominator),
  );
}
