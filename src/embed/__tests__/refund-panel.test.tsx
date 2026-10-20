import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import RefundPanel from "../RefundPanel";
import { calculateFinancing } from "@/lib/financing";
import { sample } from "@/lib/financing/income-tax-refund/__tests__/fixtures";
import type { ResolvedWidget } from "../types";
import FinancingCalculator from "../FinancingCalculator";
import { translate, widgetMessages, type WidgetLanguage } from "../messages";

afterEach(cleanup);
const nextLabel = "Շարունակել՝ ստուգել պայմանները";
const selectedTax = () =>
  Number(
    screen
      .getByTestId("salary-tax")
      .querySelector("strong")
      ?.textContent?.replace(/[^\d]/g, "") ?? NaN,
  );
function fixture(
  unreviewed = false,
  price = 35000000,
  durationMonths = 3,
  annualInterestRatePercent = 9,
) {
  const input = {
    financingType: "mortgage",
    currency: "AMD",
    apartmentPrice: price,
    annualInterestRatePercent,
    downPaymentPercent: 20,
    durationMonths,
  } as const;
  const financing = calculateFinancing(input);
  const facts = sample({ financing }).eligibility;
  const configuration: ResolvedWidget = {
    partner: {
      slug: "test-partner",
      displayName: "Synthetic fixture",
      revision: 1,
    },
    apartmentId: "A-101",
    financing: input,
    controls: {
      downPaymentPercent: true,
      durationMonths: true,
      limits: {
        apartmentPrice: { min: 1, max: 1e12 },
        annualInterestRatePercent: { min: 0, max: 100 },
        downPaymentPercent: { min: 0, max: 100, step: 1 },
        durationMonths: { min: 1, max: 600, step: 1 },
        supportedDurations: [],
      },
    },
    appearance: { theme: "light", accentColor: "#29986c", logoUrl: null },
    estimateNotice: "Synthetic estimate",
    refund: {
      enabled: true,
      facts: unreviewed
        ? (Object.fromEntries(
            Object.keys(facts).map((key) => [key, null]),
          ) as typeof facts)
        : facts,
      developmentName: null,
      configurationUpdatedAt: "2026-10-19T00:00:00Z",
      loanOriginationDate: unreviewed
        ? null
        : { value: "2026-01-01", verified: true },
      firstPaymentDate: null,
      noInterestSubsidy: { value: true, verified: true },
    },
  };
  return { financing, configuration };
}
function amount(label: string | RegExp, value: string, root = screen) {
  fireEvent.change(root.getByLabelText(label), { target: { value } });
}
function firstStep(gross = "500000", date = "2026-01-31") {
  amount("Առաջին ամսական վճարման ամսաթիվ", date);
  amount("Գրանցված ամսական համախառն աշխատավարձ, ֏", gross);
}
const hy = (key: keyof typeof widgetMessages) => translate("hy", key);
function conditions(completeProperty = true) {
  amount(hy("loanDate"), "2026-01-01");
  if (completeProperty) {
    amount(hy("purchaseSource"), "developer_apartment");
    amount(hy("propertyRegion"), "kotayk");
  }
  for (const key of ["employee", "owner"] as const) amount(hy(key), "yes");
  amount(hy("prior"), "none");
  amount(hy("tuition"), "no");
  amount(hy("allocation"), "0");
  amount(hy("settlement"), "projected");
  for (const key of ["noSubsidy", "scenarioAssumptions"] as const) {
    const checkbox = screen.getByLabelText(hy(key)) as HTMLInputElement;
    if (!checkbox.checked) fireEvent.click(checkbox);
  }
}
describe("self-service conditional refund", () => {
  it("estimates without any staff property or development records", () => {
    const value = fixture(true);
    const original = JSON.stringify(value.configuration);
    render(<RefundPanel {...value} />);
    firstStep();
    expect(
      screen.queryByLabelText(hy("propertyRegion")),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    expect(selectedTax()).toBe(100000);
    conditions();
    fireEvent.click(
      screen.getByRole("button", { name: hy("calculateRefund") }),
    );
    expect(
      Number(
        screen.getByTestId("total-refund").textContent?.replace(/[^\d]/g, ""),
      ),
    ).toBe(300000);
    expect(
      screen.getByRole("heading", { name: hy("conditionalEstimate") }),
    ).toBeVisible();
    fireEvent.click(screen.getByText(hy("refundDetails")));
    expect(screen.getByText(hy("conditionalNotice"))).toBeVisible();
    expect(screen.queryByLabelText(hy("identity"))).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(hy("documentsChecked")),
    ).not.toBeInTheDocument();
    expect(JSON.stringify(value.configuration)).toBe(original);
  });
  it("keeps missing property facts unresolved instead of inventing eligibility", () => {
    render(<RefundPanel {...fixture(true)} />);
    firstStep();
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    conditions(false);
    fireEvent.click(
      screen.getByRole("button", { name: hy("calculateRefund") }),
    );
    expect(screen.getByTestId("total-refund")).toHaveTextContent(
      hy("unresolved"),
    );
  });
  it("rejects a known excluded purchase and allows correcting the answer", () => {
    render(<RefundPanel {...fixture(true)} />);
    firstStep();
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    conditions();
    amount(hy("purchaseSource"), "secondary_market");
    fireEvent.click(
      screen.getByRole("button", { name: hy("calculateRefund") }),
    );
    expect(screen.getByTestId("total-refund")).toHaveTextContent("0");
    fireEvent.click(screen.getByText(hy("editRefund")));
    amount(hy("purchaseSource"), "developer_apartment");
    fireEvent.click(
      screen.getByRole("button", { name: hy("calculateRefund") }),
    );
    expect(
      Number(
        screen.getByTestId("total-refund").textContent?.replace(/[^\d]/g, ""),
      ),
    ).toBe(300000);
  });
  it("requires explicit assumptions before calculating and retains salary on back navigation", () => {
    render(<RefundPanel {...fixture(true)} />);
    firstStep();
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    amount(hy("loanDate"), "2026-01-01");
    fireEvent.click(
      screen.getByRole("button", { name: hy("calculateRefund") }),
    );
    expect(screen.getByRole("alert")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: hy("back") }));
    expect(screen.getByLabelText(hy("gross"))).toHaveValue("500000");
  });
  it("preserves actual zero withholding and validates unsupported historical tax", () => {
    render(<RefundPanel {...fixture(true)} />);
    firstStep("500000", "2019-01-31");
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    expect(screen.getByRole("alert")).toBeVisible();
    amount(hy("withheld"), "0");
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    expect(selectedTax()).toBe(0);
  });
});

