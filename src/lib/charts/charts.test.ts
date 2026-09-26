import { describe, it, expect } from "vitest";
import { buildCharts, formatBinEdge, formatNpsScore } from "./index";
import type { QuantitativeAnalysis } from "@/lib/analysis";
import type { TextAnalysis } from "@/lib/text";

function emptyQuant(): QuantitativeAnalysis {
  return { nps: [], ratings: [], numerics: [], categories: [] };
}

function emptyText(): TextAnalysis {
  return { columns: [] };
}

// ── NPS gauge ─────────────────────────────────────────────────────────────────

describe("buildCharts — NPS gauge", () => {
  it("produces a nps_gauge chart for each NPS result", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      nps: [
        {
          columnName: "score",
          score: 20,
          promoters: 3,
          passives: 2,
          detractors: 1,
          promoterPct: 50,
          passivePct: 33.33,
          detractorPct: 16.67,
          totalResponses: 6,
          mean: 7.5,
        },
      ],
    };
    const { charts } = buildCharts(quant, emptyText());
    expect(charts).toHaveLength(1);
    expect(charts[0].type).toBe("nps_gauge");
    if (charts[0].type === "nps_gauge") {
      expect(charts[0].score).toBe(20);
      expect(charts[0].totalResponses).toBe(6);
      expect(charts[0].mean).toBe(7.5);
    }
  });
});

// ── Rating bar chart ──────────────────────────────────────────────────────────

describe("buildCharts — rating bar", () => {
  it("produces a bar chart with sorted distribution data", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      ratings: [
        {
          columnName: "stars",
          mean: 3.5,
          median: 4,
          min: 1,
          max: 5,
          distribution: { "3": 2, "1": 1, "5": 3 },
          totalResponses: 6,
        },
      ],
    };
    const { charts } = buildCharts(quant, emptyText());
    expect(charts[0].type).toBe("bar");
    if (charts[0].type === "bar") {
      expect(charts[0].data[0].label).toBe("1");
      expect(charts[0].data[1].label).toBe("3");
      expect(charts[0].data[2].label).toBe("5");
    }
  });
});

// ── Numeric histogram ─────────────────────────────────────────────────────────

describe("buildCharts — numeric histogram", () => {
  it("produces a histogram chart with 10 buckets", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      numerics: [
        {
          columnName: "age",
          mean: 35,
          median: 33,
          stdDev: 10,
          min: 18,
          max: 65,
          totalResponses: 100,
          bins: [
            { lo: 18, hi: 41.5, count: 70 },
            { lo: 41.5, hi: 65, count: 30 },
          ],
        },
      ],
    };
    const { charts } = buildCharts(quant, emptyText());
    expect(charts[0].type).toBe("histogram");
    if (charts[0].type === "histogram") {
      expect(charts[0].data).toEqual([
        { label: "18–41.5", value: 70 },
        { label: "41.5–65", value: 30 },
      ]);
      expect(charts[0].mean).toBe(35);
    }
  });

  it("uses the real bin counts, not zeros (regression)", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      numerics: [
        {
          columnName: "annual_revenue",
          mean: 60_000,
          median: 55_000,
          stdDev: 30_000,
          min: 500,
          max: 250_000,
          totalResponses: 3,
          bins: [
            { lo: 500, hi: 125_250, count: 2 },
            { lo: 125_250, hi: 250_000, count: 1 },
          ],
        },
      ],
    };
    const [chart] = buildCharts(quant, emptyText()).charts;
    if (chart.type !== "histogram") throw new Error("expected histogram");
    expect(chart.data.map((d) => d.value)).toEqual([2, 1]);
    expect(chart.data[0].label).toBe("500–125,250");
  });

  it("renders an empty histogram for results saved before bins existed", () => {
    const legacy = {
      columnName: "v",
      mean: 1,
      median: 1,
      stdDev: 0,
      min: 1,
      max: 2,
      totalResponses: 2,
    } as unknown as QuantitativeAnalysis["numerics"][number];
    const [chart] = buildCharts({ ...emptyQuant(), numerics: [legacy] }, emptyText()).charts;
    if (chart.type !== "histogram") throw new Error("expected histogram");
    expect(chart.data).toEqual([]);
  });

  it("handles min === max (single value dataset)", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      numerics: [
        {
          columnName: "v",
          mean: 5,
          median: 5,
          stdDev: 0,
          min: 5,
          max: 5,
          totalResponses: 3,
          bins: [{ lo: 5, hi: 5, count: 3 }],
        },
      ],
    };
    const { charts } = buildCharts(quant, emptyText());
    if (charts[0].type === "histogram") {
      expect(charts[0].data).toEqual([{ label: "5", value: 3 }]);
    }
  });
});

// ── Category pie chart ────────────────────────────────────────────────────────

