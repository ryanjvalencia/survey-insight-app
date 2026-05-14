import { describe, it, expect } from "vitest";
import { cleanDataset } from "./index";
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

// ── Whitespace trimming ───────────────────────────────────────────────────────

describe("cleanDataset — whitespace trimming", () => {
  it("trims leading and trailing whitespace from all column types", () => {
    const dataset = makeDataset(
      ["label"],
      [{ label: "  hello  " }, { label: "\ttab\t" }],
    );
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("label", "category"),
    ]);
    expect(out.rows[0].label).toBe("hello");
    expect(out.rows[1].label).toBe("tab");
    expect(summary.columns[0].trimmed).toBe(2);
  });

  it("leaves already-trimmed values unchanged", () => {
    const dataset = makeDataset(["v"], [{ v: "clean" }]);
    const { summary } = cleanDataset(dataset, [makeMapping("v", "open_text")]);
    expect(summary.columns[0].trimmed).toBe(0);
  });

  it("preserves empty values as empty strings", () => {
    const dataset = makeDataset(["v"], [{ v: "" }, { v: "   " }]);
    const { dataset: out } = cleanDataset(dataset, [
      makeMapping("v", "category"),
    ]);
    expect(out.rows[0].v).toBe("");
    expect(out.rows[1].v).toBe("");
  });
});

// ── NPS cleaning ──────────────────────────────────────────────────────────────

describe("cleanDataset — NPS column", () => {
  it("keeps valid integer 0–10 values unchanged", () => {
    const dataset = makeDataset(
      ["score"],
      [{ score: "0" }, { score: "5" }, { score: "10" }],
    );
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("score", "nps"),
    ]);
    expect(out.rows.map((r) => r.score)).toEqual(["0", "5", "10"]);
    expect(summary.columns[0].clamped).toBe(0);
    expect(summary.columns[0].nullified).toBe(0);
  });

  it("clamps NPS values below 0 to 0", () => {
    const dataset = makeDataset(["score"], [{ score: "-3" }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("score", "nps"),
    ]);
    expect(out.rows[0].score).toBe("0");
    expect(summary.columns[0].clamped).toBe(1);
  });

  it("clamps NPS values above 10 to 10", () => {
    const dataset = makeDataset(["score"], [{ score: "15" }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("score", "nps"),
    ]);
    expect(out.rows[0].score).toBe("10");
    expect(summary.columns[0].clamped).toBe(1);
  });

  it("nullifies non-numeric NPS values", () => {
    const dataset = makeDataset(["score"], [{ score: "very good" }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("score", "nps"),
    ]);
    expect(out.rows[0].score).toBe("");
    expect(summary.columns[0].nullified).toBe(1);
  });

  it("nullifies non-integer NPS values like 7.5", () => {
    const dataset = makeDataset(["score"], [{ score: "7.5" }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("score", "nps"),
    ]);
    expect(out.rows[0].score).toBe("");
    expect(summary.columns[0].nullified).toBe(1);
  });
});

// ── Rating cleaning ───────────────────────────────────────────────────────────

describe("cleanDataset — rating column", () => {
  it("keeps valid positive integer ratings unchanged", () => {
    const dataset = makeDataset(
      ["stars"],
      [{ stars: "1" }, { stars: "5" }],
    );
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("stars", "rating"),
    ]);
    expect(out.rows.map((r) => r.stars)).toEqual(["1", "5"]);
    expect(summary.columns[0].clamped).toBe(0);
    expect(summary.columns[0].nullified).toBe(0);
  });

  it("clamps rating values below 1 to 1", () => {
    const dataset = makeDataset(["stars"], [{ stars: "0" }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("stars", "rating"),
    ]);
    expect(out.rows[0].stars).toBe("1");
    expect(summary.columns[0].clamped).toBe(1);
  });

  it("nullifies non-integer rating values", () => {
    const dataset = makeDataset(["stars"], [{ stars: "4.5" }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("stars", "rating"),
    ]);
    expect(out.rows[0].stars).toBe("");
    expect(summary.columns[0].nullified).toBe(1);
  });
});

// ── Numeric cleaning ──────────────────────────────────────────────────────────

describe("cleanDataset — numeric column", () => {
  it("keeps valid numeric strings unchanged", () => {
    const dataset = makeDataset(
      ["age"],
      [{ age: "25" }, { age: "-3.14" }],
    );
    const { dataset: out } = cleanDataset(dataset, [
      makeMapping("age", "numeric"),
    ]);
    expect(out.rows[0].age).toBe("25");
    expect(out.rows[1].age).toBe("-3.14");
  });

  it("strips currency symbols and normalizes", () => {
    const dataset = makeDataset(
      ["price"],
      [{ price: "$1,234.56" }, { price: "£99" }],
    );
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("price", "numeric"),
    ]);
    expect(out.rows[0].price).toBe("1234.56");
    expect(out.rows[1].price).toBe("99");
    expect(summary.columns[0].normalized).toBe(2);
  });

  it("nullifies non-numeric values", () => {
    const dataset = makeDataset(["count"], [{ count: "many" }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("count", "numeric"),
    ]);
    expect(out.rows[0].count).toBe("");
    expect(summary.columns[0].nullified).toBe(1);
  });

  it("nullifies Infinity", () => {
    const dataset = makeDataset(["v"], [{ v: "Infinity" }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("v", "numeric"),
    ]);
    expect(out.rows[0].v).toBe("");
    expect(summary.columns[0].nullified).toBe(1);
  });
});

