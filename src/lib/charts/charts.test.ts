import { describe, it, expect } from "vitest";
import { buildCharts } from "./index";
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
        },
      ],
    };
    const { charts } = buildCharts(quant, emptyText());
    expect(charts[0].type).toBe("histogram");
    if (charts[0].type === "histogram") {
      expect(charts[0].data).toHaveLength(10);
      expect(charts[0].mean).toBe(35);
    }
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
        },
      ],
    };
    const { charts } = buildCharts(quant, emptyText());
    if (charts[0].type === "histogram") {
      expect(charts[0].data).toHaveLength(1);
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

  it("collapses categories beyond top 10 into 'Other'", () => {
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
      expect(charts[0].data).toHaveLength(11); // 10 + "Other"
      expect(charts[0].data[10].label).toBe("Other");
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
