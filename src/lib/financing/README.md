# Financing calculation engine — Phase 1

Pure, deterministic TypeScript estimates in AMD or USD, with whole units for both
currencies. No runtime dependencies, React,
browser APIs, partner configuration, database access, or network calls. The module
lives in the existing `src/lib` utility directory to reuse the project's TypeScript
and Vitest tooling; it can be compiled independently with `tsconfig.financing.json`.
Its production compilation uses only the ES2020 library, without DOM or Node types.
ES2020 BigInt support is required at runtime. Only regular JSON-safe numbers leave
the module.

Existing annuity arithmetic was found inside `Calculator.tsx`,
`LoanCalculatorWidget.tsx`, and `Eligibility.tsx`; the inverse affordability formula
is inside `Affordability.tsx`. These are UI-bound calculations, not reusable
utilities. The old calculator rounds displayed schedule values independently and
does not reconcile those rows to its totals. This engine retains the same standard
annuity formula and adds validated inputs and exact, reconciled monetary accounting.
Existing UI calculations remain untouched in Phase 1; adoption is a later task.

## Public API

Import only from `src/lib/financing/index.ts` (or `@/lib/financing` in this frontend).

```ts
import {
  calculateFinancing,
  validateFinancingInput,
  FinancingCalculationError,
  type FinancingInput,
} from "./financing";

const mortgage: FinancingInput = {
  currency: "AMD",
  financingType: "mortgage",
  apartmentPrice: 50_000_000,
  downPaymentPercent: 20,
  annualInterestRatePercent: 12,
  durationMonths: 240,
};

const estimate = calculateFinancing(mortgage);
// regularMonthlyPayment: 440_434
// final scheduledPayment: 440_872
// totalInterest: 65_704_598
// totalFinancedRepayment: 105_704_598
// totalCostIncludingDownPayment: 115_704_598

const installment = calculateFinancing({
  currency: "AMD",
  financingType: "developer_installment",
  formula: "interest_free",
  apartmentPrice: 30_000_001,
  downPaymentPercent: 10,
  durationMonths: 36,
});
// regularMonthlyPayment: 750_000; final payment: 750_001; totalInterest: 0

const usdMortgage = calculateFinancing({
  currency: "USD",
  financingType: "mortgage",
  apartmentPrice: 150_000, // Whole dollars, not cents or AMD.
  downPaymentPercent: 20,
  annualInterestRatePercent: 9.5,
  durationMonths: 240,
});
// Every amount in this result is denominated in whole USD; no currency conversion.

// A future API boundary can validate untrusted JSON before calculating it:
function calculateUntrusted(input: unknown) {
  validateFinancingInput(input); // asserts input is FinancingInput
  return calculateFinancing(input);
}

try {
  calculateUntrusted({ financingType: "mortgage" });
} catch (error) {
  if (error instanceof FinancingCalculationError) {
    console.log(error.code, error.field, error.message);
  }
}
```

`FinancingInput` is a discriminated union of `MortgageInput` and
`DeveloperInstallmentInput`. Both require `currency: "AMD" | "USD"` (exported as
`FinancingCurrency`), without an implicit currency default. This selects the
denomination only: the engine does not convert apartment prices or payments,
fetch exchange rates, or support mixed-currency financing. Mortgages always
require an explicit nominal annual
percentage, including `0`. Developer financing requires an explicit
`formula: "interest_free"` and forbids an annual interest field, even `0` or
`undefined`. Future developer formulas should add a new explicit input variant,
validation and calculation branch, with independently verified tests. No plugin
registry or speculative financing rules are needed.

`FinancingResult` is a union of `MortgageResult` and `DeveloperInstallmentResult`.
Each includes the supplied `currency`, `isEstimate: true`, the price, percentage and amount
of the down payment, financed principal, duration, regular monthly payment, total
interest, financed repayment, cost including down payment, and complete schedule.
`annualInterestRatePercent` is a number for mortgages and `null` for developer
plans. Each schedule row exposes `month`, `openingBalance`, `scheduledPayment`,
`principalPaid`, `interestPaid`, and `remainingBalance`.

Errors are synchronous `FinancingCalculationError` instances with `code`, a clear
`message`, and an optional input `field`:

- `INVALID_INPUT`: missing fields, wrong types, invalid numbers or bounds.
- `UNSUPPORTED_CONFIGURATION`: unknown financing types, formulas or extra fields.
- `CALCULATION_OUT_OF_RANGE`: defensive guard against unsafe or negative monetary
  outputs. Current validated limits keep all supported results within safe range.

## Formulas and rounding contract

All monetary inputs and outputs are **whole currency units**, including **whole
USD dollars**, as requested. Fractional AMD prices and USD prices containing cents
are rejected; they are not silently rounded. Both currencies share exactly the
same calculation and rounding rules. Percentages are finite JavaScript numbers in
percentage points (`9.5` means 9.5%). The engine interprets each percentage's
canonical decimal representation (`number.toString()`) exactly, including
scientific notation. Computations cannot recover precision already lost by a
caller before supplying a JavaScript number.

With price `A`, down payment percent `d`, and duration `n`:

- Down payment `D = roundHalfUp(A × d / 100)`; principal `P = A − D`.
- Mortgage monthly rate `r = annualInterestRatePercent / 1200`.
- Mortgage regular payment `M = roundHalfUp(P × r / (1 − (1+r)^−n))`.
- For zero-rate mortgages and interest-free developer plans,
  `M = roundHalfUp(P / n)`.
