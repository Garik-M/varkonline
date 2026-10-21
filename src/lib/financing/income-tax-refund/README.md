# Phase 2: Armenian mortgage income-tax refund engine

## 2026-10-20 additions: net salary and monthly presentation

`estimateIncomeTaxFromNetSalary(netAMD)` returns the inferred gross salary and
separate income-tax/pension/stamp/health amounts under
`AM-STANDARD-EMPLOYEE-2026-10`. This is an explicit standard single-employer,
resident, mandatory-pension-participant illustration with no exemptions or other
deductions, not an exact payroll determination from take-home pay alone.

The model uses 20% gross income tax; pension 5% through 500,000 AMD, otherwise
10% minus 25,000 capped at 87,500 (15 × 75,000 assessment ceiling); 1,000 AMD
stamp duty through 1m gross, otherwise 15,000; 2026 ongoing employee health
contributions of zero through 200,000 gross, 4,800 through 500,000, otherwise
10,800. Zero salary has zero deductions. Real insurance coverage can depend on
earlier months, age, exemptions and transition provisions, which cannot be
deduced from one net figure. Salary tax is modeled using the inferred gross and
the existing salary-tax engine; payroll deductions themselves are not refundable
mortgage interest. The current salary/rule snapshot is held constant in forecasts.

The inverse searches each monotone salary band separately because deduction
thresholds introduce downward jumps and overlapping net amounts. Equally close
matches choose the lowest gross/income tax, preventing an optimistic choice.
Whole AMD rounding and range validation are explicit. For example 500,000 AMD
net maps to gross 695,429 and income tax 139,086 under this model. Values outside
its supported gross-domain image are rejected rather than clamped.

