import type { ColumnMapping, ColumnType, ParseResult } from "@/types";

// Raw uploaded rows never leave the user's device. They are kept in the
// browser (IndexedDB in production) so preview, mapping, and the cleaned-CSV
// export survive navigation and reloads. Because IndexedDB outlives the tab,
// entries expire after LOCAL_RETENTION_MS and everything is cleared on sign out.

export const LOCAL_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/** Minimal async key-value store; implemented by IndexedDB and in memory. */
export interface LocalStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

/** Column name → user-confirmed type, for every column in the upload. */
export type ColumnTypes = Record<string, ColumnType>;

const COLUMN_TYPES: ReadonlySet<string> = new Set<ColumnType>([
  "nps",
  "rating",
  "numeric",
  "date",
  "category",
  "open_text",
  "id",
  "ignore",
  "unknown",
]);

interface Envelope {
  savedAt: number;
  value: unknown;
}

const uploadKey = (projectId: string) => `upload:${projectId}`;
const columnTypesKey = (projectId: string) => `columns:${projectId}`;

function isEnvelope(v: unknown): v is Envelope {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Envelope).savedAt === "number" &&
    "value" in v
  );
}

function isExpired(savedAt: number, now: number): boolean {
  return now - savedAt > LOCAL_RETENTION_MS || savedAt > now + 60_000;
}

/** Reads an entry, deleting it if it is expired or malformed. */
async function readFresh(store: LocalStore, key: string, now: number): Promise<unknown> {
  const record = await store.get(key);
  if (record === undefined) return null;
  if (!isEnvelope(record) || isExpired(record.savedAt, now)) {
    await store.delete(key);
    return null;
  }
  return record.value;
}

function isParseResult(v: unknown): v is ParseResult {
  if (typeof v !== "object" || v === null) return false;
  const dataset = (v as ParseResult).dataset;
  return (
    typeof dataset === "object" &&
    dataset !== null &&
    Array.isArray(dataset.headers) &&
    Array.isArray(dataset.rows) &&
    typeof dataset.rowCount === "number"
  );
}

/**
 * Stores a parsed upload. Any saved column types for the project are
 * discarded, since they described the previous file.
 */
export async function saveUpload(
  store: LocalStore,
  projectId: string,
  result: ParseResult,
  now = Date.now(),
): Promise<void> {
  await store.set(uploadKey(projectId), { savedAt: now, value: result });
  await store.delete(columnTypesKey(projectId));
}

export async function loadUpload(
  store: LocalStore,
  projectId: string,
  now = Date.now(),
): Promise<ParseResult | null> {
  const value = await readFresh(store, uploadKey(projectId), now);
  return isParseResult(value) ? value : null;
}

export async function saveColumnTypes(
  store: LocalStore,
  projectId: string,
  types: ColumnTypes,
  now = Date.now(),
): Promise<void> {
  await store.set(columnTypesKey(projectId), { savedAt: now, value: types });
}

/** Returns saved column types, dropping any entry that isn't a known type. */
export async function loadColumnTypes(
  store: LocalStore,
  projectId: string,
  now = Date.now(),
): Promise<ColumnTypes | null> {
  const value = await readFresh(store, columnTypesKey(projectId), now);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const types: ColumnTypes = {};
  for (const [name, type] of Object.entries(value)) {
    if (typeof type === "string" && COLUMN_TYPES.has(type)) {
      types[name] = type as ColumnType;
    }
  }
  return types;
}

/**
 * Applies saved column types over inferred mappings. Columns without a saved
 * type keep the inferred one; saved names not present in the file are ignored.
 */
export function applyColumnTypes(
  inferred: ColumnMapping[],
  saved: ColumnTypes | null,
): ColumnMapping[] {
  if (!saved) return inferred;
  return inferred.map((m) =>
    Object.hasOwn(saved, m.name) ? { ...m, type: saved[m.name] } : m,
  );
}

/** Converts mappings to the stored column-type record. */
export function toColumnTypes(mappings: ColumnMapping[]): ColumnTypes {
  return Object.fromEntries(mappings.map((m) => [m.name, m.type]));
}

/** Deletes expired or malformed entries. Returns how many were removed. */
export async function purgeExpired(store: LocalStore, now = Date.now()): Promise<number> {
  let removed = 0;
  for (const key of await store.keys()) {
    const record = await store.get(key);
    if (!isEnvelope(record) || isExpired(record.savedAt, now)) {
      await store.delete(key);
      removed++;
    }
  }
  return removed;
}

/** Removes all locally stored survey data (used on sign out). */
export async function clearAllLocalData(store: LocalStore): Promise<void> {
  await store.clear();
}
