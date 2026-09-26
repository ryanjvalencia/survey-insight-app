import { describe, it, expect } from "vitest";
import { analyzeQuantitative, histogramBins, HISTOGRAM_BIN_COUNT } from "./index";
import type { ColumnMapping, Dataset } from "@/types";

function makeDataset(
  headers: string[],
  rows: Record<string, string>[],
): Dataset {
  return { headers, rows, rowCount: rows.length, parseWarnings: [] };
}

function makeMapping(
  name: string,
  type: ColumnMapping["type"],
): ColumnMapping {
  return { name, type, inferredType: type, confidence: 0.9 };
}

// ── NPS ───────────────────────────────────────────────────────────────────────

describe("analyzeQuantitative — NPS", () => {
  it("computes score, segments, and mean correctly", () => {
    // 2 promoters (9,10), 1 passive (8), 2 detractors (5,3)
    const dataset = makeDataset(
      ["score"],
      [
        { score: "9" },
        { score: "10" },
        { score: "8" },
        { score: "5" },
        { score: "3" },
      ],
    );
    const { nps } = analyzeQuantitative(dataset, [makeMapping("score", "nps")]);
    expect(nps).toHaveLength(1);
    const r = nps[0];
    expect(r.promoters).toBe(2);
    expect(r.passives).toBe(1);
    expect(r.detractors).toBe(2);
    // NPS = (2-2)/5 * 100 = 0
    expect(r.score).toBe(0);
    expect(r.totalResponses).toBe(5);
    expect(r.mean).toBeCloseTo((9 + 10 + 8 + 5 + 3) / 5, 2);
  });

  it("returns positive NPS when promoters exceed detractors", () => {
    const dataset = makeDataset(
      ["s"],
      [{ s: "10" }, { s: "9" }, { s: "9" }, { s: "6" }],
    );
    const { nps } = analyzeQuantitative(dataset, [makeMapping("s", "nps")]);
    expect(nps[0].score).toBeGreaterThan(0);
  });

  it("skips empty NPS values", () => {
    const dataset = makeDataset(
      ["s"],
      [{ s: "7" }, { s: "" }, { s: "8" }],
    );
    const { nps } = analyzeQuantitative(dataset, [makeMapping("s", "nps")]);
    expect(nps[0].totalResponses).toBe(2);
  });

  it("returns no NPS result when all values are empty", () => {
    const dataset = makeDataset(["s"], [{ s: "" }]);
    const { nps } = analyzeQuantitative(dataset, [makeMapping("s", "nps")]);
    expect(nps).toHaveLength(0);
  });

  it("returns promoterPct + passivePct + detractorPct ≈ 100", () => {
    const dataset = makeDataset(
      ["s"],
      [{ s: "10" }, { s: "7" }, { s: "3" }],
    );
    const { nps } = analyzeQuantitative(dataset, [makeMapping("s", "nps")]);
    const total =
      nps[0].promoterPct + nps[0].passivePct + nps[0].detractorPct;
    expect(total).toBeCloseTo(100, 1);
  });
});

// ── Rating ────────────────────────────────────────────────────────────────────

describe("analyzeQuantitative — rating", () => {
  it("computes mean, median, min, max, and distribution", () => {
    const dataset = makeDataset(
      ["stars"],
      [{ stars: "1" }, { stars: "3" }, { stars: "5" }, { stars: "5" }],
    );
    const { ratings } = analyzeQuantitative(dataset, [
      makeMapping("stars", "rating"),
    ]);
    const r = ratings[0];
    expect(r.mean).toBeCloseTo((1 + 3 + 5 + 5) / 4, 2);
    expect(r.median).toBe(4);
    expect(r.min).toBe(1);
    expect(r.max).toBe(5);
    expect(r.distribution["5"]).toBe(2);
    expect(r.totalResponses).toBe(4);
  });

  it("computes median for odd-length arrays", () => {
    const dataset = makeDataset(
      ["stars"],
      [{ stars: "1" }, { stars: "2" }, { stars: "5" }],
    );
    const { ratings } = analyzeQuantitative(dataset, [
      makeMapping("stars", "rating"),
    ]);
    expect(ratings[0].median).toBe(2);
  });
});

// ── Numeric ───────────────────────────────────────────────────────────────────

describe("analyzeQuantitative — numeric", () => {
  it("computes mean, median, stdDev, min, max", () => {
    const dataset = makeDataset(
      ["age"],
      [{ age: "10" }, { age: "20" }, { age: "30" }],
    );
    const { numerics } = analyzeQuantitative(dataset, [
      makeMapping("age", "numeric"),
    ]);
    const r = numerics[0];
    expect(r.mean).toBeCloseTo(20, 2);
    expect(r.median).toBe(20);
    expect(r.min).toBe(10);
    expect(r.max).toBe(30);
    expect(r.stdDev).toBeGreaterThan(0);
  });

  it("handles negative and float values", () => {
    const dataset = makeDataset(
      ["v"],
      [{ v: "-1.5" }, { v: "0" }, { v: "1.5" }],
    );
    const { numerics } = analyzeQuantitative(dataset, [
      makeMapping("v", "numeric"),
    ]);
    expect(numerics[0].mean).toBeCloseTo(0, 5);
    expect(numerics[0].stdDev).toBeGreaterThan(0);
  });

  it("skips non-numeric strings", () => {
    const dataset = makeDataset(
      ["v"],
      [{ v: "abc" }, { v: "5" }],
    );
    const { numerics } = analyzeQuantitative(dataset, [
      makeMapping("v", "numeric"),
    ]);
    expect(numerics[0].totalResponses).toBe(1);
  });
});