Sources checked 2026-10-20: [pension law, Articles 5–6](https://old.arlis.am/documentview.aspx?docid=201286),
[minimum wage amendment](https://old.arlis.am/DocumentView.aspx?docid=172110),
[stamp duty, Article 12](https://old.arlis.am/documentview.aspx?docid=227002),
[health insurance, Articles 13, 45–46](https://www.arlis.am/hy/acts/218650/latest).
The 2026 health insurance transition is deliberately a stated modeling assumption,
not an inferred fact about the visitor.

`monthlySchedule` now supplies an informational allocation of each authoritative
quarterly refund to bank-payment months. Start with each row's minimum eligible
interest/available monthly tax. If the quarterly cap binds, apportion that base;
if unused quarterly tax can cover further interest, allocate the remainder to
remaining interest capacity. Exact largest-remainder allocation, with month order
as the tie breaker, reconciles every dram. No row exceeds eligible interest;
principal is never refunded. These rows are not receipt dates or guaranteed monthly
transfers. `quarterlySchedule` and full-term totals retain the legal calculation
`min(eligible quarter interest, available quarter salary tax, quarter cap)`.

The UI now shows a visible take-home field, no dates/withholding/assumption checkbox,
automatic explicit projection dates, and period-specific amounts. The strict
eligibility APIs below retain their original behavior.

This is a pure TypeScript estimate module adjacent to Phase 1. It consumes Phase 1
results and imports its exact rounding and safe-integer utilities; it does not
recalculate annuities or change any bank payment. There are no new runtime
dependencies, UI, endpoints, SDK, database writes, government integrations or
deployments. Salary inputs are not persisted or logged.

## Evidence basis

Existing callers default to `evidenceMode: "verified"`: missing or unverified evidence remains unresolved. For an explicitly conditional estimate, pass `evidenceMode: "declared"` to either the full calculation or standalone eligibility evaluator. That mode uses supplied unverified values and the supplied actual/planned loan date as scenario inputs; it never changes `verified` flags, fills missing facts or overrides exclusions. Null remains unknown in both modes. Inputs still pass the same strict validation.

Results include `evidenceMode`; a successful declared scenario uses `CONDITIONS_DECLARED` rather than `CONDITIONS_VERIFIED`. Its `eligible` status means that the declared scenario satisfies the selected rule snapshot, not that actual entitlement has been established. Consumers must label it conditional and retain its assumptions. The hosted widget now uses the separate financial-scenario API below; declared mode remains available for consumers supplying unverified legal facts. Pure-engine callers can continue using the default strict mode.

## Financial illustration API

`calculateMortgageRefundScenario(input, rules)` accepts Phase 1 financing, an explicit loan date, dated payments and participants with income periods, without legal eligibility fields. It reuses the same financial validation, salary-tax calculations, calendar-quarter grouping and shared caps. It never creates positive employment, ownership, acquisition, location or identity facts.

Results carry `calculationBasis: "financial_scenario"` and `eligibility.status: "not_assessed"` when a complete amount can be illustrated. Loan, quarterly and participant eligibility also remain not assessed; a number never means actual entitlement. Missing financial data still remains unresolved and unsupported fields/combinations are rejected. Existing entitlement calculations return `calculationBasis: "eligibility_evaluation"` and retain their prior verified/declared behavior.

The UI illustrates a forecast with constant salary, fully settled salary tax, no subsidy and no competing tax-refund claims. These are financial scenario assumptions, not assertions about actual legal facts. The widget does not ask employment, owner, prior-use, tuition, tax-allocation or property questions. Do not use the illustration API to certify eligibility or submit a refund claim.

### Conservative monthly widget estimate

`calculateMonthlyMortgageRefundEstimate(input, rules)` accepts the same financial scenario input and returns `calculationMethod: "monthly_tax_limit"`. Each row is limited by that payment month's eligible interest and available income tax, after prior tax allocations. The shared quarterly cap is then applied to those monthly capacities with whole-unit largest-remainder allocation. Tax from a calendar month with no loan payment is not assigned to the other rows. Unused monthly capacity is not moved to another month.

This is a conservative financial illustration requested for the widget, not the statutory quarterly entitlement formula. `calculateMortgageIncomeTaxRefund` and `calculateMortgageRefundScenario` retain calendar-quarter pooling and return `calculationMethod: "quarterly_pool"`. Both methods reconcile monthly, quarterly, annual and full-term totals, leave principal payable and preserve the original bank schedule.

For the reported 35m AMD / 20% down / 10% nominal / 240-month example and 139,086 AMD monthly income tax, months 1–3 each show 139,086 AMD refund and 131,120 AMD net cost. Full bank repayment is 64,849,495 AMD; estimated refund is 28,114,727 AMD; estimated net financing cost is 36,734,768 AMD. The last refund falls to 2,234 AMD interest. These values were independently calculated with Python Decimal.

## Public API and example

Import from `@/lib/financing/income-tax-refund` in the frontend, or the directory's
`index.ts` from other TypeScript consumers. Both calculation and eligibility APIs
require an explicit versioned rule set; there is no implicit legal/tax profile.

```ts
import { calculateFinancing } from "./financing";
import {
  calculateMortgageIncomeTaxRefund,
  ARMENIA_REFUND_RULES_2026_10,
  type Evidence,
  type MortgageRefundInput,
} from "./financing/income-tax-refund";

// Synthetic, deliberately small arithmetic example, not a property/bank offer.
// Only mark a fact verified after its documentary verification outside this engine.
const confirmed = <T>(value: T): Evidence<T> => ({ value, verified: true });
const financing = calculateFinancing({
  currency: "AMD", financingType: "mortgage", apartmentPrice: 1250,
  downPaymentPercent: 20, annualInterestRatePercent: 12, durationMonths: 3,
});
const input: MortgageRefundInput = {
  financing,
  loanOriginationDate: "2026-01-01",
  originationDateVerified: true,
  eligibility: {
    residentFinancialLender: confirmed(true),
    fundsUsedForHousing: confirmed(true),
    acquisitionType: confirmed("developer_apartment"),
    contractPriceAMD: confirmed(1250),
    location: confirmed({ region: "kotayk", governmentBorderSettlement: confirmed(false) }),
    permitDecisionDate: confirmed(null),
    propertyRightsRegistered: confirmed(true),
    requiredDocumentsAvailable: confirmed(true),
    validSelfBuildPermit: null, // Not relevant to this apartment purchase.
  },
  participants: [{
    id: "opaque-borrower-id", role: "borrower",
    eligibility: {
      employee: confirmed(true), ownerOrCoOwner: confirmed(true),
      requiredIdentityOrResidenceDocument: confirmed(true),
      priorBenefitUse: confirmed("none"),
    },
    incomePeriods: [{
      fromMonth: "2026-01", toMonth: "2026-03", grossRegisteredSalaryAMD: 100,
      taxPaymentStatus: "projected", tuitionRefundClaimed: false,
      taxAlreadyAllocatedAMD: 0,
    }],
  }],
  payments: ["2026-01-31", "2026-02-28", "2026-03-31"].map((paymentDate, i) => ({
    month: i + 1, paymentDate, interestBasis: "projected", subsidizedInterest: 0,
  })),
};
const result = calculateMortgageIncomeTaxRefund(input, ARMENIA_REFUND_RULES_2026_10);
// Salary tax: 20 AMD/month. Q1 interest: 10 + 7 + 3 = 20 AMD.
// Q1 refund: min(20, 60, 750000) = 20 AMD.
// Original monthly bank payment: 340 AMD; total bank payments: 1020 AMD.
// Effective cost after the separate refund: 1000 AMD; rounded monthly equivalent: 333 AMD.
```

Other entry points:

- `evaluateMortgageRefundEligibility(context, rules): RefundEligibilityResult`
  evaluates the financing/property facts without needing payroll or refund inputs.
  `MortgageEligibilityContext` contains `financing`, `loanOriginationDate`,
  `originationDateVerified`, and `eligibility`.
- `calculateSalaryIncomeTax(input, rules): SalaryIncomeTaxResult` accepts a
  `YYYY-MM` month, gross registered AMD salary, optional actual withheld salary tax,
  and an optional applicable rate override. It does not assert refund eligibility
  or calculate net salary, social contributions or other payroll deductions.
- `validateMortgageRefundInput`, `validateRefundEligibilityContext`,
  `validateSalaryTaxInput`, and `validateRefundRules` narrow unknown boundary data.
- Errors reuse Phase 1's `FinancingCalculationError` and its typed `code`, `field`
  and `message`. Invalid/inconsistent inputs throw; legally unresolved facts return
  structured eligibility results instead of exceptions.

## Inputs, uncertainty and evidence

Required facts use `Evidence<T> = { value: T; verified: boolean } | null`. A null fact
or `verified: false` never establishes eligibility or a permit exemption. The engine
does not verify documents, locations, identities or a partner's claims. In
particular, nothing about Defanse Housing is assumed.

`eligible` means the supplied verified conditions are satisfied under the selected
snapshot. It is not an SRC decision. `ineligible` means a known condition excludes
the loan or person/quarter. `requires_verification` means a necessary legal,
currency or payroll input remains unresolved. Reasons include stable codes,
human-readable explanations, effects, and relevant fields/person IDs.

An unresolved quarter has `estimatedRefundAMD: null`, with null effective cost;
it is never silently presented as a guaranteed refund or as zero tax. A known
ineligible quarter has a zero refund. If any quarter is unresolved, its annual
total and the full-horizon total are null; resolved quarters/years remain available.

Inputs must contain explicit values, including zero subsidies, zero salary,
zero prior tax allocations, and tax-payment/overlap statuses. Missing salary months
are not filled with zero. Ranges are inclusive calendar-month ranges of explicitly
constant payroll amounts; supply separate nonoverlapping ranges for changes.

Supply one canonical opaque ID per person, with one borrower and optional distinct
co-borrowers. Duplicate IDs, overlapping income ranges and multiple borrower roles
are rejected. Co-borrowers must independently satisfy employment, co-ownership,
identity/document and prior-benefit conditions. Their ineligible tax is excluded;
it does not disqualify another eligible borrower. Unresolved information for an
included person leaves the quarter unresolved; omit people whose tax is not being
included. The engine returns a loan-level refund, not a fabricated individual
allocation: actual claims follow the application order in Decision 1321-N(8.2).

## Income tax and refund formulas

For each calendar month:

```
estimatedSalaryTaxAMD = roundHalfUp(grossRegisteredSalaryAMD * ratePercent / 100)
selectedTaxAMD = actualIncomeTaxWithheldAMD ?? estimatedSalaryTaxAMD
availableTaxAMD = selectedTaxAMD - taxAlreadyAllocatedAMD
```

An actual withheld amount of zero overrides the estimate. `verified_paid` requires
an actual amount; withholding alone does not prove payment to the Treasury.
`projected` explicitly assumes full payment in the forecast. `unknown` needs
verification, and `unpaid` excludes that participant-quarter until settlement.
Amounts already allocated to other claims are deducted; an allocation above
selected tax is rejected. Tuition refund overlap excludes that person's quarter,
rather than merely deducting tuition from the available tax.

The default published snapshot contains the standard rates of 23% from 2020,
22% from 2021, 21% from 2022, and 20% from 2023. Article 150 contains exceptions,
including certain qualifying R&D personnel. The module does not infer a regime
from an occupation or employer name: pass an applicable rate or actual salary tax.
It does not apply 20% to older progressive-tax periods without an explicit rate or
actual amount. Future estimates hold the last selected version's rate constant.

For each real calendar quarter:

```
eligibleInterestAMD = sum(interestUsedAMD - subsidizedInterestAMD)
eligibleTaxAMD = sum(available salary tax of eligible participants)
estimatedRefundAMD = min(eligibleInterestAMD, eligibleTaxAMD, quarterlyRefundCapAMD)
effectiveFinancingCostAMD = original quarter mortgage payments in AMD - refund
effectiveAverageMonthlyFinancingCostAMD = roundHalfUp(total effective cost / durationMonths)
```

The refund is applied only when the required conditions resolve to eligible.
It never includes principal, fees or subsidized interest. `interestUsedAMD` is
projected Phase 1 interest or an explicitly supplied bank-confirmed paid amount,
bounded by that schedule row. Outputs separately expose projected scheduled
interest, interest used, verified-paid subtotal, subsidy and projection flags.
Future salary or interest is not represented as money already paid.

All monetary calculations retain Phase 1's exact integer/rational arithmetic and
half-up rounding to whole units. Totals sum actual quarter results; the monthly
equivalent is rounded separately and is informational. Down payment and unrelated
subsidy cash flows are not included in this effective financing-cost measure.

## Calendar and currency contract

Every Phase 1 row needs an explicit `YYYY-MM-DD` payment date. No local timezone,
wall clock, arbitrary three-row quarter grouping or assumed first payment date is
used. Payments must follow origination and occupy consecutive calendar months.
The first payment can be in the origination month or the following month. Phase 1
does not model grace periods, arrears, irregular payment periods or daily accrual.
If these apply, reconcile the contractual schedule before using this estimate.

Quarterly salary tax covers all three calendar salary months, including partial
first/last mortgage quarters. Caps are not prorated. Unused salary tax, interest
and caps do not carry to another quarter. Annual totals are attributed to the
interest/tax reporting year; the engine does not predict a refund-receipt date.

Phase 1 still accepts whole AMD and USD. Salary tax, legal prices, caps and refund
outputs are always whole AMD. For USD schedules, supply `amountsAMD` on every row:
`mortgagePayment`, `scheduledInterest`, selected `interest`, `subsidizedInterest`
and a source (`supplied_projection` or `bank_certificate`). Bank-confirmed paid USD
interest requires bank-certified AMD amounts. The caller supplies these amounts;
there is no exchange-rate fetch, inferred FX rate or conversion formula. Missing
AMD data returns `requires_verification`, not zero or USD mislabeled as AMD.
Original USD obligations remain untouched in `bankPayments`.

## Official legal sources and implemented rules

Snapshot: `AM-160-1321N-2026-10-17`, reviewed as of **17 October 2026**. The laws
below are the basis of this implementation. Projections do not assert that these
rules will remain unchanged throughout a future mortgage.

| Official source | Implemented conditions |
| --- | --- |
| [Tax Code, Articles 150, 160 and 160.1](https://www.arlis.am/hy/acts/230455) | Salary-tax rates; resident financial lender and housing use; direct developer/state/community purchase or self-build; 55 million AMD contractual purchase ceiling; one post-2018 mortgage per person; separate quarters. |
| [Government Decision 1321-N, current consolidation](https://www.arlis.am/hy/acts/200943) | Employee/co-owner requirements; required identity/property documents; full salary-tax settlement; subsidy exclusion; tuition overlap; combined mortgage cap and application order. |
| [Law HO-360-N, Article 5(2)](https://www.arlis.am/hy/acts/157898) | Yerevan phase-out exemption for property built under permits based on decisions adopted before 1 January 2022. Use the decision date, not an assumed completion or permit-renewal date. |
| [Decision 1626-N, effective 1 January 2025](https://www.arlis.am/en/acts/198544) | 1.5 million AMD per quarter for supported 2018–2024 loans; 750,000 AMD for originations on/after 1 January 2025; regional phase-outs and government-listed border-settlement exceptions. |
| [SRC income-tax guide, June 2026, pp. 12–14](https://www.src.am/storage/File_Link_Uploade/tv_yndhanur_teghekutyun_rev0626_6a26b2c6dad5f.pdf) | Quarterly mortgage refunds, eligibility of employed co-owners, one-contract rule, price and cap thresholds, tuition overlap, regional cutoffs, continuity for existing qualifying loans. |

The 55 million AMD ceiling uses the **whole contractual purchase price**, including
the down payment, not the financed principal. Exactly 55 million is allowed.
Self-building a house is a different acquisition category and does not inherit
the purchase-transaction price ceiling. An AMD price differing between the
contract and Phase 1 requires reconciliation; USD contract prices need verified
AMD values, never an invented conversion.

Yerevan restrictions depend on the official valuation zone and loan origination:

| Zone | Geographic cutoff |
| --- | --- |
| 1 | 1 July 2022 |
| 2 | 1 January 2023 |
| 3 | 1 July 2023 |
| Other Yerevan zones | 1 January 2025 |

A verified pre-2022 permit-decision exemption can preserve eligibility in all of
these zones. A Yerevan district name or partner identity is not a valuation zone.
An unknown zone is immaterial before all restrictions or after all zones are
restricted, provided the permit-exemption question is resolved.

New originations in Aragatsotn, Ararat, Armavir and Kotayk are restricted after the
2027 cutoff, and in other marzes after the 2029 cutoff, except verified settlements
on the government list. Being near the border is not sufficient. The Yerevan
permit exemption is not extended to these later regional exclusions. Existing
eligible loans do not lose the benefit just because repayments continue past a
new-origination cutoff.

The geographic provisions use "after" date wording. An origination **on** a
geographic cutoff day is deliberately sent for SRC boundary verification unless
an independently verified exception makes the boundary immaterial. The 2025 cap
change explicitly includes 1 January 2025 under Decision 1626-N and is automated.

## Manual verification and supported limits

- Evidence flags are assertions from the caller. Check developer status, exact
  property/zone, original permit decision, title/purchase-right registration,
  contractual price (including any attached parking), identity/residence documents,
  prior use and required SRC documentation against authoritative records.
- Pre-2018 loans can have grandfathered rights under Decision 205-N and are
  `requires_verification`; the engine does not falsely apply the new purchase-price
  or regional restrictions to them.
- Special construction-right acquisition cases under Article 160(8) require review
  of the 2018–2021 registered contract and Article 160(9). Direct secondary-market
  or individual-assignment acquisitions are ineligible under this model.
- Refinancing/novation, inherited claims, changed property or borrower rights,
  arrears, revised tax returns, over-refund offsets, claim submission/approval,
  bank-account validation and receipt timing need case-specific handling. None are
  inferred from an amortization schedule.
- Payroll amounts aggregate eligible salary income tax for the same person across
  fully settled employers; they must exclude tax on dividends/rent/other income,
  social payments, and already-used tax. Partial employer settlement requires
  verified eligible amounts rather than treating withholding as paid tax.
- Bank interest exceeding/differing from the Phase 1 row, daily interest, fees and
  penalties require reconciliation to a suitable schedule; they are not silently
  added. Actual withheld tax above the supplied gross month's salary, corrections
  and arrears are outside this simple payroll model.
- Extra financial fields are rejected. Money is nonnegative whole units up to
  1 trillion per salary/AMD quote, with safe-integer checks on aggregates. There are
  at most 600 payment rows, 20 distinct participants, 612 income ranges per person,
  and 100 rate/cap changes per policy. These are resource/precision bounds, not
  legal eligibility or partner limits.

## Architecture and verification

`input.ts` and `output.ts` hold public types. `rules.ts` contains the frozen legal
snapshot and source references. `eligibility.ts` evaluates legal facts independently
of money calculations. `income.ts` calculates salary tax and per-person quarter
availability. `calendar.ts` handles validated Gregorian dates without timezone
conversion. `validation.ts` checks untrusted data, policies and Phase 1 schedule
reconciliation. `engine.ts` aggregates independent calendar quarters, annual totals
and effective costs. `index.ts` is the public entry point.

Future legal changes can be supplied as a new validated `RefundRuleSet` with new
version/source metadata and effective-date tables. Newly different legal formulas
or eligibility categories still need explicit reviewed code and tests; changing a
threshold does not require rewriting the numerical engine. No automatic legal
updates or changes to the Phase 1 engine are performed.

Each result includes a fresh copy of the entire applied rule snapshot (thresholds,
rate/cap tables, geographic dates and sources), not only its version name. This
supports audit and reproduction without retaining salary inputs.

From `frontend/`:

```sh
npm run test:refund
npm run test:financing
npm run typecheck:financing
npx eslint src/lib/financing
npm test
npm run build
```

Local verification on 17 October 2026: **334 tests passed**, including all 161
Phase 1 financing tests, 172 Phase 2 tests and the existing app test. Strict ES2020
module compilation without DOM/Node types, strict refund-test type checks, module
lint, standalone compiled Node execution/JSON serialization and both production
builds passed. Full frontend lint retains its pre-existing 30 errors/18 warnings;
full frontend app type checking retains the pre-existing DOMPurify config mismatch
at `src/lib/sanitize.ts:22`. No unrelated files were changed to mask those failures.

Tests include independent Python Decimal fixtures for annuity rows, salary tax,
calendar quarter grouping, annual reconciliation and both legal caps; a complete
hand-calculated example; changing salary; tax/interest/cap limits; subsidy and paid
interest distinctions; legal cutoffs and permit/border exceptions; co-borrowers;
overlap/zero/unknown data; USD amounts; validation; determinism and serialization.
The reference generator is standard-library Python and does not call TypeScript:

```sh
python3 src/lib/financing/income-tax-refund/__tests__/generate_references.py
```

## Phase 3 consumption contract

The isolated calculator in `src/embed/` now consumes this contract. Its integration and evidence workflow is documented in `public/docs/financing-integration.md`. For «Հաշվել եկամտահարկի հետվերադարձով», callers need:

1. The unchanged Phase 1 result and explicit origination/monthly payment dates.
2. Verified property, lender, title, permit, prior-use and participant facts;
   unresolved facts stay null or unverified.
3. Gross registered AMD salary/ranges, optional actual withheld salary tax and
   applicable exception rates, tax-payment status, tuition overlap and other tax
   allocations for every participant/month of the relevant full quarters.
4. Explicit subsidy amounts and projection/paid-interest basis. For USD, explicit
   AMD values and their source.
5. A reviewed rule snapshot selected explicitly and recalculation whenever these
   inputs or rules change.

Render `originalRegularMonthlyBankPayment` and the actual `bankPayments` as bank
obligations in `financingCurrency`. Display refunds separately by quarter in AMD.
Label `effectiveAverageMonthlyFinancingCostAMD` as an informational equivalent,
never a discounted bank payment. Preserve `eligibility`, reason codes, projection
flags, assumptions, null values and legal version/date in any future SDK/API/UI.
