import { byTimeThenId, type HistoryEvent } from "../core";
import type { HistoryLogStore } from "./historyLogStore";
import { STORAGE_PREFIX } from "./storagePrefix";

const DB_NAME = `${STORAGE_PREFIX}-history-log`;
const DB_VERSION = 1;
const EVENTS = "events";

/**
 * The History Log in this browser's IndexedDB: one record per event, keyed by
 * event ID. Each grade is written the moment it's made, so closing the app
 * mid-Review loses nothing. Tested against fake-indexeddb in
 * `indexedDbHistoryLog.test.ts`; `memoryHistoryLog` stands in for it elsewhere.
 */
export function indexedDbHistoryLog(): HistoryLogStore {
  let opening: Promise<IDBDatabase> | undefined;
  // If opening fails, try again next time rather than failing every call from now on.
  const db = () =>
    (opening ??= open().catch((error) => {
      opening = undefined;
      throw error;
    }));

  return {
    async add(event) {
      const tx = (await db()).transaction(EVENTS, "readwrite");
      // `add` (not `put`) so a stored event is never overwritten; a duplicate ID is ignored.
      const request = tx.objectStore(EVENTS).add(event);
      // Preventing the default keeps a duplicate from aborting the transaction, so it completes.
      request.onerror = (e) => {
        if (request.error?.name === "ConstraintError") e.preventDefault();
      };
      await done(tx);
    },
    async all() {
      const tx = (await db()).transaction(EVENTS, "readonly");
      const request = tx.objectStore(EVENTS).getAll();
      await done(tx);
      return (request.result as HistoryEvent[]).sort(byTimeThenId);
    },
  };
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(EVENTS)) request.result.createObjectStore(EVENTS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Settles when the transaction does. A failed request's error event bubbles
 * to the transaction before it decides whether to abort, and `tx.error` is
 * still null then, so only `abort` counts as failure: a handled error (a
 * duplicate event, see `add`) lets the transaction complete.
 */
function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}
