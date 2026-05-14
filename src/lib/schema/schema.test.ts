import { describe, it, expect } from "vitest";
import { validateSchema } from "./index";
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

// ── NPS ──────────────────────────────────────────────────────────────────────

describe("validateSchema — NPS column", () => {
  it("passes for valid integer 0–10 values", () => {
    const dataset = makeDataset(
      ["score"],
      [{ score: "0" }, { score: "5" }, { score: "10" }],
    );
    const result = validateSchema(dataset, [makeMapping("score", "nps")]);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("warns when values are outside 0–10", () => {
    const dataset = makeDataset(
      ["score"],
      [{ score: "5" }, { score: "11" }, { score: "-1" }],
    );
    const result = validateSchema(dataset, [makeMapping("score", "nps")]);
    expect(result.valid).toBe(true);
    const issue = result.issues.find((i) => i.code === "NPS_INVALID_VALUES");
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("warning");
    expect(issue?.affectedCount).toBe(2);
  });

  it("warns when values are non-integer (e.g. 7.5)", () => {
    const dataset = makeDataset(
      ["score"],
      [{ score: "7.5" }, { score: "8" }],
    );
    const result = validateSchema(dataset, [makeMapping("score", "nps")]);
    const issue = result.issues.find((i) => i.code === "NPS_INVALID_VALUES");
    expect(issue).toBeDefined();
    expect(issue?.affectedCount).toBe(1);
  });

  it("warns when values are non-numeric strings", () => {
    const dataset = makeDataset(
      ["score"],
      [{ score: "abc" }, { score: "5" }],
    );
    const result = validateSchema(dataset, [makeMapping("score", "nps")]);
    const issue = result.issues.find((i) => i.code === "NPS_INVALID_VALUES");
    expect(issue?.affectedCount).toBe(1);
  });
});

// ── Rating ────────────────────────────────────────────────────────────────────

describe("validateSchema — rating column", () => {
  it("passes for valid positive integer values", () => {
    const dataset = makeDataset(
      ["stars"],
      [{ stars: "1" }, { stars: "3" }, { stars: "5" }],
    );
    const result = validateSchema(dataset, [makeMapping("stars", "rating")]);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("warns for negative or zero rating values", () => {
    const dataset = makeDataset(
      ["stars"],
      [{ stars: "0" }, { stars: "3" }],
    );
    const result = validateSchema(dataset, [makeMapping("stars", "rating")]);
    const issue = result.issues.find((i) => i.code === "RATING_INVALID_VALUES");
    expect(issue?.affectedCount).toBe(1);
  });

  it("warns for non-integer rating values", () => {
    const dataset = makeDataset(
      ["stars"],
      [{ stars: "4.5" }, { stars: "5" }],
    );
    const result = validateSchema(dataset, [makeMapping("stars", "rating")]);
    const issue = result.issues.find((i) => i.code === "RATING_INVALID_VALUES");
    expect(issue?.affectedCount).toBe(1);
  });
});

// ── Numeric ───────────────────────────────────────────────────────────────────

describe("validateSchema — numeric column", () => {
  it("passes for valid numeric strings", () => {
    const dataset = makeDataset(
      ["age"],
      [{ age: "25" }, { age: "3.14" }, { age: "-7" }],
    );
    const result = validateSchema(dataset, [makeMapping("age", "numeric")]);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("warns for non-numeric values", () => {
    const dataset = makeDataset(
      ["age"],
      [{ age: "twenty" }, { age: "30" }],
    );
    const result = validateSchema(dataset, [makeMapping("age", "numeric")]);
    const issue = result.issues.find(
      (i) => i.code === "NUMERIC_INVALID_VALUES",
    );
    expect(issue?.affectedCount).toBe(1);
    expect(issue?.severity).toBe("warning");
  });
});

// ── Date ──────────────────────────────────────────────────────────────────────

describe("validateSchema — date column", () => {
  it("passes for valid ISO date strings", () => {
    const dataset = makeDataset(
      ["score", "created"],
      [
        { score: "7", created: "2024-01-15" },
        { score: "8", created: "2023-12-31" },
      ],
    );
    const mappings = [
      makeMapping("score", "nps"),
      makeMapping("created", "date"),
    ];
    const result = validateSchema(dataset, mappings);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("warns for unparseable date strings", () => {
    const dataset = makeDataset(
      ["score", "created"],
      [
        { score: "7", created: "not-a-date" },
        { score: "8", created: "2024-01-01" },
      ],
    );
    const mappings = [
      makeMapping("score", "nps"),
      makeMapping("created", "date"),
    ];
    const result = validateSchema(dataset, mappings);
    const issue = result.issues.find((i) => i.code === "DATE_INVALID_VALUES");
    expect(issue?.affectedCount).toBe(1);
    expect(issue?.severity).toBe("warning");
  });
});

// ── Structural errors ─────────────────────────────────────────────────────────

describe("validateSchema — structural errors", () => {
  it("errors when a column has no non-empty values", () => {
    const dataset = makeDataset(
      ["score"],
      [{ score: "" }, { score: "  " }],
    );
    const result = validateSchema(dataset, [makeMapping("score", "nps")]);
    expect(result.valid).toBe(false);
    const issue = result.issues.find((i) => i.code === "COLUMN_ALL_EMPTY");
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("error");
    expect(issue?.affectedCount).toBe(2);
  });

  it("errors when no analysable columns are mapped", () => {
    const dataset = makeDataset(
      ["id", "segment"],
      [{ id: "1", segment: "A" }],
    );
    const mappings = [
      makeMapping("id", "id"),
      makeMapping("segment", "category"),
    ];
    const result = validateSchema(dataset, mappings);
    expect(result.valid).toBe(false);
    const issue = result.issues.find(
      (i) => i.code === "NO_ANALYSABLE_COLUMNS",
    );
    expect(issue).toBeDefined();
  });

  it("errors when mappings array is empty", () => {
    const dataset = makeDataset(["score"], [{ score: "5" }]);
    const result = validateSchema(dataset, []);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "NO_ANALYSABLE_COLUMNS")).toBe(
      true,
    );
  });

  it("warns when fill rate is below 50%", () => {
    const rows = [
      { score: "5" },
      { score: "" },
      { score: "" },
      { score: "" },
    ];
    const dataset = makeDataset(["score"], rows);
    const result = validateSchema(dataset, [makeMapping("score", "nps")]);
    const issue = result.issues.find(
      (i) => i.code === "COLUMN_LOW_FILL_RATE",
    );
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("warning");
    expect(issue?.affectedCount).toBe(3);
  });

  it("does not warn when fill rate is exactly 50%", () => {
    const rows = [{ score: "5" }, { score: "7" }, { score: "" }, { score: "" }];
    const dataset = makeDataset(["score"], rows);
    const result = validateSchema(dataset, [makeMapping("score", "nps")]);
    expect(result.issues.some((i) => i.code === "COLUMN_LOW_FILL_RATE")).toBe(
      false,
    );
  });
});

// ── Skip types ────────────────────────────────────────────────────────────────

describe("validateSchema — ignored and id columns", () => {
  it("skips 'ignore' columns entirely", () => {
    const dataset = makeDataset(["junk"], [{ junk: "" }]);
    const result = validateSchema(dataset, [makeMapping("junk", "ignore")]);
    expect(result.issues.some((i) => i.columnName === "junk")).toBe(false);
  });

  it("skips 'id' columns entirely", () => {
    const dataset = makeDataset(
      ["respondent_id", "score"],
      [{ respondent_id: "r1", score: "8" }],
    );
    const mappings = [
      makeMapping("respondent_id", "id"),
      makeMapping("score", "nps"),
    ];
    const result = validateSchema(dataset, mappings);
    expect(result.issues.some((i) => i.columnName === "respondent_id")).toBe(
      false,
    );
  });

  it("does not error on NO_ANALYSABLE_COLUMNS if an nps column exists alongside id columns", () => {
    const dataset = makeDataset(
      ["id", "score"],
      [{ id: "1", score: "7" }],
    );
    const mappings = [makeMapping("id", "id"), makeMapping("score", "nps")];
    const result = validateSchema(dataset, mappings);
    expect(result.issues.some((i) => i.code === "NO_ANALYSABLE_COLUMNS")).toBe(
      false,
    );
  });
});

// ── Multi-column ──────────────────────────────────────────────────────────────

describe("validateSchema — multiple columns", () => {
  it("reports issues for each column independently", () => {
    const dataset = makeDataset(
      ["nps_score", "rating"],
      [
        { nps_score: "11", rating: "abc" },
        { nps_score: "5", rating: "4" },
      ],
    );
    const mappings = [
      makeMapping("nps_score", "nps"),
      makeMapping("rating", "rating"),
    ];
    const result = validateSchema(dataset, mappings);
    expect(result.issues.some((i) => i.code === "NPS_INVALID_VALUES")).toBe(
      true,
    );
    expect(result.issues.some((i) => i.code === "RATING_INVALID_VALUES")).toBe(
      true,
    );
  });

  it("returns valid:true with only warnings (no errors)", () => {
    const dataset = makeDataset(
      ["score"],
      [{ score: "5" }, { score: "11" }],
    );
    const result = validateSchema(dataset, [makeMapping("score", "nps")]);
    expect(result.valid).toBe(true);
    expect(result.issues.every((i) => i.severity === "warning")).toBe(true);
  });
});
