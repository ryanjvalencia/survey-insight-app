import { describe, it, expect } from "vitest";
import { isUuid } from "./index";

describe("isUuid", () => {
  it("accepts lowercase and uppercase canonical UUIDs", () => {
    expect(isUuid("3f2c1a9e-7b4d-4c8a-9e1f-0a1b2c3d4e5f")).toBe(true);
    expect(isUuid("3F2C1A9E-7B4D-4C8A-9E1F-0A1B2C3D4E5F")).toBe(true);
  });

  it("rejects non-UUID project ids such as the old 'demo' route", () => {
    expect(isUuid("demo")).toBe(false);
    expect(isUuid("")).toBe(false);
  });

  it("rejects UUIDs with missing hyphens, extra characters, or wrong length", () => {
    expect(isUuid("3f2c1a9e7b4d4c8a9e1f0a1b2c3d4e5f")).toBe(false);
    expect(isUuid("3f2c1a9e-7b4d-4c8a-9e1f-0a1b2c3d4e5f0")).toBe(false);
    expect(isUuid(" 3f2c1a9e-7b4d-4c8a-9e1f-0a1b2c3d4e5f")).toBe(false);
    expect(isUuid("3f2c1a9e-7b4d-4c8a-9e1f-0a1b2c3d4e5g")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(123)).toBe(false);
  });
});
