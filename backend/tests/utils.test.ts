import { describe, expect, it } from "vitest";
import { isMonthText, monthToHalfYear } from "../src/utils.js";

describe("utils", () => {
  it("should parse half year", () => {
    expect(monthToHalfYear("2026-03")).toBe("2026-H1");
    expect(monthToHalfYear("2026-11")).toBe("2026-H2");
  });

  it("should validate month text", () => {
    expect(isMonthText("2026-09")).toBe(true);
    expect(isMonthText("2026-13")).toBe(false);
    expect(isMonthText("2026/09")).toBe(false);
  });
});