// ── Date cleaning ─────────────────────────────────────────────────────────────

describe("cleanDataset — date column", () => {
  it("preserves ISO date strings", () => {
    const dataset = makeDataset(
      ["created"],
      [{ created: "2024-01-15" }],
    );
    const { dataset: out } = cleanDataset(dataset, [
      makeMapping("created", "date"),
    ]);
    expect(out.rows[0].created).toBe("2024-01-15");
  });

  it("nullifies unparseable date strings", () => {
    const dataset = makeDataset(
      ["created"],
      [{ created: "not-a-date" }],
    );
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("created", "date"),
    ]);
    expect(out.rows[0].created).toBe("");
    expect(summary.columns[0].nullified).toBe(1);
  });
});

// ── Summary statistics ────────────────────────────────────────────────────────

describe("cleanDataset — summary statistics", () => {
  it("totalChanges is the sum of all per-column changes", () => {
    const dataset = makeDataset(
      ["score", "label"],
      [
        { score: "  5  ", label: " hi " },
        { score: "11", label: "ok" },
      ],
    );
    const { summary } = cleanDataset(dataset, [
      makeMapping("score", "nps"),
      makeMapping("label", "category"),
    ]);
    const manual =
      summary.columns[0].trimmed +
      summary.columns[0].clamped +
      summary.columns[0].nullified +
      summary.columns[0].normalized +
      summary.columns[1].trimmed +
      summary.columns[1].clamped +
      summary.columns[1].nullified +
      summary.columns[1].normalized;
    expect(summary.totalChanges).toBe(manual);
  });

  it("reports totalRows and totalColumns correctly", () => {
    const dataset = makeDataset(
      ["a", "b"],
      [{ a: "1", b: "x" }, { a: "2", b: "y" }],
    );
    const { summary } = cleanDataset(dataset, [
      makeMapping("a", "numeric"),
      makeMapping("b", "category"),
    ]);
    expect(summary.totalRows).toBe(2);
    expect(summary.totalColumns).toBe(2);
  });

  it("returns one stats entry per header column, even if not in mappings", () => {
    const dataset = makeDataset(
      ["a", "b"],
      [{ a: "1", b: "x" }],
    );
    const { summary } = cleanDataset(dataset, [makeMapping("a", "nps")]);
    expect(summary.columns).toHaveLength(2);
  });
});

// ── Passthrough types ─────────────────────────────────────────────────────────

describe("cleanDataset — passthrough column types", () => {
  it("trims but does not otherwise modify 'ignore' columns", () => {
    const dataset = makeDataset(["junk"], [{ junk: "  raw  " }]);
    const { dataset: out, summary } = cleanDataset(dataset, [
      makeMapping("junk", "ignore"),
    ]);
    expect(out.rows[0].junk).toBe("raw");
    expect(summary.columns[0].nullified).toBe(0);
    expect(summary.columns[0].normalized).toBe(0);
  });

  it("trims but does not otherwise modify 'id' columns", () => {
    const dataset = makeDataset(["rid"], [{ rid: " 001 " }]);
    const { dataset: out } = cleanDataset(dataset, [makeMapping("rid", "id")]);
    expect(out.rows[0].rid).toBe("001");
  });

  it("trims but does not modify 'open_text' columns", () => {
    const dataset = makeDataset(
      ["comment"],
      [{ comment: "  Great product!  " }],
    );
    const { dataset: out } = cleanDataset(dataset, [
      makeMapping("comment", "open_text"),
    ]);
    expect(out.rows[0].comment).toBe("Great product!");
  });
});

// ── Dataset integrity ─────────────────────────────────────────────────────────

describe("cleanDataset — dataset integrity", () => {
  it("preserves row count", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ score: String(i) }));
    const dataset = makeDataset(["score"], rows);
    const { dataset: out } = cleanDataset(dataset, [
      makeMapping("score", "nps"),
    ]);
    expect(out.rows).toHaveLength(10);
    expect(out.rowCount).toBe(10);
  });

  it("preserves headers order", () => {
    const dataset = makeDataset(
      ["c", "b", "a"],
      [{ c: "1", b: "2", a: "3" }],
    );
    const { dataset: out } = cleanDataset(dataset, [
      makeMapping("c", "numeric"),
      makeMapping("b", "category"),
      makeMapping("a", "category"),
    ]);
    expect(out.headers).toEqual(["c", "b", "a"]);
  });

  it("does not mutate the input dataset", () => {
    const row = { score: "  7  " };
    const dataset = makeDataset(["score"], [row]);
    cleanDataset(dataset, [makeMapping("score", "nps")]);
    expect(row.score).toBe("  7  ");
  });
});
