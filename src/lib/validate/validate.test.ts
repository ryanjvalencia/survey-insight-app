import { describe, it, expect } from "vitest";
import { validateFileMetadata, validateCSVContent } from "./index";

// ---------------------------------------------------------------------------
// validateFileMetadata
// ---------------------------------------------------------------------------

describe("validateFileMetadata", () => {
  it("accepts a valid CSV by MIME type", () => {
    const result = validateFileMetadata({
      name: "survey.csv",
      size: 1024,
      type: "text/csv",
    });
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("accepts a CSV identified only by .csv extension when MIME is generic", () => {
    const result = validateFileMetadata({
      name: "export.csv",
      size: 512,
      type: "application/octet-stream",
    });
    expect(result.valid).toBe(true);
  });

  it("accepts application/vnd.ms-excel MIME type", () => {
    const result = validateFileMetadata({
      name: "data.csv",
      size: 100,
      type: "application/vnd.ms-excel",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a non-CSV file type with no .csv extension", () => {
    const result = validateFileMetadata({
      name: "report.xlsx",
      size: 2048,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "INVALID_MIME_TYPE", severity: "error" })
    );
  });

  it("rejects an empty file", () => {
    const result = validateFileMetadata({
      name: "empty.csv",
      size: 0,
      type: "text/csv",
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "EMPTY_FILE", severity: "error" })
    );
  });

  it("rejects a file over 10 MB", () => {
    const result = validateFileMetadata({
      name: "huge.csv",
      size: 11 * 1024 * 1024,
      type: "text/csv",
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "FILE_TOO_LARGE", severity: "error" })
    );
  });

  it("accepts a file exactly at the 10 MB limit", () => {
    const result = validateFileMetadata({
      name: "edge.csv",
      size: 10 * 1024 * 1024,
      type: "text/csv",
    });
    expect(result.valid).toBe(true);
  });

  it("returns multiple errors when both type and size are invalid", () => {
    const result = validateFileMetadata({
      name: "bad.pdf",
      size: 20 * 1024 * 1024,
      type: "application/pdf",
    });
    expect(result.valid).toBe(false);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(2);
  });

  it("error messages contain no file content or cell values", () => {
    const result = validateFileMetadata({
      name: "bad.pdf",
      size: 0,
      type: "application/pdf",
    });
    for (const issue of result.issues) {
      expect(issue.message).not.toMatch(/bad\.pdf/);
    }
  });
});

// ---------------------------------------------------------------------------
// validateCSVContent
// ---------------------------------------------------------------------------

describe("validateCSVContent", () => {
  it("accepts a well-formed CSV", () => {
    const csv = "name,score,comment\nAlice,9,great\nBob,7,ok";
    const result = validateCSVContent(csv);
    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(2);
    expect(result.columnCount).toBe(3);
    expect(result.issues).toHaveLength(0);
  });

  it("strips a UTF-8 BOM and still validates correctly", () => {
    const bom = "﻿";
    const csv = `${bom}name,score\nAlice,9`;
    const result = validateCSVContent(csv);
    expect(result.valid).toBe(true);
    expect(result.columnCount).toBe(2);
  });

  it("handles Windows-style CRLF line endings", () => {
    const csv = "name,score\r\nAlice,9\r\nBob,7";
    const result = validateCSVContent(csv);
    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(2);
  });

  it("ignores a trailing blank line", () => {
    const csv = "name,score\nAlice,9\nBob,7\n";
    const result = validateCSVContent(csv);
    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(2);
  });

  it("rejects completely empty content", () => {
    const result = validateCSVContent("");
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "EMPTY_FILE" })
    );
  });

  it("rejects whitespace-only content", () => {
    const result = validateCSVContent("   \n  \n");
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "EMPTY_FILE" })
    );
  });

  it("rejects a file with an empty header row", () => {
    const result = validateCSVContent(",,,\nAlice,9,yes,no");
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "NO_HEADERS" })
    );
  });

  it("rejects a file with only a header row and no data", () => {
    const result = validateCSVContent("name,score,comment");
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "NO_DATA_ROWS" })
    );
    expect(result.rowCount).toBe(0);
    expect(result.columnCount).toBe(3);
  });

  it("returns a warning (not error) for inconsistent column counts", () => {
    const csv = "name,score,comment\nAlice,9\nBob,7,great";
    const result = validateCSVContent(csv);
    expect(result.valid).toBe(true); // warning only, not blocking
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "INCONSISTENT_COLUMNS",
        severity: "warning",
      })
    );
  });

  it("rejects a file exceeding 50,000 data rows", () => {
    const header = "id,value\n";
    const rows = Array.from({ length: 50_001 }, (_, i) => `${i},x`).join("\n");
    const result = validateCSVContent(header + rows);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "EXCEEDS_ROW_LIMIT", severity: "error" })
    );
  });

  it("accepts a file with exactly 50,000 data rows", () => {
    const header = "id,value\n";
    const rows = Array.from({ length: 50_000 }, (_, i) => `${i},x`).join("\n");
    const result = validateCSVContent(header + rows);
    expect(result.valid).toBe(true);
    expect(result.rowCount).toBe(50_000);
  });

  it("handles quoted fields containing commas without counting extra columns", () => {
    const csv = `name,bio\nAlice,"Engineer, NY"\nBob,"Designer, LA"`;
    const result = validateCSVContent(csv);
    expect(result.valid).toBe(true);
    expect(result.columnCount).toBe(2);
    expect(result.issues.filter((i) => i.code === "INCONSISTENT_COLUMNS")).toHaveLength(0);
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = `name,quote\nAlice,"She said ""hello"""\nBob,ok`;
    const result = validateCSVContent(csv);
    expect(result.valid).toBe(true);
    expect(result.columnCount).toBe(2);
  });

  it("issue messages contain no cell values", () => {
    const csv = "name,score\nAlice\nBob,7,extra";
    const result = validateCSVContent(csv);
    for (const issue of result.issues) {
      expect(issue.message).not.toMatch(/Alice/);
      expect(issue.message).not.toMatch(/extra/);
    }
  });
});