// ── Category ──────────────────────────────────────────────────────────────────

describe("analyzeQuantitative — category", () => {
  it("counts frequencies and sorts by descending count", () => {
    const dataset = makeDataset(
      ["seg"],
      [
        { seg: "A" },
        { seg: "B" },
        { seg: "A" },
        { seg: "C" },
        { seg: "A" },
      ],
    );
    const { categories } = analyzeQuantitative(dataset, [
      makeMapping("seg", "category"),
    ]);
    const r = categories[0];
    expect(r.frequencies[0].value).toBe("A");
    expect(r.frequencies[0].count).toBe(3);
    expect(r.frequencies[0].pct).toBeCloseTo(60, 1);
    expect(r.uniqueCount).toBe(3);
    expect(r.totalResponses).toBe(5);
  });

  it("excludes empty values from frequency count", () => {
    const dataset = makeDataset(
      ["seg"],
      [{ seg: "A" }, { seg: "" }, { seg: "A" }],
    );
    const { categories } = analyzeQuantitative(dataset, [
      makeMapping("seg", "category"),
    ]);
    expect(categories[0].totalResponses).toBe(2);
  });
});

// ── Mixed columns ─────────────────────────────────────────────────────────────

describe("analyzeQuantitative — multiple column types", () => {
  it("analyses all column types in one call", () => {
    const dataset = makeDataset(
      ["nps", "stars", "age", "segment"],
      [{ nps: "8", stars: "4", age: "30", segment: "B" }],
    );
    const mappings = [
      makeMapping("nps", "nps"),
      makeMapping("stars", "rating"),
      makeMapping("age", "numeric"),
      makeMapping("segment", "category"),
    ];
    const result = analyzeQuantitative(dataset, mappings);
    expect(result.nps).toHaveLength(1);
    expect(result.ratings).toHaveLength(1);
    expect(result.numerics).toHaveLength(1);
    expect(result.categories).toHaveLength(1);
  });

  it("ignores id, ignore, open_text, date, and unknown columns", () => {
    const dataset = makeDataset(
      ["id", "junk", "comment", "created", "mystery"],
      [{ id: "1", junk: "x", comment: "hi", created: "2024-01-01", mystery: "?" }],
    );
    const mappings = [
      makeMapping("id", "id"),
      makeMapping("junk", "ignore"),
      makeMapping("comment", "open_text"),
      makeMapping("created", "date"),
      makeMapping("mystery", "unknown"),
    ];
    const result = analyzeQuantitative(dataset, mappings);
    expect(result.nps).toHaveLength(0);
    expect(result.ratings).toHaveLength(0);
    expect(result.numerics).toHaveLength(0);
    expect(result.categories).toHaveLength(0);
  });
});

// ── Histogram bins ────────────────────────────────────────────────────────────

describe("histogramBins", () => {
  it("counts every value exactly once", () => {
    const values = [1, 2, 2, 3, 5, 8, 13, 21, 34, 55];
    const bins = histogramBins(values, HISTOGRAM_BIN_COUNT);
    expect(bins).toHaveLength(HISTOGRAM_BIN_COUNT);
    expect(bins.reduce((sum, b) => sum + b.count, 0)).toBe(values.length);
  });

  it("puts the minimum in the first bin and the maximum in the last", () => {
    const bins = histogramBins([0, 10], 10);
    expect(bins[0].count).toBe(1);
    expect(bins[9].count).toBe(1);
    expect(bins.slice(1, 9).every((b) => b.count === 0)).toBe(true);
  });

  it("spans min to max with equal-width edges", () => {
    const bins = histogramBins([0, 5, 10], 2);
    expect(bins).toEqual([
      { lo: 0, hi: 5, count: 1 },
      { lo: 5, hi: 10, count: 2 },
    ]);
  });

  it("returns one bin holding everything when all values are equal", () => {
    expect(histogramBins([4, 4, 4], 10)).toEqual([{ lo: 4, hi: 4, count: 3 }]);
  });

  it("returns no bins for no values", () => {
    expect(histogramBins([], 10)).toEqual([]);
  });

  it("handles negative and fractional values", () => {
    const bins = histogramBins([-1.5, -0.5, 0.5, 1.5], 2);
    expect(bins.map((b) => b.count)).toEqual([2, 2]);
  });
});

describe("analyzeQuantitative — numeric bins", () => {
  it("attaches populated histogram bins to numeric results", () => {
    const rows = ["500", "1000", "1500", "250000"].map((v) => ({ revenue: v }));
    const dataset = { headers: ["revenue"], rows, rowCount: rows.length, parseWarnings: [] };
    const { numerics } = analyzeQuantitative(dataset, [
      { name: "revenue", type: "numeric", inferredType: "numeric", confidence: 1 },
    ]);
    const bins = numerics[0].bins;
    expect(bins).toHaveLength(HISTOGRAM_BIN_COUNT);
    expect(bins[0].count).toBe(3);
    expect(bins[HISTOGRAM_BIN_COUNT - 1].count).toBe(1);
  });
});
