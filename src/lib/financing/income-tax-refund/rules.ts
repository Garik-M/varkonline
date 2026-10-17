import type { RefundRuleSet } from "./input";

/** Explicitly select this snapshot; later forecasts hold these rules constant. */
export const ARMENIA_REFUND_RULES_2026_10: RefundRuleSet = Object.freeze({
  version: "AM-160-1321N-2026-10-17",
  reviewedAsOf: "2026-10-17",
  supportedOriginationsFrom: "2018-01-01",
  maxContractPriceAMD: 55_000_000,
  quarterlyCaps: Object.freeze([
    Object.freeze({ fromDate: "2018-01-01", amountAMD: 1_500_000 }),
    Object.freeze({ fromDate: "2025-01-01", amountAMD: 750_000 }),
  ]),
  salaryRates: Object.freeze([
    Object.freeze({ fromMonth: "2020-01", ratePercent: 23 }),
    Object.freeze({ fromMonth: "2021-01", ratePercent: 22 }),
    Object.freeze({ fromMonth: "2022-01", ratePercent: 21 }),
    Object.freeze({ fromMonth: "2023-01", ratePercent: 20 }),
  ]),
  yerevanCutoffs: Object.freeze({
    "1": "2022-07-01", "2": "2023-01-01", "3": "2023-07-01", other: "2025-01-01",
  }),
  permitExceptionBefore: "2022-01-01",
  firstRegionalCutoff: "2027-01-01",
  firstRestrictedRegions: Object.freeze(["aragatsotn", "ararat", "armavir", "kotayk"] as const),
  otherRegionalCutoff: "2029-01-01",
  sources: Object.freeze([
    Object.freeze({ id: "tax-code", url: "https://www.arlis.am/hy/acts/230455",
      description: "Tax Code Articles 150, 160 and 160.1; Article 160 amended through HO-291-N of 12 June 2024." }),
    Object.freeze({ id: "procedure", url: "https://www.arlis.am/hy/acts/200943",
      description: "Decision 1321-N, Annex paragraphs 2–5.5 and 8–8.2; consolidated from 1 January 2025." }),
    Object.freeze({ id: "permit-transition", url: "https://www.arlis.am/hy/acts/157898",
      description: "Law HO-360-N, Article 5(2): permit decisions before 1 January 2022 exempt the Yerevan phase-out." }),
    Object.freeze({ id: "2025-amendment", url: "https://www.arlis.am/en/acts/198544",
      description: "Decision 1626-N of 17 October 2024: caps and 2027/2029 regional exclusions, effective 1 January 2025." }),
    Object.freeze({ id: "src-guidance", url: "https://www.src.am/storage/File_Link_Uploade/tv_yndhanur_teghekutyun_rev0626_6a26b2c6dad5f.pdf",
      description: "SRC June 2026 salary income tax guide, pages 12–14: mortgage refunds, co-owners, tuition overlap, regional transitions." }),
  ]),
});

export function quarterlyCap(originationDate: string, rules: RefundRuleSet): number | null {
  let cap: number | null = null;
  for (const row of rules.quarterlyCaps) if (originationDate >= row.fromDate) cap = row.amountAMD;
  return cap;
}
