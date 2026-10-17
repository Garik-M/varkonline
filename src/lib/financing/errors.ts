export type FinancingErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_CONFIGURATION"
  | "CALCULATION_OUT_OF_RANGE";

export class FinancingCalculationError extends Error {
  readonly name = "FinancingCalculationError";

  constructor(
    public readonly code: FinancingErrorCode,
    message: string,
    public readonly field?: string,
  ) {
    super(message);
  }
}
