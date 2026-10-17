// Generated independently with Python Decimal by generate_references.py.
export const refundReferenceCases = [
  {
    "financingInput": {
      "currency": "AMD",
      "financingType": "mortgage",
      "apartmentPrice": 1250,
      "downPaymentPercent": 20,
      "annualInterestRatePercent": 12,
      "durationMonths": 3
    },
    "firstMonth": "2026-01",
    "originated": "2026-01-01",
    "salary": 100,
    "incomeFrom": "2026-01",
    "incomeTo": "2026-03",
    "expectedQuarters": [
      {
        "year": 2026,
        "quarter": 1,
        "projectedMortgageInterestAMD": 20,
        "eligibleIncomeTaxAMD": 60,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 1020,
        "estimatedRefundAMD": 20,
        "effectiveFinancingCostAMD": 1000
      }
    ],
    "expectedAnnual": [
      {
        "year": 2026,
        "estimatedRefundAMD": 20
      }
    ],
    "expectedTotals": {
      "totalEstimatedRefundAMD": 20,
      "totalMortgagePaymentsBeforeRefundAMD": 1020,
      "totalEffectiveFinancingCostAMD": 1000,
      "effectiveAverageMonthlyFinancingCostAMD": 333
    }
  },
  {
    "financingInput": {
      "currency": "AMD",
      "financingType": "mortgage",
      "apartmentPrice": 1500,
      "downPaymentPercent": 20,
      "annualInterestRatePercent": 12,
      "durationMonths": 6
    },
    "firstMonth": "2026-11",
    "originated": "2026-10-31",
    "salary": 5,
    "incomeFrom": "2026-10",
    "incomeTo": "2027-06",
    "expectedQuarters": [
      {
        "year": 2026,
        "quarter": 4,
        "projectedMortgageInterestAMD": 22,
        "eligibleIncomeTaxAMD": 3,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 414,
        "estimatedRefundAMD": 3,
        "effectiveFinancingCostAMD": 411
      },
      {
        "year": 2027,
        "quarter": 1,
        "projectedMortgageInterestAMD": 18,
        "eligibleIncomeTaxAMD": 3,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 621,
        "estimatedRefundAMD": 3,
        "effectiveFinancingCostAMD": 618
      },
      {
        "year": 2027,
        "quarter": 2,
        "projectedMortgageInterestAMD": 2,
        "eligibleIncomeTaxAMD": 3,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 207,
        "estimatedRefundAMD": 2,
        "effectiveFinancingCostAMD": 205
      }
    ],
    "expectedAnnual": [
      {
        "year": 2026,
        "estimatedRefundAMD": 3
      },
      {
        "year": 2027,
        "estimatedRefundAMD": 5
      }
    ],
    "expectedTotals": {
      "totalEstimatedRefundAMD": 8,
      "totalMortgagePaymentsBeforeRefundAMD": 1242,
      "totalEffectiveFinancingCostAMD": 1234,
      "effectiveAverageMonthlyFinancingCostAMD": 206
    }
  },
  {
    "financingInput": {
      "currency": "AMD",
      "financingType": "mortgage",
      "apartmentPrice": 50000000,
      "downPaymentPercent": 0,
      "annualInterestRatePercent": 12,
      "durationMonths": 12
    },
    "firstMonth": "2026-01",
    "originated": "2026-01-01",
    "salary": 10000000,
    "incomeFrom": "2026-01",
    "incomeTo": "2026-12",
    "expectedQuarters": [
      {
        "year": 2026,
        "quarter": 1,
        "projectedMortgageInterestAMD": 1381333,
        "eligibleIncomeTaxAMD": 6000000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 13327317,
        "estimatedRefundAMD": 750000,
        "effectiveFinancingCostAMD": 12577317
      },
      {
        "year": 2026,
        "quarter": 2,
        "projectedMortgageInterestAMD": 1019357,
        "eligibleIncomeTaxAMD": 6000000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 13327317,
        "estimatedRefundAMD": 750000,
        "effectiveFinancingCostAMD": 12577317
      },
      {
        "year": 2026,
        "quarter": 3,
        "projectedMortgageInterestAMD": 646415,
        "eligibleIncomeTaxAMD": 6000000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 13327317,
        "estimatedRefundAMD": 646415,
        "effectiveFinancingCostAMD": 12680902
      },
      {
        "year": 2026,
        "quarter": 4,
        "projectedMortgageInterestAMD": 262171,
        "eligibleIncomeTaxAMD": 6000000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 13327325,
        "estimatedRefundAMD": 262171,
        "effectiveFinancingCostAMD": 13065154
      }
    ],
    "expectedAnnual": [
      {
        "year": 2026,
        "estimatedRefundAMD": 2408586
      }
    ],
    "expectedTotals": {
      "totalEstimatedRefundAMD": 2408586,
      "totalMortgagePaymentsBeforeRefundAMD": 53309276,
      "totalEffectiveFinancingCostAMD": 50900690,
      "effectiveAverageMonthlyFinancingCostAMD": 4241724
    }
  },
  {
    "financingInput": {
      "currency": "AMD",
      "financingType": "mortgage",
      "apartmentPrice": 50000000,
      "downPaymentPercent": 0,
      "annualInterestRatePercent": 12,
      "durationMonths": 12
    },
    "firstMonth": "2024-01",
    "originated": "2023-12-31",
    "salary": 10000000,
    "incomeFrom": "2024-01",
    "incomeTo": "2024-12",
    "expectedQuarters": [
      {
        "year": 2024,
        "quarter": 1,
        "projectedMortgageInterestAMD": 1381333,
        "eligibleIncomeTaxAMD": 6000000,
        "quarterlyRefundCapAMD": 1500000,
        "mortgagePaymentsBeforeRefundAMD": 13327317,
        "estimatedRefundAMD": 1381333,
        "effectiveFinancingCostAMD": 11945984
      },
      {
        "year": 2024,
        "quarter": 2,
        "projectedMortgageInterestAMD": 1019357,
        "eligibleIncomeTaxAMD": 6000000,
        "quarterlyRefundCapAMD": 1500000,
        "mortgagePaymentsBeforeRefundAMD": 13327317,
        "estimatedRefundAMD": 1019357,
        "effectiveFinancingCostAMD": 12307960
      },
      {
        "year": 2024,
        "quarter": 3,
        "projectedMortgageInterestAMD": 646415,
        "eligibleIncomeTaxAMD": 6000000,
        "quarterlyRefundCapAMD": 1500000,
        "mortgagePaymentsBeforeRefundAMD": 13327317,
        "estimatedRefundAMD": 646415,
        "effectiveFinancingCostAMD": 12680902
      },
      {
        "year": 2024,
        "quarter": 4,
        "projectedMortgageInterestAMD": 262171,
        "eligibleIncomeTaxAMD": 6000000,
        "quarterlyRefundCapAMD": 1500000,
        "mortgagePaymentsBeforeRefundAMD": 13327325,
        "estimatedRefundAMD": 262171,
        "effectiveFinancingCostAMD": 13065154
      }
    ],
    "expectedAnnual": [
      {
        "year": 2024,
        "estimatedRefundAMD": 3309276
      }
    ],
    "expectedTotals": {
      "totalEstimatedRefundAMD": 3309276,
      "totalMortgagePaymentsBeforeRefundAMD": 53309276,
      "totalEffectiveFinancingCostAMD": 50000000,
      "effectiveAverageMonthlyFinancingCostAMD": 4166667
    }
  },
  {
    "financingInput": {
      "currency": "AMD",
      "financingType": "mortgage",
      "apartmentPrice": 2000000,
      "downPaymentPercent": 10,
      "annualInterestRatePercent": 9.5,
      "durationMonths": 18
    },
    "firstMonth": "2026-11",
    "originated": "2026-10-31",
    "salary": 200000,
    "incomeFrom": "2026-10",
    "incomeTo": "2028-06",
    "expectedQuarters": [
      {
        "year": 2026,
        "quarter": 4,
        "projectedMortgageInterestAMD": 27760,
        "eligibleIncomeTaxAMD": 120000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 215378,
        "estimatedRefundAMD": 27760,
        "effectiveFinancingCostAMD": 187618
      },
      {
        "year": 2027,
        "quarter": 1,
        "projectedMortgageInterestAMD": 36034,
        "eligibleIncomeTaxAMD": 120000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 323067,
        "estimatedRefundAMD": 36034,
        "effectiveFinancingCostAMD": 287033
      },
      {
        "year": 2027,
        "quarter": 2,
        "projectedMortgageInterestAMD": 29162,
        "eligibleIncomeTaxAMD": 120000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 323067,
        "estimatedRefundAMD": 29162,
        "effectiveFinancingCostAMD": 293905
      },
      {
        "year": 2027,
        "quarter": 3,
        "projectedMortgageInterestAMD": 22128,
        "eligibleIncomeTaxAMD": 120000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 323067,
        "estimatedRefundAMD": 22128,
        "effectiveFinancingCostAMD": 300939
      },
      {
        "year": 2027,
        "quarter": 4,
        "projectedMortgageInterestAMD": 14922,
        "eligibleIncomeTaxAMD": 120000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 323067,
        "estimatedRefundAMD": 14922,
        "effectiveFinancingCostAMD": 308145
      },
      {
        "year": 2028,
        "quarter": 1,
        "projectedMortgageInterestAMD": 7547,
        "eligibleIncomeTaxAMD": 120000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 323067,
        "estimatedRefundAMD": 7547,
        "effectiveFinancingCostAMD": 315520
      },
      {
        "year": 2028,
        "quarter": 2,
        "projectedMortgageInterestAMD": 846,
        "eligibleIncomeTaxAMD": 120000,
        "quarterlyRefundCapAMD": 750000,
        "mortgagePaymentsBeforeRefundAMD": 107686,
        "estimatedRefundAMD": 846,
        "effectiveFinancingCostAMD": 106840
      }
    ],
    "expectedAnnual": [
      {
        "year": 2026,
        "estimatedRefundAMD": 27760
      },
      {
        "year": 2027,
        "estimatedRefundAMD": 102246
      },
      {
        "year": 2028,
        "estimatedRefundAMD": 8393
      }
    ],
    "expectedTotals": {
      "totalEstimatedRefundAMD": 138399,
      "totalMortgagePaymentsBeforeRefundAMD": 1938399,
      "totalEffectiveFinancingCostAMD": 1800000,
      "effectiveAverageMonthlyFinancingCostAMD": 100000
    }
  }
] as const;
