import type { HistoryEvent } from "../core";
import { byTime, STORAGE_PREFIX, type HistoryLogStore } from "./historyLogStore";

const DB_NAME = `${STORAGE_PREFIX}-history-log`;
const DB_VERSION = 1;
const EVENTS = "events";

/**
 * The History Log in this browser's IndexedDB: one record per event, keyed by
 * event ID. Each grade is written the moment it's made, so closing the app
 * mid-Review loses nothing. Not unit-tested; `memoryHistoryLog` stands in for
 * it in tests.
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
      request.onerror = (e) => {
        if (request.error?.name === "ConstraintError") e.preventDefault();
      };
      await done(tx).catch((error) => {
        if (error?.name !== "ConstraintError") throw error;
      });
    },
    async all() {
      const tx = (await db()).transaction(EVENTS, "readonly");
      const request = tx.objectStore(EVENTS).getAll();
      await done(tx);
      return (request.result as HistoryEvent[]).sort(byTime);
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

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
