import type { ContentPack, Item } from "./contentPack";
import type { Grade, HistoryEvent } from "./historyLog";

/** A letter Item for test packs. */
export function letter(id: string, text: string, meaning: string, extra: Partial<Item> = {}): Item {
  return { id, kind: "letter", text, meaning, audio: `audio/${id}.wav`, missions: [], ...extra };
}

/** A small test pack: the given Items, introduced in the order listed. */
export function packOf(items: readonly Item[]): ContentPack {
  return {
    language: "xx",
    name: "Test",
    items,
    sentences: [],
    grammarNotes: [],
    order: items.map((item) => item.id),
  };
}

let nextEventNumber = 0;

/** A card-reviewed History Log event at the given time. */
export function reviewed(cardId: string, grade: Grade, at: Date, deviceId = "test-device"): HistoryEvent {
  return { id: `event-${++nextEventNumber}`, deviceId, at: at.toISOString(), type: "card-reviewed", cardId, grade };
}

/** `days` days (and optionally `hours`) after `start`. */
export function later(start: Date, days: number, hours = 0): Date {
  return new Date(start.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
}
