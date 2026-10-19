import type { RefundReason } from "@/lib/financing/income-tax-refund";
const fields: Record<string, string> = {
  residentFinancialLender: "ՀՀ ռեզիդենտ ֆինանսական կազմակերպություն",
  fundsUsedForHousing: "Վարկի նպատակային օգտագործում",
  acquisitionType: "Գույքի ձեռքբերման տեսակ",
  contractPriceAMD: "Պայմանագրային ամբողջ գին",
  location: "Գտնվելու վայր և գնահատման գոտի",
  permitDecisionDate: "Շինթույլտվության որոշման ամսաթիվ",
  propertyRightsRegistered: "Գույքային իրավունքների գրանցում",
  requiredDocumentsAvailable: "Պահանջվող փաստաթղթեր",
  loanOriginationDate: "Վարկի տրամադրման ամսաթիվ",
};
const messages: Partial<Record<RefundReason["code"], string>> = {
  CONTRACT_PRICE_EXCEEDS_LIMIT:
    "Պայմանագրային գինը գերազանցում է օրենքի սահմանաչափը։",
  CONTRACT_PRICE_MISMATCH:
    "Պայմանագրային և հաշվիչի գները տարբերվում են․ անհրաժեշտ է համադրել փաստաթղթերը։",
  LOCATION_RESTRICTED:
    "Գույքի գտնվելու վայրի և վարկի ամսաթվի համար գործում է սահմանափակում։",
  AMD_AMOUNTS_REQUIRED: "Բացակայում են բանկի դրամային տվյալները։",
  ACQUISITION_NOT_ELIGIBLE:
    "Գույքի ձեռքբերման այս տեսակը չի համապատասխանում պայմաններին։",
  PRIOR_OTHER_MORTGAGE:
    "Մեկ այլ հիփոթեքի համար նախկին օգտվելը սահմանափակում է հետվերադարձը։",
  TUITION_BENEFIT_OVERLAP:
    "Ուսման վճարի հետվերադարձը համընկնում է այս պահանջի հետ։",
  NO_ELIGIBLE_PARTICIPANT:
    "Ներառված վարկառուների տվյալներով հետվերադարձի պայմանները չեն բավարարվում։",
  NOT_AN_EMPLOYEE: "Աշխատանքային պայմանագրով աշխատելու պայմանը չի բավարարվում։",
  NOT_AN_OWNER: "Գույքի սեփականատեր լինելու պայմանը չի բավարարվում։",
  TAX_NOT_FULLY_PAID: "Գործատուի հարկը ամբողջությամբ վճարված չէ։",
};
export function refundMessages(reasons: readonly RefundReason[]): string[] {
  return [
    ...new Set(
      reasons
        .filter((reason) => reason.effect !== "information")
        .map(
          (reason) =>
            messages[reason.code] ??
            `${fields[reason.field?.split(".").pop() ?? ""] ?? "Անձնական, հարկային կամ իրավական տվյալներ"}․ պահանջվում է փաստաթղթային ստուգում։`,
        ),
    ),
  ];
}
