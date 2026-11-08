import type { HistoryEvent } from "../core";

/**
 * Where this device keeps its History Log. Add-only: events are never edited
 * or deleted. Adding an event whose ID is already stored changes nothing, so
 * re-adding merged events is harmless.
 */
export interface HistoryLogStore {
  add(event: HistoryEvent): Promise<void>;
  /** Every stored event, oldest first. */
  all(): Promise<HistoryEvent[]>;
}

/** Every storage name the app creates starts with this (the domain is shared with the Arcade games). */
export const STORAGE_PREFIX = "language-lab";

/** A History Log kept in memory, for tests and as a stand-in. */
export function memoryHistoryLog(): HistoryLogStore {
  const events = new Map<string, HistoryEvent>();
  return {
    async add(event) {
      if (!events.has(event.id)) events.set(event.id, event);
    },
    async all() {
      return [...events.values()].sort(byTime);
    },
  };
}

export const byTime = (a: HistoryEvent, b: HistoryEvent) => a.at.localeCompare(b.at);
