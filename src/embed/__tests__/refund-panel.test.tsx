import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import FinancingCalculator from "../FinancingCalculator";
import type { ResolvedWidget } from "../types";
import { mortgageControlPreset } from "../calculator-options";
import { sample } from "@/lib/financing/income-tax-refund/__tests__/fixtures";
import { translate, type WidgetLanguage } from "../messages";

afterEach(cleanup);
function fixture(): ResolvedWidget {
  const controls = mortgageControlPreset();
  return {
    partner: {
      slug: "test-partner",
      displayName: "Synthetic fixture",
      revision: 1,
    },
    apartmentId: "A-101",
    calculator: { ...controls.calculator!, allowRepaymentChoice: true },
    financing: {
      financingType: "mortgage",
      currency: "AMD",
      apartmentPrice: 35000000,
      annualInterestRatePercent: 13.25,
      downPaymentPercent: 20,
      durationMonths: 240,
    },
    controls: { ...controls.adjustable, limits: controls.limits },
    appearance: { theme: "light", accentColor: "#173453", logoUrl: null },
    refund: {
      enabled: true,
      facts: sample().eligibility,
      developmentName: null,
      configurationUpdatedAt: "",
      loanOriginationDate: { value: "2026-01-01", verified: false },
      firstPaymentDate: "2026-01-31",
      noInterestSubsidy: null,
    },
    estimateNotice: "Test",
  };
}
const t = (
  key: Parameters<typeof translate>[1],
  language: WidgetLanguage = "en",
) => translate(language, key);
const amount = (id: string) =>
  Number(screen.getByTestId(id).textContent!.replace(/[^\d]/g, ""));