describe("buildCharts — category pie", () => {
  it("produces a pie chart from category frequencies", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      categories: [
        {
          columnName: "segment",
          frequencies: [
            { value: "A", count: 5, pct: 50 },
            { value: "B", count: 3, pct: 30 },
            { value: "C", count: 2, pct: 20 },
          ],
          uniqueCount: 3,
          totalResponses: 10,
        },
      ],
    };
    const { charts } = buildCharts(quant, emptyText());
    expect(charts[0].type).toBe("pie");
    if (charts[0].type === "pie") {
      expect(charts[0].data).toHaveLength(3);
    }
  });

  it("collapses categories beyond the top 5 into 'Other' (6 slices max)", () => {
    const frequencies = Array.from({ length: 12 }, (_, i) => ({
      value: `cat${i}`,
      count: 12 - i,
      pct: 0,
    }));
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      categories: [
        {
          columnName: "seg",
          frequencies,
          uniqueCount: 12,
          totalResponses: 78,
        },
      ],
    };
    const { charts } = buildCharts(quant, emptyText());
    if (charts[0].type === "pie") {
      expect(charts[0].data).toHaveLength(6); // top 5 + "Other"
      expect(charts[0].data[5]).toEqual({ label: "Other", value: 78 - (12 + 11 + 10 + 9 + 8) });
    }
  });
});

// ── Word cloud data ───────────────────────────────────────────────────────────

describe("buildCharts — word cloud data", () => {
  it("produces word_cloud_data chart with normalised weights", () => {
    const text: TextAnalysis = {
      columns: [
        {
          columnName: "comment",
          wordFrequencies: [
            { word: "great", count: 10, pct: 50 },
            { word: "good", count: 5, pct: 25 },
          ],
          topWords: [
            { word: "great", count: 10, pct: 50 },
            { word: "good", count: 5, pct: 25 },
          ],
          lengthStats: { mean: 15, median: 14, min: 5, max: 30 },
          sentiment: {
            positive: 8,
            negative: 1,
            neutral: 1,
            total: 10,
            positivePct: 80,
            negativePct: 10,
            neutralPct: 10,
          },
          totalResponses: 10,
        },
      ],
    };
    const { charts } = buildCharts(emptyQuant(), text);
    expect(charts[0].type).toBe("word_cloud_data");
    if (charts[0].type === "word_cloud_data") {
      expect(charts[0].words[0].weight).toBe(1);
      expect(charts[0].words[1].weight).toBe(0.5);
    }
  });
});

// ── Empty inputs ──────────────────────────────────────────────────────────────

describe("buildCharts — empty inputs", () => {
  it("returns empty charts array for empty analysis", () => {
    const { charts } = buildCharts(emptyQuant(), emptyText());
    expect(charts).toHaveLength(0);
  });

  it("combines charts from multiple column types", () => {
    const quant: QuantitativeAnalysis = {
      nps: [
        {
          columnName: "nps",
          score: 10,
          promoters: 1,
          passives: 1,
          detractors: 1,
          promoterPct: 33,
          passivePct: 33,
          detractorPct: 34,
          totalResponses: 3,
          mean: 7,
        },
      ],
      ratings: [
        {
          columnName: "stars",
          mean: 4,
          median: 4,
          min: 3,
          max: 5,
          distribution: { "3": 1, "5": 1 },
          totalResponses: 2,
        },
      ],
      numerics: [],
      categories: [],
    };
    const { charts } = buildCharts(quant, emptyText());
    expect(charts).toHaveLength(2);
    expect(charts.some((c) => c.type === "nps_gauge")).toBe(true);
    expect(charts.some((c) => c.type === "bar")).toBe(true);
  });
});

// ── NPS formatting ────────────────────────────────────────────────────────────

describe("formatNpsScore", () => {
  it("prefixes positive scores with a plus sign", () => {
    expect(formatNpsScore(17.62)).toBe("+17.6");
    expect(formatNpsScore(100)).toBe("+100");
  });

  it("prefixes negative scores with a minus sign", () => {
    expect(formatNpsScore(-4)).toBe("−4");
    expect(formatNpsScore(-100)).toBe("−100");
  });

  it("shows zero without a sign, including values that round to zero", () => {
    expect(formatNpsScore(0)).toBe("0");
    expect(formatNpsScore(0.04)).toBe("0");
    expect(formatNpsScore(-0.04)).toBe("0");
  });

  it("renders a dash for non-finite input", () => {
    expect(formatNpsScore(Number.NaN)).toBe("—");
  });
});

describe("formatBinEdge", () => {
  it("keeps one decimal place for small values", () => {
    expect(formatBinEdge(41.25)).toBe("41.3");
    expect(formatBinEdge(7)).toBe("7");
  });

  it("rounds large values and adds thousands separators", () => {
    expect(formatBinEdge(125_250.4)).toBe("125,250");
    expect(formatBinEdge(-2500)).toBe("-2,500");
  });
});

describe("buildCharts — pie slice limits", () => {
  function pieFor(n: number, totalResponses = n * 2) {
    const frequencies = Array.from({ length: n }, (_, i) => ({ value: `c${i}`, count: 2, pct: 0 }));
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      categories: [{ columnName: "c", frequencies, uniqueCount: n, totalResponses }],
    };
    const [chart] = buildCharts(quant, emptyText()).charts;
    if (chart.type !== "pie") throw new Error("expected pie");
    return chart;
  }

  it("shows exactly 6 categories without an 'Other' slice", () => {
    const chart = pieFor(6);
    expect(chart.data).toHaveLength(6);
    expect(chart.data.some((d) => d.label === "Other")).toBe(false);
  });

  it("derives 'Other' from the column total when the frequency list was truncated", () => {
    // 20 stored categories, but the column had 100 responses in total.
    const chart = pieFor(20, 100);
    expect(chart.data.at(-1)).toEqual({ label: "Other", value: 100 - 5 * 2 });
  });
});
