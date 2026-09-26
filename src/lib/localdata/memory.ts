import type { LocalStore } from "./index";

/**
 * In-memory LocalStore. Values are structured-cloned on write and read, like
 * IndexedDB, so callers can't mutate stored data by reference.
 */
export function createMemoryStore(): LocalStore {
  const data = new Map<string, unknown>();
  return {
    async get(key) {
      return data.has(key) ? structuredClone(data.get(key)) : undefined;
    },
    async set(key, value) {
      data.set(key, structuredClone(value));
    },
    async delete(key) {
      data.delete(key);
    },
    async keys() {
      return [...data.keys()];
    },
    async clear() {
      data.clear();
    },
  };
}
