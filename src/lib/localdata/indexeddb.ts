import type { LocalStore } from "./index";

const DB_NAME = "survey-insight";
const DB_VERSION = 1;
const STORE_NAME = "project-data";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // Another tab upgraded the schema: close so it can proceed; reopen lazily.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error ?? new Error("Could not open IndexedDB."));
    req.onblocked = () => reject(new Error("IndexedDB is blocked by another tab."));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

async function run<T>(
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const req = op(tx.objectStore(STORE_NAME));
    // Resolve on transaction completion so writes are durable before callers
    // navigate away.
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error ?? req.error ?? new Error("IndexedDB request failed."));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
  });
}

/** LocalStore backed by the browser's IndexedDB (client-side only). */
export function createIndexedDbStore(): LocalStore {
  return {
    get: (key) => run("readonly", (s) => s.get(key)),
    set: async (key, value) => {
      await run("readwrite", (s) => s.put(value, key));
    },
    delete: async (key) => {
      await run("readwrite", (s) => s.delete(key));
    },
    keys: async () => (await run("readonly", (s) => s.getAllKeys())).map(String),
    clear: async () => {
      await run("readwrite", (s) => s.clear());
    },
  };
}

let browserStore: LocalStore | null = null;

/** Shared IndexedDB-backed store for the app. */
export function getBrowserStore(): LocalStore {
  browserStore ??= createIndexedDbStore();
  return browserStore;
}