function mount(configuration = fixture(), language: WidgetLanguage = "en") {
  const track = vi.fn();
  render(
    <FinancingCalculator
      configuration={configuration}
      initialLanguage={language}
      notify={vi.fn()}
      track={track}
    />,
  );
  return track;
}
function salary(value = "500000") {
  fireEvent.change(screen.getByTestId("net-salary"), { target: { value } });
}
function input(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("Visible net-salary refund calculator", () => {
  it("shows salary immediately with no dropdown, dates, withholding or acknowledgement", () => {
    mount();
    expect(screen.getByTestId("net-salary")).toBeVisible();
    expect(document.querySelector('input[type="date"]')).toBeNull();
    expect(document.querySelector('input[type="checkbox"]')).toBeNull();
    expect(document.querySelector(".vk-refund-toggle")).toBeNull();
    expect(screen.queryByTestId("total-refund")).toBeNull();
    expect(amount("monthly-payment")).toBe(333041);
  });
  it("matches independent Decimal references and uses the first-month allocation rather than a lifetime average", () => {
    mount();
    salary();
    expect(amount("salary-tax")).toBe(139086);
    expect(amount("monthly-refund")).toBe(139086);
    expect(amount("monthly-net-payment")).toBe(193955);
    expect(amount("total-bank-payment")).toBe(79929410);
    expect(amount("total-refund")).toBe(30333367);
    expect(amount("total-net-payment")).toBe(49596043);
  });
  it("shows the shrinking refund without refunding principal at the last month", () => {
    mount();
    salary();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "240" } });
    expect(amount("monthly-payment")).toBe(332611);
    expect(amount("monthly-refund")).toBe(3632);
    expect(amount("monthly-net-payment")).toBe(328979);
  });
  it("recalculates exact dram down payments and years in place, retaining salary and typing focus", () => {
    mount();
    salary();
    const field = screen.getByLabelText(t("downAmount"));
    field.focus();
    input(t("downAmount"), "10500000");
    expect(field).toHaveFocus();
    expect(amount("monthly-payment")).toBe(291411);
    expect(amount("total-refund")).toBe(29784076);
    expect(screen.getByTestId("net-salary")).toHaveValue(500000);
    const term = screen.getByLabelText(t("durationYears"));
    term.focus();
    input(t("durationYears"), "");
    expect(screen.queryByTestId("monthly-net-payment")).toBeNull();
    expect(screen.getByTestId("net-salary")).toHaveValue(500000);
    input(t("durationYears"), "15");
    expect(term).toHaveFocus();
    expect(amount("monthly-payment")).toBe(314025);
    expect(amount("total-refund")).toBe(21760414);
    expect(amount("total-net-payment")).toBe(34764328);
  });
  it("validates minimum, maximum and term locally without clamping the entered value", () => {
    mount();
    input(t("downAmount"), "3499999");
    expect(screen.getByLabelText(t("downAmount"))).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText(/Down payment must be/)).toBeVisible();
    input(t("downAmount"), "35000001");
    expect(screen.getByLabelText(t("downAmount"))).toHaveValue(35000001);
    input(t("downAmount"), "3500000");
    input(t("durationYears"), "9");
    expect(screen.getByLabelText(t("durationYears"))).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    input(t("durationYears"), "21");
    expect(screen.getByLabelText(t("durationYears"))).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    input(t("durationYears"), "10");
    expect(screen.getByLabelText(t("durationYears"))).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });
  it("uses 10000 AMD spin increments and accepts exact whole-AMD manual entry", () => {
    mount();
    expect(screen.getByLabelText(t("downAmount"))).toHaveAttribute(
      "step",
      "10000",
    );
    input(t("downAmount"), "7000001");
    expect(screen.getByLabelText(t("downAmount"))).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    fireEvent.click(
      screen.getByText(t("schedule"), { exact: false, selector: "summary" }),
    );
    expect(amount("down-payment")).toBe(7000001);
  });
  it("accepts comma fractional interest, validates 1–30 and recalculates without clearing salary", () => {
    mount();
    salary();
    input(t("annualRate"), "12,75");
    expect(screen.getByLabelText(t("annualRate"))).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(screen.getByTestId("net-salary")).toHaveValue(500000);
    input(t("annualRate"), "0.99");
    expect(screen.getByLabelText(t("annualRate"))).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    input(t("annualRate"), "30.01");
    expect(screen.getByLabelText(t("annualRate"))).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    for (const invalid of ["0x10", "1e1", "Infinity"]) {
      input(t("annualRate"), invalid);
      expect(screen.getByLabelText(t("annualRate"))).toHaveAttribute("aria-invalid", "true");
    }
    input(t("annualRate"), "1");
    expect(screen.getByLabelText(t("annualRate"))).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });
  it("supports declining bank payments with the existing quarterly refund engine", () => {
    mount();
    salary();
    fireEvent.change(screen.getByLabelText(t("repaymentMethod")), {
      target: { value: "equal_principal" },
    });
    expect(amount("monthly-payment")).toBe(425834);
    expect(amount("total-bank-payment")).toBe(65254587);
    expect(amount("total-refund")).toBe(25941666);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "240" } });
    expect(amount("monthly-payment")).toBe(117955);
    expect(amount("monthly-refund")).toBe(1288);
  });
  it("handles zero salary and fully paid purchases, restoring the estimate when principal returns", () => {
    mount();
    salary("0");
    expect(amount("total-refund")).toBe(0);
    salary();
    input(t("downAmount"), "35000000");
    expect(amount("total-bank-payment")).toBe(0);
    expect(screen.getByTestId("net-salary")).toHaveValue(500000);
    input(t("downAmount"), "7000000");
    expect(amount("total-refund")).toBe(30333367);
  });
  it.each(["hy", "en", "ru"] as const)(
    "preserves results across language changes to %s",
    (language) => {
      mount();
      salary();
      fireEvent.change(screen.getByLabelText(t("language")), {
        target: { value: language },
      });
      expect(screen.getByLabelText(t("netSalary", language))).toHaveValue(
        500000,
      );
      expect(amount("total-refund")).toBe(30333367);
    },
  );
  it("respects hidden controls and refund visibility", () => {
    const config = fixture();
    config.refund.enabled = false;
    config.calculator!.rateEditable = false;
    config.calculator!.showSchedule = false;
    config.controls.downPaymentPercent = false;
    mount(config);
    expect(screen.queryByTestId("net-salary")).toBeNull();
    expect(document.querySelector(".vk-schedule")).toBeNull();
    expect(screen.queryByLabelText(t("downAmount"))).toBeNull();
    expect(screen.getByTestId("annual-rate")).toHaveTextContent("13.25%");
  });
  it("tracks named actions without salary contents", () => {
    const track = mount();
    salary();
    fireEvent.blur(screen.getByTestId("net-salary"));
    expect(track).toHaveBeenCalledWith("field_changed", "net_salary");
    expect(track).toHaveBeenCalledWith("refund_calculated");
    expect(JSON.stringify(track.mock.calls)).not.toContain("500000");
  });
});