describe("compact multilingual widget and total refund", () => {
  const languages = ["hy", "en", "ru"] as const;
  const numeric = (text: string | null) => Number(text?.replace(/[^\d]/g, ""));
  it("shows full bank repayment before asking for salary", () => {
    render(
      <FinancingCalculator
        configuration={fixture(false, 35000000, 240).configuration}
        initialLanguage="en"
        notify={() => {}}
      />,
    );
    // Independent reference: financed principal 28000000 + rounded schedule interest 32461718.
    expect(numeric(screen.getByTestId("total-bank-payment").textContent)).toBe(
      60461718,
    );
    expect(screen.getByTestId("total-bank-payment").tagName).toBe("STRONG");
    expect(screen.queryByTestId("total-net-payment")).not.toBeInTheDocument();
  });
  function setup(
    language: WidgetLanguage,
    unreviewed = false,
    months = 3,
    gross = "500000",
    price = 35000000,
    rate = 9,
  ) {
    const { configuration } = fixture(unreviewed, price, months, rate);
    render(
      <FinancingCalculator
        configuration={configuration}
        initialLanguage={language}
        notify={() => {}}
      />,
    );
    const t = (key: keyof typeof widgetMessages) => translate(language, key);
    fireEvent.click(screen.getByRole("button", { name: t("openRefund") }));
    amount(t("firstPayment"), "2026-01-31");
    amount(t("gross"), gross);
    fireEvent.click(screen.getByRole("button", { name: t("continue") }));
    return t;
  }
  it.each([
    ["50000", 60000],
    ["0", 0],
  ] as const)("shows a full six-month total for salary %s", (gross, total) => {
    const t = setup("en", false, 6, gross);
    for (const key of ["employee", "owner"] as const) amount(t(key), "yes");
    amount(t("prior"), "none");
    amount(t("tuition"), "no");
    amount(t("allocation"), "0");
    amount(t("settlement"), "projected");
    for (const key of ["scenarioAssumptions"] as const)
      fireEvent.click(screen.getByLabelText(t(key)));
    fireEvent.click(screen.getByRole("button", { name: t("calculateRefund") }));
    // At 50000 AMD gross, tax = 10000/month. Each quarter has sufficient interest,
    // so two full quarters return 2 * (3 * 10000), not just one quarter's 30000.
    expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(total);
    expect(numeric(screen.getByTestId("monthly-refund").textContent)).toBe(
      total / 6,
    );
    expect(
      screen.getByText(translate("en", "refundPeriod", { months: 6 })),
    ).toBeVisible();
  });
  it("uses an approximate sign when the final installment and averaging do not equal the regular payment subtraction", () => {
    const t = setup("en", false, 3, "500000", 1251, 12);
    for (const key of ["employee", "owner"] as const) amount(t(key), "yes");
    amount(t("prior"), "none");
    amount(t("tuition"), "no");
    amount(t("allocation"), "0");
    amount(t("settlement"), "projected");
    for (const key of ["scenarioAssumptions"] as const)
      fireEvent.click(screen.getByLabelText(t(key)));
    fireEvent.click(screen.getByRole("button", { name: t("calculateRefund") }));
    // 1251 - round(20%) = 1001 principal. Interest 10 + 7 + 3 = 20.
    // Payments: 340, 340, 341. Refund/month rounds 20/3 to 7;
    // exact net cost/month rounds 1001/3 to 334, rather than 340-7=333.
    expect(numeric(screen.getByTestId("monthly-payment").textContent)).toBe(
      340,
    );
    expect(numeric(screen.getByTestId("monthly-refund").textContent)).toBe(7);
    expect(numeric(screen.getByTestId("monthly-net-payment").textContent)).toBe(
      334,
    );
    expect(numeric(screen.getByTestId("total-bank-payment").textContent)).toBe(
      1021,
    );
    // Deduct the actual full-term refund of 20, never rounded monthly 7 * 3 = 21.
    expect(numeric(screen.getByTestId("total-net-payment").textContent)).toBe(
      1001,
    );
    expect(screen.getByTestId("payment-breakdown")).toHaveTextContent("≈");
    amount(t("down"), "30");
    expect(screen.queryByTestId("payment-breakdown")).not.toBeInTheDocument();
  });
  it.each(languages)(
    "shows the independent 300000 AMD full-term refund reference in %s",
    (language) => {
      const t = setup(language);
      for (const key of ["employee", "owner"] as const) amount(t(key), "yes");
      amount(t("prior"), "none");
      amount(t("tuition"), "no");
      amount(t("allocation"), "0");
      amount(t("settlement"), "projected");
      for (const key of ["noSubsidy", "scenarioAssumptions"] as const) {
        const checkbox = screen.getByLabelText(t(key)) as HTMLInputElement;
        if (!checkbox.checked) fireEvent.click(checkbox);
      }
      fireEvent.click(
        screen.getByRole("button", { name: t("calculateRefund") }),
      );
      expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
        300000,
      );
      expect(numeric(screen.getByTestId("effective-cost").textContent)).toBe(
        9373682,
      );
      expect(numeric(screen.getByTestId("monthly-payment").textContent)).toBe(
        9473682,
      );
      expect(numeric(screen.getByTestId("monthly-refund").textContent)).toBe(
        100000,
      );
      expect(
        numeric(screen.getByTestId("monthly-net-payment").textContent),
      ).toBe(9373682);
      expect(screen.getByTestId("payment-breakdown")).toHaveTextContent("=");
      expect(
        screen.getByTestId("payment-breakdown").closest(".vk-payment"),
      ).toHaveFocus();
      expect(
        screen.getByTestId("monthly-payment").closest("del"),
      ).not.toBeNull();
      expect(
        numeric(screen.getByTestId("total-bank-payment").textContent),
      ).toBe(28421046);
      expect(screen.getByTestId("total-bank-payment").tagName).toBe("DEL");
      expect(numeric(screen.getByTestId("total-net-payment").textContent)).toBe(
        28121046,
      );
      const notes = screen.getByText(t("refundDetails")).closest("details");
      expect(notes).not.toHaveAttribute("open");
      expect(notes?.parentElement?.lastElementChild).toBe(notes);
      fireEvent.click(screen.getByRole("button", { name: t("closeRefund") }));
      expect(screen.getByTestId("payment-breakdown")).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: t("openRefund") }));
      expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
        300000,
      );
      expect(
        screen.getByText(translate(language, "refundPeriod", { months: 3 })),
      ).toBeVisible();
      // Changing only the language must preserve inputs, evidence assertions and calculated totals.
      fireEvent.change(screen.getByRole("combobox", { name: t("language") }), {
        target: { value: "en" },
      });
      expect(
        screen.getByRole("region", { name: "Income tax refund" }),
      ).toBeVisible();
      expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
        300000,
      );
      fireEvent.click(screen.getByText("Edit salary or conditions"));
      fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
      expect(
        screen.getByLabelText("Registered gross monthly salary, ֏"),
      ).toHaveValue("500000");
      amount("Registered gross monthly salary, ֏", "600000");
      expect(screen.queryByTestId("total-refund")).not.toBeInTheDocument();
      expect(screen.queryByTestId("payment-breakdown")).not.toBeInTheDocument();
      expect(screen.queryByTestId("total-net-payment")).not.toBeInTheDocument();
      expect(screen.getByTestId("total-bank-payment").tagName).toBe("STRONG");
    },
  );
  it.each(languages)(
    "keeps unreviewed totals unresolved and localizes validation in %s",
    (language) => {
      const t = setup(language, true);
      expect(screen.queryByTestId("payment-breakdown")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: t("calculateRefund") }),
      ).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: t("back") }));
      amount(t("gross"), "-1");
      fireEvent.click(screen.getByRole("button", { name: t("continue") }));
      expect(screen.getByRole("alert")).toHaveTextContent(t("amountError"));
    },
  );
  it("has nonempty translations for every key and no Armenian fallback in English or Russian", () => {
    for (const entry of Object.values(widgetMessages)) {
      for (const language of languages)
        expect(entry[language].length).toBeGreaterThan(0);
      expect(entry.en).not.toMatch(/[Ա-Ֆա-ֆ]/);
      expect(entry.ru).not.toMatch(/[Ա-Ֆա-ֆ]/);
    }
  });
});
