import type { ContentPack, Item, Sentence } from "./contentPack";
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

/** A word Item for test packs. */
export function word(id: string, text: string, meaning: string, extra: Partial<Item> = {}): Item {
  return { id, kind: "word", text, meaning, missions: [], ...extra };
}

/** A Sentence for test packs. `uses` lists every Item it uses; `introduces` defaults to the last one. */
export function sentence(
  id: string,
  text: string,
  meaning: string,
  uses: readonly string[],
  introduces = uses[uses.length - 1],
): Sentence {
  return { id, text, meaning, itemIds: uses, introduces, audio: `audio/${id}.wav` };
}

/** A test pack with Sentences: its letter and sound Items first, then the Sentences, in the order listed. */
export function packWith(items: readonly Item[], sentences: readonly Sentence[], extra: Partial<ContentPack> = {}): ContentPack {
  const letters = items.filter((item) => item.kind === "letter" || item.kind === "sound");
  return {
    ...packOf(items),
    sentences,
    order: [...letters.map((item) => item.id), ...sentences.map((s) => s.id)],
    ...extra,
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
