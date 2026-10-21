import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CalculatorControlsEditor from "@/components/financing/CalculatorControlsEditor";
import { mortgageControlPreset } from "../calculator-options";

afterEach(cleanup);
it("displays legacy month bounds in years without making a valid settings form unsaveable", () => {
  const value = mortgageControlPreset();
  value.calculator.durationUnit = "months";
  value.limits.durationMonths = { min: 1, max: 600, step: 1 };
  const onChange = vi.fn();
  render(
    <form data-testid="settings">
      <CalculatorControlsEditor value={value} onChange={onChange} mortgage />
    </form>,
  );
  expect(screen.getByLabelText("Minimum term")).toHaveValue(1 / 12);
  expect(screen.getByLabelText("Maximum term")).toHaveValue(50);
  expect(
    (screen.getByTestId("settings") as HTMLFormElement).checkValidity(),
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Minimum term"), {
    target: { value: "10" },
  });
  expect(onChange.mock.calls[0][0].limits.durationMonths.min).toBe(120);
});

it("keeps the standard 10–20 year preset and annuity selection", () => {
  render(
    <CalculatorControlsEditor
      value={mortgageControlPreset()}
      onChange={vi.fn()}
      mortgage
    />,
  );
  expect(screen.getByLabelText("Minimum term")).toHaveValue(10);
  expect(screen.getByLabelText("Maximum term")).toHaveValue(20);
  expect(screen.getByLabelText("Repayment method")).toHaveValue("annuity");
});
