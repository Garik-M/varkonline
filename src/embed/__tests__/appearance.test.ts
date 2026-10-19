import { describe, expect, it } from "vitest";
import { accentForeground } from "../appearance";

describe("readable partner accent colors", () => {
  it.each([
    ["#173453", "#ffffff"], // Default navy
    ["#7c3aed", "#ffffff"], // Purple
    ["#b42318", "#ffffff"], // Dark red
    ["#facc15", "#000000"], // Yellow
    ["#00ff00", "#000000"],
    ["#000000", "#ffffff"],
    ["#FFFFFF", "#000000"],
  ])("uses contrasting text on %s", (accent, foreground) => {
    expect(accentForeground(accent)).toBe(foreground);
  });
});
