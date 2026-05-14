import { describe, it, expect } from "vitest";
import { parseCSV } from "./index";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function headers(text: string) {
  return parseCSV(text, "test.csv").dataset.headers;
}
function rows(text: string) {
  return parseCSV(text, "test.csv").dataset.rows;
}
function warnings(text: string) {
  return parseCSV(text, "test.csv").dataset.parseWarnings;
}

// ---------------------------------------------------------------------------
// basic parsing
// ---------------------------------------------------------------------------

describe("parseCSV — basic", () => {
  it("parses a simple CSV into headers and rows", () => {
    const csv = "name,score\nAlice,9\nBob,7";
    expect(headers(csv)).toEqual(["name", "score"]);
    expect(rows(csv)).toEqual([
      { name: "Alice", score: "9" },
      { name: "Bob", score: "7" },
    ]);
  });

  it("returns correct rowCount", () => {
    const csv = "a,b\n1,2\n3,4\n5,6";
    expect(parseCSV(csv, "test.csv").dataset.rowCount).toBe(3);
  });

  it("trims whitespace from header names", () => {
    const csv = " name , score \nAlice,9";
    expect(headers(csv)).toEqual(["name", "score"]);
  });

  it("preserves whitespace inside data cells", () => {
    const csv = "note\n  leading space";
    expect(rows(csv)[0]["note"]).toBe("  leading space");
  });

  it("sanitizes the originalFilename", () => {
    const result = parseCSV("a,b\n1,2", "my survey (2024).csv");
    expect(result.originalFilename).toBe("my_survey__2024_.csv");
  });
});

// ---------------------------------------------------------------------------
// line endings
// ---------------------------------------------------------------------------

describe("parseCSV — line endings", () => {
  it("handles LF line endings", () => {
    expect(rows("a,b\n1,2\n3,4")).toHaveLength(2);
  });

  it("handles CRLF line endings", () => {
    expect(rows("a,b\r\n1,2\r\n3,4")).toHaveLength(2);
  });

  it("handles bare CR line endings", () => {
    expect(rows("a,b\r1,2\r3,4")).toHaveLength(2);
  });

  it("ignores a trailing blank line", () => {
    expect(rows("a,b\n1,2\n3,4\n")).toHaveLength(2);
  });

  it("ignores multiple trailing blank lines", () => {
    expect(rows("a,b\n1,2\n\n\n")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// BOM
// ---------------------------------------------------------------------------

describe("parseCSV — BOM", () => {
  it("strips a UTF-8 BOM from the start", () => {
    const bom = "﻿";
    const csv = `${bom}name,score\nAlice,9`;
    expect(headers(csv)).toEqual(["name", "score"]);
  });

  it("BOM does not appear in the first header name", () => {
    const bom = "﻿";
    const csv = `${bom}id,value\n1,x`;
    expect(headers(csv)[0]).toBe("id");
  });
});

// ---------------------------------------------------------------------------
// quoted fields
// ---------------------------------------------------------------------------

describe("parseCSV — quoted fields", () => {
  it("handles a quoted field containing a comma", () => {
    const csv = `name,bio\nAlice,"Engineer, NY"`;
    expect(rows(csv)[0]["bio"]).toBe("Engineer, NY");
  });

  it("handles a quoted field containing a newline", () => {
    const csv = `name,note\nAlice,"line one\nline two"\nBob,ok`;
    expect(rows(csv)[0]["note"]).toBe("line one\nline two");
    expect(rows(csv)[1]["name"]).toBe("Bob");
  });

  it("handles escaped double-quotes inside a quoted field", () => {
    const csv = `name,quote\nAlice,"She said ""hello"""`;
    expect(rows(csv)[0]["quote"]).toBe('She said "hello"');
  });

  it("handles an empty quoted field", () => {
    const csv = `a,b,c\n1,"",3`;
    expect(rows(csv)[0]["b"]).toBe("");
  });

  it("handles a quoted field containing only whitespace", () => {
    const csv = `a,b\n1,"   "`;
    expect(rows(csv)[0]["b"]).toBe("   ");
  });
});

// ---------------------------------------------------------------------------
// short / long rows
// ---------------------------------------------------------------------------

describe("parseCSV — row length mismatches", () => {
  it("fills missing fields with empty string and records a warning", () => {
    const csv = "a,b,c\n1,2";
    expect(rows(csv)[0]["c"]).toBe("");
    expect(warnings(csv)[0]).toMatch(/fewer fields/);
  });

  it("ignores extra fields and records a warning", () => {
    const csv = "a,b\n1,2,3,4";
    expect(Object.keys(rows(csv)[0])).toHaveLength(2);
    expect(warnings(csv)[0]).toMatch(/more fields/);
  });

  it("counts multiple short rows in one warning, not one per row", () => {
    const csv = "a,b,c\n1\n2\n3";
    const w = warnings(csv);
    expect(w).toHaveLength(1);
    expect(w[0]).toMatch(/3 row\(s\)/);
  });

  it("produces no warnings for a perfectly consistent file", () => {
    expect(warnings("a,b\n1,2\n3,4")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// empty / degenerate inputs
// ---------------------------------------------------------------------------

describe("parseCSV — empty and degenerate inputs", () => {
  it("returns an empty dataset with a warning for empty text", () => {
    const result = parseCSV("", "test.csv");
    expect(result.dataset.rowCount).toBe(0);
    expect(result.dataset.parseWarnings).toHaveLength(1);
  });

  it("returns an empty dataset with a warning for whitespace-only text", () => {
    const result = parseCSV("   \n  \n", "test.csv");
    expect(result.dataset.rowCount).toBe(0);
  });

  it("returns an empty dataset with a warning when header row is all empty", () => {
    const result = parseCSV(",,,\n1,2,3,4", "test.csv");
    expect(result.dataset.rowCount).toBe(0);
    expect(result.dataset.parseWarnings).toHaveLength(1);
  });

  it("returns zero rows when only a header row is present", () => {
    const result = parseCSV("name,score", "test.csv");
    expect(result.dataset.headers).toEqual(["name", "score"]);
    expect(result.dataset.rowCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// privacy — no cell values in warnings
// ---------------------------------------------------------------------------

describe("parseCSV — privacy", () => {
  it("warnings never contain cell values from short rows", () => {
    const csv = "a,b,c\nSECRET_VALUE";
    const w = warnings(csv);
    for (const msg of w) {
      expect(msg).not.toContain("SECRET_VALUE");
    }
  });

  it("warnings never contain cell values from long rows", () => {
    const csv = "a,b\n1,2,SECRET_EXTRA";
    const w = warnings(csv);
    for (const msg of w) {
      expect(msg).not.toContain("SECRET_EXTRA");
    }
  });
});
