import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import RefundPanel from "../RefundPanel";
import { calculateFinancing } from "@/lib/financing";
import { sample } from "@/lib/financing/income-tax-refund/__tests__/fixtures";
import type { ResolvedWidget } from "../types";
import FinancingCalculator from "../FinancingCalculator";
import { translate, widgetMessages, type WidgetLanguage } from "../messages";

afterEach(cleanup);
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
function amount(
  label: string | RegExp,
  value: string,
  root: Pick<typeof screen, "getByLabelText"> = screen,
) {
  fireEvent.change(root.getByLabelText(label), { target: { value } });
}
const hy = (key: keyof typeof widgetMessages) => translate("hy", key);
function fillIncome(
  gross = "500000",
  date = "2026-01-31",
  loan = "2026-01-01",
) {
  amount(hy("firstPayment"), date);
  amount(hy("loanDate"), loan);
  amount(hy("gross"), gross);
}
function estimate() {
  fireEvent.click(screen.getByLabelText(hy("financialScenarioAssumptions")));
  fireEvent.click(screen.getByRole("button", { name: hy("calculateRefund") }));
}
describe("salary-only financial refund scenario", () => {
  it("calculates without property or borrower questionnaires and never verifies entitlement", () => {
    const value = fixture(true);
    const original = JSON.stringify(value.configuration);
    const changed = vi.fn();
    render(<RefundPanel {...value} onProjectionChange={changed} />);
    for (const key of [
      "propertyRegion",
      "purchaseSource",
      "employee",
      "owner",
      "prior",
      "tuition",
      "allocation",
      "settlement",
      "identity",
      "documentsChecked",
    ] as const)
      expect(screen.queryByLabelText(hy(key))).not.toBeInTheDocument();
    fillIncome();
    estimate();
    expect(selectedTax()).toBe(100000);
    expect(
      Number(
        screen.getByTestId("total-refund").textContent?.replace(/[^\d]/g, ""),
      ),
    ).toBe(300000);
    expect(
      screen.getByRole("heading", { name: hy("conditionalEstimate") }),
    ).toBeVisible();
    expect(changed.mock.lastCall?.[0]).toMatchObject({
      calculationBasis: "financial_scenario",
      eligibility: { status: "not_assessed" },
    });
    expect(JSON.stringify(value.configuration)).toBe(original);
  });
  it("requires an explicit acknowledgement, then preserves salary when editing", () => {
    render(<RefundPanel {...fixture(true)} />);
    fillIncome();
    fireEvent.click(
      screen.getByRole("button", { name: hy("calculateRefund") }),
    );
    expect(screen.getByRole("alert")).toBeVisible();
    estimate();
    fireEvent.click(screen.getByText(hy("editRefund")));
    expect(screen.getByLabelText(hy("gross"))).toHaveValue("500000");
    amount(hy("gross"), "600000");
    expect(screen.queryByTestId("total-refund")).not.toBeInTheDocument();
  });
  it("preserves zero actual tax and unsupported historical salary rules", () => {
    render(<RefundPanel {...fixture(true)} />);
    fillIncome("500000", "2019-01-31", "2019-01-01");
    estimate();
    expect(screen.getByRole("alert")).toBeVisible();
    amount(hy("withheld"), "0");
    fireEvent.click(
      screen.getByRole("button", { name: hy("calculateRefund") }),
    );
    expect(selectedTax()).toBe(0);
    expect(screen.getByTestId("total-refund")).toHaveTextContent("0");
  });
  it("supports a distinct co-borrower without duplicating their tax", () => {
    render(<RefundPanel {...fixture(true)} />);
    fillIncome();
    fireEvent.click(screen.getByLabelText(hy("includeCo")));
    const other = within(screen.getByRole("group", { name: hy("coSalary") }));
    amount(hy("gross"), "250000", other);
    amount(hy("withheld"), "0", other);
    estimate();
    expect(selectedTax()).toBe(100000);
    expect(screen.getByTestId("total-refund")).toHaveTextContent("300");
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
    amount(t("loanDate"), "2026-01-01");
    return t;
  }
  it.each([
    ["50000", 60000],
    ["0", 0],
  ] as const)("shows a full six-month total for salary %s", (gross, total) => {
    const t = setup("en", false, 6, gross);
    fireEvent.click(screen.getByLabelText(t("financialScenarioAssumptions")));
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
    fireEvent.click(screen.getByLabelText(t("financialScenarioAssumptions")));
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
    expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(18);
    expect(numeric(screen.getByTestId("monthly-net-payment").textContent)).toBe(
      292,
    );
    expect(
      screen.getByRole("region", { name: t("refundTitle") }),
    ).toBeVisible();
  });
  it("recalculates changed terms in place without losing payroll, dates, acknowledgement or typing focus", () => {
    const t = setup("en", true, 240);
    fireEvent.click(screen.getByLabelText(t("includeCo")));
    const co = within(screen.getByRole("group", { name: t("coSalary") }));
    amount(t("gross"), "250000", co);
    amount(t("withheld"), "0", co);
    fireEvent.click(screen.getByLabelText(t("financialScenarioAssumptions")));
    fireEvent.click(screen.getByRole("button", { name: t("calculateRefund") }));
    const salary = within(
      screen.getByRole("group", { name: t("borrowerSalary"), hidden: true }),
    ).getByLabelText(t("gross"));
    const down = screen.getByLabelText(t("down"));
    down.focus();
    amount(t("down"), "30");
    // Independent Decimal reference: 24.5m principal, 240 months, 9%, unchanged payroll.
    expect(numeric(screen.getByTestId("monthly-payment").textContent)).toBe(
      220433,
    );
    expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
      20409941,
    );
    expect(numeric(screen.getByTestId("monthly-net-payment").textContent)).toBe(
      135391,
    );
    expect(down).toHaveFocus();
    const term = screen.getByLabelText(t("duration"));
    term.focus();
    amount(t("duration"), "");
    expect(screen.queryByTestId("payment-breakdown")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: t("refundTitle") }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("closeRefund") }),
    ).toHaveAttribute("aria-expanded", "true");
    amount(t("duration"), "0");
    expect(screen.getByRole("alert")).toBeVisible();
    amount(t("duration"), "180");
    expect(term).toHaveFocus();
    expect(term).toBe(screen.getByLabelText(t("duration")));
    expect(numeric(screen.getByTestId("monthly-payment").textContent)).toBe(
      248495,
    );
    expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
      14899059,
    );
    expect(numeric(screen.getByTestId("total-net-payment").textContent)).toBe(
      29830153,
    );
    expect(numeric(screen.getByTestId("monthly-net-payment").textContent)).toBe(
      165723,
    );
    expect(
      screen.getByRole("button", { name: t("calculateRefund"), hidden: true }),
    ).not.toBeVisible();
    fireEvent.click(screen.getByText(t("editRefund")));
    expect(salary).toBeInTheDocument();
    expect(salary).toHaveValue("500000");
    expect(co.getByLabelText(t("gross"))).toHaveValue("250000");
    expect(co.getByLabelText(t("withheld"))).toHaveValue("0");
    expect(screen.getByLabelText(t("includeCo"))).toBeChecked();
    expect(
      screen.getByLabelText(t("financialScenarioAssumptions")),
    ).toBeChecked();
    expect(screen.getByLabelText(t("loanDate"))).toHaveValue("2026-01-01");
    expect(screen.getByLabelText(t("firstPayment"))).toHaveValue("2026-01-31");
  });
  it("keeps a manually closed refund section closed while recalculating a selected term", () => {
    const { configuration } = fixture(true);
    configuration.controls.limits.supportedDurations = [3, 6];
    render(
      <FinancingCalculator
        configuration={configuration}
        initialLanguage="en"
        notify={() => {}}
      />,
    );
    const t = (key: keyof typeof widgetMessages) => translate("en", key);
    fireEvent.click(screen.getByRole("button", { name: t("openRefund") }));
    amount(t("loanDate"), "2026-01-01");
    amount(t("firstPayment"), "2026-01-31");
    amount(t("gross"), "50000");
    fireEvent.click(screen.getByLabelText(t("financialScenarioAssumptions")));
    fireEvent.click(screen.getByRole("button", { name: t("calculateRefund") }));
    fireEvent.click(screen.getByRole("button", { name: t("closeRefund") }));
    amount(t("duration"), "6");
    expect(
      screen.getByRole("button", { name: t("openRefund") }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(numeric(screen.getByTestId("monthly-refund").textContent)).toBe(
      10000,
    );
    fireEvent.click(screen.getByRole("button", { name: t("openRefund") }));
    expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(60000);
    expect(screen.getByLabelText(t("gross"))).toHaveValue("50000");
  });
  it("handles 100% down payment and restores the existing refund when principal returns", () => {
    const t = setup("en");
    fireEvent.click(screen.getByLabelText(t("financialScenarioAssumptions")));
    fireEvent.click(screen.getByRole("button", { name: t("calculateRefund") }));
    amount(t("down"), "100");
    expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(0);
    expect(numeric(screen.getByTestId("total-bank-payment").textContent)).toBe(
      0,
    );
    expect(
      screen.getByRole("button", { name: t("closeRefund") }),
    ).toBeVisible();
    amount(t("down"), "20");
    expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
      300000,
    );
    expect(screen.getByLabelText(t("gross"))).toHaveValue("500000");
  });
  it.each(languages)(
    "shows the independent 300000 AMD full-term refund reference in %s",
    (language) => {
      const t = setup(language);
      fireEvent.click(screen.getByLabelText(t("financialScenarioAssumptions")));
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
    "requires financial inputs without legal questions in %s",
    (language) => {
      const t = setup(language, true);
      expect(screen.queryByTestId("payment-breakdown")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: t("calculateRefund") }),
      ).toBeVisible();
      amount(t("gross"), "-1");
      fireEvent.click(screen.getByLabelText(t("financialScenarioAssumptions")));
      fireEvent.click(
        screen.getByRole("button", { name: t("calculateRefund") }),
      );
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
