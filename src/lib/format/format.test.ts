import { describe, it, expect } from "vitest";
import {
  compactNumber,
  formatCount,
  formatNumber,
  formatPercent,
  humanizeColumn,
  niceTicks,
} from "./index";

describe("compactNumber", () => {
  it("leaves values under 1,000 as-is (one decimal max)", () => {
    expect(compactNumber(0)).toBe("0");
    expect(compactNumber(950)).toBe("950");
    expect(compactNumber(41.25)).toBe("41.3");
  });

  it("abbreviates thousands, millions, and billions", () => {
    expect(compactNumber(25_507)).toBe("25.5K");
    expect(compactNumber(250_000)).toBe("250K");
    expect(compactNumber(1_200_000)).toBe("1.2M");
    expect(compactNumber(3_000_000_000)).toBe("3B");
  });

  it("promotes values that would round up to 1000 of a unit", () => {
    expect(compactNumber(999_950)).toBe("1M");
  });

  it("keeps the sign on negatives", () => {
    expect(compactNumber(-2_500)).toBe("-2.5K");
  });

  it("returns a dash for non-finite input", () => {
    expect(compactNumber(Number.NaN)).toBe("—");
    expect(compactNumber(Infinity)).toBe("—");
  });
});

describe("formatCount / formatNumber / formatPercent", () => {
  it("formats counts with thousands separators", () => {
    expect(formatCount(10_000)).toBe("10,000");
    expect(formatCount(9.6)).toBe("10");
  });

  it("formats numbers with up to 2 decimals", () => {
    expect(formatNumber(125_250.456)).toBe("125,250.46");
  });

  it("formats percentages with at most one decimal", () => {
    expect(formatPercent(46.14)).toBe("46.1%");
    expect(formatPercent(25)).toBe("25%");
  });
});

describe("niceTicks", () => {
  it("rounds the axis up to a clean maximum", () => {
    expect(niceTicks(1067)).toEqual([0, 500, 1000, 1500]);
    expect(niceTicks(37)).toEqual([0, 10, 20, 30, 40]);
  });

  it("handles small values", () => {
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
  });

  it("returns a minimal axis for empty or zero data", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(Number.NaN)).toEqual([0, 1]);
  });

  it("always covers the maximum value", () => {
    for (const max of [1, 7, 99, 101, 4_321, 98_765]) {
      const ticks = niceTicks(max);
      expect(ticks.at(-1)).toBeGreaterThanOrEqual(max);
      expect(ticks[0]).toBe(0);
    }
  });
});

describe("humanizeColumn", () => {
  it("turns snake_case and kebab-case into sentence case", () => {
    expect(humanizeColumn("annual_revenue")).toBe("Annual revenue");
    expect(humanizeColumn("submission-date")).toBe("Submission date");
  });

  it("keeps common acronyms uppercase", () => {
    expect(humanizeColumn("nps_score")).toBe("NPS score");
    expect(humanizeColumn("respondent_id")).toBe("Respondent ID");
  });

  it("leaves names that already contain spaces or no separators untouched", () => {
    expect(humanizeColumn("How likely are you to recommend us?")).toBe(
      "How likely are you to recommend us?",
    );
    expect(humanizeColumn("Region")).toBe("Region");
  });
});
