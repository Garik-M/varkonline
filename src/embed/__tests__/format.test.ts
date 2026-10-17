import { expect, it } from "vitest";
import { money, number } from "../format";
it("preserves supplied fractional rate precision and whole currency units", () => {
  expect(number(9.555)).toMatch(/^9[.,]555$/);
  expect(number(1e-30)).toBe("1e-30");
  expect(money(1250, "AMD").replace(/[^0-9]/g, "")).toBe("1250");
  expect(money(1250, "AMD")).toMatch(/ ֏$/);
  expect(money(1250, "USD").replace(/[^0-9]/g, "")).toBe("1250");
  expect(money(1250, "USD")).toMatch(/ \$$/);
});