- Each month's interest is `roundHalfUp(openingBalance × r)`; developer interest
  is always zero. The monthly rate is nominal annual divided by 12, not an
  effective annual rate or a flat developer markup. Payments occur at month end.

The constant-payment/monthly-rate convention follows the standard
[PMT definition](https://learn.microsoft.com/en-us/office/vba/api/excel.worksheetfunction.pmt).
The whole-unit rounding policy is this engine's estimate contract, not a claim
about a bank's contractual accounting rules.

Positive half-unit ties round upward (0.5 AMD → 1 AMD; 0.5 USD → 1 USD).
Exact BigInt ratios and integer powers are
used for down payments, annuity payments, and monthly interest, avoiding both
cumulative floating point error and cancellation at very small rates. Balances
and totals are integers throughout. No dependency or decimal library is needed.

The actual payment is capped at the opening balance plus that month's interest.
The final payment always clears that amount, so it may differ from the regular
payment. Totals are sums of actual schedule rows, **not** regular payment × duration:

- `sum(principalPaid) = financedPrincipal`
- `sum(interestPaid) = totalInterest`
- `sum(scheduledPayment) = totalFinancedRepayment = principal + totalInterest`
- `totalCostIncludingDownPayment = downPaymentAmount + totalFinancedRepayment`
- Each payment equals principal paid plus interest paid; each row connects exactly
  to the next opening balance; the final remaining balance is zero.

At `0%` down, the entire price is financed. At `100%` down (or when a fractional
percentage rounds to the whole price), financing amounts and interest are zero,
the schedule is empty, and cost equals the apartment price. All input fields are
still required and validated, and the requested duration is retained.

For a positive principal, the schedule has exactly `durationMonths` rows. Very
small balances can settle early through rounding; remaining rows then contain
zeros. A payment can round to zero, leaving settlement to the final month. At
extreme rates and terms, rounding can erase tiny principal portions and produce a
substantial final adjustment. Consumers must render the actual schedule and final
payment, rather than promise identical payments for every month.

## Validation and supported domain

No input coercion, silent defaults or ignored extra financial configuration.
Required fields must belong to the input object itself. JSON objects are the
intended runtime input. Unknown fields, fees, unsupported currencies, repayment methods,
developer annual rates, and markup fields are rejected.

`FINANCING_LIMITS` documents estimate/resource bounds:

| Parameter | Supported values |
| --- | --- |
| Currency | Explicit `AMD` or `USD`; no conversion |
| Apartment price | Whole currency units, 1 through 1,000,000,000,000 |
| Down payment | 0% through 100%, fractional values allowed |
| Nominal annual mortgage rate | 0% through 100%, fractional values allowed |
| Duration | Whole months, 1 through 600 (50 years) |

These are explicit engineering limits, not partner rules, legal limits, or bank
eligibility assumptions. They bound schedule allocation and monetary output size.
Any change to this domain must preserve exact safe-integer serialization and be
verified at the new boundaries. There is no limit on the number of partners or
apartments: each invocation accepts independent parameters and retains no state.

## Verification

From `frontend/`:

```sh
npm run test:financing
npm run typecheck:financing
npx eslint src/lib/financing
npm test
npm run build
```

At the Phase 1 handoff, all 162 tests passed (161 financing tests plus the existing app
test). Strict standalone module checks, strict test type checks, module lint, and
an independently compiled Node smoke test passed for both AMD and USD. Frontend
and backend production builds passed. Full frontend lint still reports 30 errors
and 18 warnings in existing files; full frontend app type checking still reports
the existing DOMPurify config mismatch at `src/lib/sanitize.ts:22`. Those unrelated
files were not modified.

Tests cover independent high-precision reference totals and schedule checkpoints,
a complete hand-calculated mortgage, developer installments, zero rates, deposit
boundaries, tiny and large values, exact half-unit ties in both currencies, microscopic rates, final
adjustments in both directions, unsupported combinations, validation, determinism,
serialization, currency preservation without conversion, and reconciliation over
960 deterministic combinations across both financing types and currencies. The
existing app test remains part of `npm test`.

Reference fixtures were independently calculated using Python's standard-library
`Decimal` with 100 digits, conventional PMT arithmetic, and `ROUND_HALF_UP`. The
generator does not import or execute this TypeScript engine. It can be audited or
rerun with:

```sh
python3 src/lib/financing/__tests__/generate_references.py
```

## Assumptions, scope and Phase 2 dependencies

These calculations are estimates, not official bank offers. They assume a fixed
nominal mortgage rate, equal monthly periods and payments in arrears. They do not
model daily accrual, calendar dates, variable rates, grace periods, early payments,
fees, insurance, taxes, refunds, or developer markups. There are no new UI, SDK,
iframe, endpoints, partner records, database migrations or production changes.

The adjacent [Phase 2 income-tax refund module](./income-tax-refund/README.md)
consumes this engine's unchanged schedules. It evaluates eligibility separately,
requires explicit calendar payment dates and tax/benefit inputs, and uses a
versioned legal snapshot. USD schedules require explicit AMD amounts for refunds.
The Phase 1 engine itself still supplies no refund or eligibility assumptions.

Files are separated into input types (`input.ts`), output types (`output.ts`),
validation (`validation.ts`), typed errors (`errors.ts`), exact private arithmetic
(`arithmetic.ts`), calculation (`engine.ts`), and tests (`__tests__`). Only `index.ts`
is the public interface. Private arithmetic helpers assume validated nonnegative
inputs and are deliberately not exported from the public entry point.
