import { describe, it, expect } from "vitest";
import { capitalize, formatValue, interpretColumn } from "./columns";

describe("interpretColumn — money", () => {
  it.each([
    "annual_revenue",
    "household_income",
    "salary",
    "monthlySpend",
    "Deal Amount",
    "price_paid",
    "MRR",
    "ltv_usd",
  ])("treats %s as currency", (name) => {
    expect(interpretColumn(name).kind).toBe("currency");
  });

  it("does not treat unrelated names as currency", () => {
    for (const name of ["satisfaction_rating", "department", "age", "company_size", "payload"]) {
      expect(interpretColumn(name).kind).toBe("plain");
    }
  });
});

describe("interpretColumn — labels", () => {
  it("turns snake_case and camelCase into a plain phrase without quotes", () => {
    expect(interpretColumn("annual_revenue")).toEqual({
      label: "annual revenue",
      inferred: true,
      kind: "currency",
    });
    expect(interpretColumn("monthlySpend").label).toBe("monthly spend");
  });

  it("drops filler words and question-number prefixes", () => {
    expect(interpretColumn("annual_revenue_usd").label).toBe("annual revenue");
    expect(interpretColumn("q3_satisfaction").label).toBe("satisfaction");
  });

  it("keeps acronyms uppercase", () => {
    expect(interpretColumn("nps_score").label).toBe("NPS score");
    expect(interpretColumn("mrr").label).toBe("MRR");
  });

  it("detects percentages and removes the unit word from the label", () => {
    expect(interpretColumn("discount_pct")).toEqual({ label: "discount", inferred: true, kind: "percent" });
  });

  it("leaves full questions as written, in quotes", () => {
    const m = interpretColumn("How likely are you to recommend us to a friend?");
    expect(m.inferred).toBe(false);
    expect(m.label).toBe('"How likely are you to recommend us to a friend?"');
  });

  it("leaves names with nothing meaningful left as written", () => {
    expect(interpretColumn("col_1")).toEqual({ label: '"col_1"', inferred: false, kind: "plain" });
  });
});

describe("formatValue", () => {
  it("formats by kind", () => {
    expect(formatValue(125_300, "currency")).toBe("$125,300");
    expect(formatValue(12.46, "percent")).toBe("12.5%");
    expect(formatValue(1234.567, "plain")).toBe("1,234.57");
  });
});

describe("capitalize", () => {
  it("uppercases the first character only", () => {
    expect(capitalize("annual revenue")).toBe("Annual revenue");
    expect(capitalize("")).toBe("");
  });
});
