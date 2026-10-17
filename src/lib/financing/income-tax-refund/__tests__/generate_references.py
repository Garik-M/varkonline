"""Independent Decimal mortgage, salary-tax, calendar-quarter and refund examples.

Run from frontend: python3 src/lib/financing/income-tax-refund/__tests__/generate_references.py
No TypeScript code or fixtures are imported. Monetary rounding is ROUND_HALF_UP.
"""
from decimal import Decimal as D, ROUND_HALF_UP, localcontext
from pathlib import Path
import json


def example(price, deposit, rate, months, first_month, originated, salary):
    with localcontext() as ctx:
        ctx.prec = 100
        rounded = lambda value: int(value.quantize(D(1), rounding=ROUND_HALF_UP))
        principal = price - rounded(D(price) * D(str(deposit)) / 100)
        r = D(str(rate)) / 1200
        monthly = rounded(D(principal) / months if r == 0 else D(principal) * r / (1 - (1 + r) ** (-months)))
        tax = rounded(D(salary) * D("0.2"))
        cap = 750_000 if originated >= "2025-01-01" else 1_500_000
        first = int(first_month[:4]) * 12 + int(first_month[5:]) - 1
        quarters = {}
        balance = principal
        for index in range(months):
            year, month = divmod(first + index, 12)
            quarter = month // 3 + 1
            interest = rounded(D(balance) * r)
            payment = balance + interest if index == months-1 else min(monthly, balance+interest)
            balance -= payment-interest
            key = (year, quarter)
            row = quarters.setdefault(key, dict(year=year, quarter=quarter,
                projectedMortgageInterestAMD=0, eligibleIncomeTaxAMD=tax*3,
                quarterlyRefundCapAMD=cap, mortgagePaymentsBeforeRefundAMD=0))
            row["projectedMortgageInterestAMD"] += interest
            row["mortgagePaymentsBeforeRefundAMD"] += payment
        annual = {}
        for row in quarters.values():
            refund = min(row["projectedMortgageInterestAMD"], row["eligibleIncomeTaxAMD"], cap)
            row["estimatedRefundAMD"] = refund
            row["effectiveFinancingCostAMD"] = row["mortgagePaymentsBeforeRefundAMD"]-refund
            annual[row["year"]] = annual.get(row["year"],0)+refund
        total = sum(row["estimatedRefundAMD"] for row in quarters.values())
        payments = sum(row["mortgagePaymentsBeforeRefundAMD"] for row in quarters.values())
        first_key, last_key = list(quarters)[0], list(quarters)[-1]
        return dict(financingInput=dict(currency="AMD",financingType="mortgage",apartmentPrice=price,
            downPaymentPercent=deposit,annualInterestRatePercent=rate,durationMonths=months),
            firstMonth=first_month, originated=originated, salary=salary,
            incomeFrom=f"{first_key[0]}-{(first_key[1]-1)*3+1:02d}",
            incomeTo=f"{last_key[0]}-{last_key[1]*3:02d}",
            expectedQuarters=list(quarters.values()),
            expectedAnnual=[dict(year=year,estimatedRefundAMD=amount) for year,amount in annual.items()],
            expectedTotals=dict(totalEstimatedRefundAMD=total,totalMortgagePaymentsBeforeRefundAMD=payments,
                totalEffectiveFinancingCostAMD=payments-total,
                effectiveAverageMonthlyFinancingCostAMD=rounded(D(payments-total)/months)))


cases = [example(*params) for params in [
    (1250,20,12,3,"2026-01","2026-01-01",100),
    (1500,20,12,6,"2026-11","2026-10-31",5),
    (50_000_000,0,12,12,"2026-01","2026-01-01",10_000_000),
    (50_000_000,0,12,12,"2024-01","2023-12-31",10_000_000),
    (2_000_000,10,9.5,18,"2026-11","2026-10-31",200_000),
]]
Path(__file__).with_name("reference-cases.ts").write_text(
    "// Generated independently with Python Decimal by generate_references.py.\n"
    "export const refundReferenceCases = " + json.dumps(cases,indent=2) + " as const;\n"
)
