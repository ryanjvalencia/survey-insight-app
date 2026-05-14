import type { ValidationIssue, ValidationResult } from "@/types";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS = 50_000;

const ACCEPTED_MIME_TYPES = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "text/plain",
]);

/**
 * Validates file metadata (name, size, MIME type) without reading content.
 * Suitable for both client-side pre-flight and server-side enforcement.
 */
export function validateFileMetadata(meta: {
  name: string;
  size: number;
  type: string;
}): ValidationResult {
  const issues: ValidationIssue[] = [];

  const isCSV =
    ACCEPTED_MIME_TYPES.has(meta.type) ||
    meta.name.toLowerCase().endsWith(".csv");

  if (!isCSV) {
    issues.push({
      code: "INVALID_MIME_TYPE",
      message: "Only CSV files are accepted.",
      severity: "error",
    });
  }

  if (meta.size === 0) {
    issues.push({
      code: "EMPTY_FILE",
      message: "The file is empty.",
      severity: "error",
    });
  } else if (meta.size > MAX_BYTES) {
    issues.push({
      code: "FILE_TOO_LARGE",
      message: "File size exceeds the 10 MB limit.",
      severity: "error",
    });
  }

  return { valid: issues.every((i) => i.severity !== "error"), issues };
}

/**
 * Validates the text content of a CSV file.
 * Strips UTF-8 BOM, checks headers, data rows, row count, and column consistency.
 * Never logs or returns cell values — only structural metadata.
 */
export function validateCSVContent(text: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Strip UTF-8 BOM if present
  const content = text.startsWith("﻿") ? text.slice(1) : text;

  const lines = content.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);

  if (nonEmpty.length === 0) {
    issues.push({
      code: "EMPTY_FILE",
      message: "The file contains no content.",
      severity: "error",
    });
    return { valid: false, issues };
  }

  const headers = splitCSVRow(nonEmpty[0]);

  if (headers.length === 0 || headers.every((h) => h.trim() === "")) {
    issues.push({
      code: "NO_HEADERS",
      message: "The first row does not contain column headers.",
      severity: "error",
    });
  }

  const dataLines = nonEmpty.slice(1);

  if (dataLines.length === 0) {
    issues.push({
      code: "NO_DATA_ROWS",
      message: "The file contains headers but no data rows.",
      severity: "error",
    });
    return {
      valid: issues.every((i) => i.severity !== "error"),
      issues,
      columnCount: headers.length,
      rowCount: 0,
    };
  }

  if (dataLines.length > MAX_ROWS) {
    issues.push({
      code: "EXCEEDS_ROW_LIMIT",
      message: `File contains more than ${MAX_ROWS.toLocaleString()} data rows.`,
      severity: "error",
    });
  }

  // Sample first 100 rows + last row for column consistency check
  const sampleIndices = new Set([
    ...Array.from({ length: Math.min(100, dataLines.length) }, (_, i) => i),
    dataLines.length - 1,
  ]);
  const sample = Array.from(sampleIndices).map((i) => dataLines[i]);

  let inconsistentCount = 0;
  for (const line of sample) {
    if (splitCSVRow(line).length !== headers.length) {
      inconsistentCount++;
    }
  }

  if (inconsistentCount > 0) {
    issues.push({
      code: "INCONSISTENT_COLUMNS",
      message: `${inconsistentCount} sampled row(s) have a different number of columns than the header.`,
      severity: "warning",
    });
  }

  return {
    valid: issues.every((i) => i.severity !== "error"),
    issues,
    rowCount: dataLines.length,
    columnCount: headers.length,
  };
}

/**
 * Splits a single CSV row into fields, handling double-quoted fields
 * (including quoted commas and escaped quotes via "").
 * Used only for column-count validation — full parsing is in issue #6.
 */
function splitCSVRow(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cols.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}
