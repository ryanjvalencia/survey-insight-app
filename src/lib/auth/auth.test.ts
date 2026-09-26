import { describe, it, expect } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  readCredentials,
  safeRedirectPath,
  validateCredentials,
} from "./index";

function form(entries: Record<string, string | Blob>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("readCredentials", () => {
  it("trims and lowercases the email but leaves the password untouched", () => {
    const creds = readCredentials(form({ email: "  Ana@Example.COM ", password: " pass word " }));
    expect(creds).toEqual({ email: "ana@example.com", password: " pass word " });
  });

  it("treats missing fields as empty strings", () => {
    expect(readCredentials(new FormData())).toEqual({ email: "", password: "" });
  });

  it("treats non-string entries such as files as empty", () => {
    const creds = readCredentials(form({ email: new Blob(["x"]), password: new Blob(["y"]) }));
    expect(creds).toEqual({ email: "", password: "" });
  });
});

describe("validateCredentials", () => {
  const valid = { email: "ana@example.com", password: "a".repeat(MIN_PASSWORD_LENGTH) };

  it("accepts a well-formed email and a password at the minimum length", () => {
    expect(validateCredentials(valid)).toBeNull();
  });

  it("rejects an empty email or password", () => {
    expect(validateCredentials({ ...valid, email: "" })).toMatch(/email and password/);
    expect(validateCredentials({ ...valid, password: "" })).toMatch(/email and password/);
  });

  it("rejects malformed emails", () => {
    for (const email of ["ana", "ana@", "@example.com", "ana@example", "a na@example.com"]) {
      expect(validateCredentials({ ...valid, email })).toMatch(/valid email/);
    }
  });

  it("rejects a password one character shorter than the minimum", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateCredentials({ ...valid, password })).toMatch(/at least/);
  });

  it("never echoes the submitted password in the error message", () => {
    const password = "secret1";
    expect(validateCredentials({ ...valid, password })).not.toContain(password);
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-site paths including query strings", () => {
    expect(safeRedirectPath("/projects/abc/upload")).toBe("/projects/abc/upload");
    expect(safeRedirectPath("/dashboard?tab=1")).toBe("/dashboard?tab=1");
  });

  it("falls back to /dashboard for missing or non-string values", () => {
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
    expect(safeRedirectPath(["/x"])).toBe("/dashboard");
  });

  it("blocks absolute and protocol-relative URLs that would leave the site", () => {
    for (const next of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "dashboard",
    ]) {
      expect(safeRedirectPath(next)).toBe("/dashboard");
    }
  });

  it("blocks paths containing backslashes or control characters", () => {
    expect(safeRedirectPath("/a\\b")).toBe("/dashboard");
    expect(safeRedirectPath("/a\nb")).toBe("/dashboard");
  });

  it("uses a custom fallback when provided", () => {
    expect(safeRedirectPath("https://evil.example", "/")).toBe("/");
  });
});
