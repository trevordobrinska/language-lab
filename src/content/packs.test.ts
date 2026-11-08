import { describe, expect, it } from "vitest";
import { buildQueue } from "../core";
import { audioUrl, korean } from "./packs";

describe("the Korean content pack", () => {
  it("gives a first Review of Hangul letter cards, each with a sound and an answer", () => {
    const queue = buildQueue({ pack: korean, events: [], now: new Date("2026-11-07T08:00:00Z") });

    expect(queue.length).toBeGreaterThanOrEqual(3);
    for (const card of queue) {
      expect(card.kind).toBe("letter");
      // Hangul only (sound-contrast cards list syllables separated by " · ").
      expect(card.front.text).toMatch(/^\p{Script=Hangul}+( · \p{Script=Hangul}+)*$/u);
      expect(audioUrl(korean, card.front.audio!)).toBeTruthy();
      expect(card.back.text).not.toBe("");
    }
  });

  it("once all the Hangul is met, brings in its Sentences as Listening Cards in the authored order, market Sentences first", () => {
    const start = new Date("2026-11-07T08:00:00Z");
    const allHangul = korean.order
      .filter((id) => !id.startsWith("sentence-"))
      .map((id, i) => ({ id: `e${i}`, deviceId: "pc", at: start.toISOString(), type: "card-reviewed" as const, cardId: `letter:${id}`, grade: "good" as const }));

    const queue = buildQueue({ pack: korean, events: allHangul, now: new Date("2026-11-07T09:00:00Z"), settings: { newItemsPerDay: 1000 } });
    const ids = queue.map((card) => card.id);

    expect(ids.slice(0, 8)).toEqual([
      "listening:sentence-ne",
      "listening:sentence-annyeonghaseyo",
      "listening:sentence-eolmayeyo",
      "listening:sentence-igeo-eolmayeyo",
      "listening:sentence-igeo-juseyo",
      "listening:sentence-gamsahamnida",
      "listening:sentence-eoseo-oseyo",
      "listening:sentence-annyeonghaseyo-eoseo-oseyo",
    ]);
    // Every Sentence is introduced, and 맛있어요 (restaurant only) waits until the market Sentences are in.
    expect(ids).toHaveLength(korean.sentences.length);
    expect(ids.at(-1)).toBe("listening:sentence-masisseoyo");
    for (const card of queue) expect(audioUrl(korean, card.front.audio!)).toBeTruthy();
  });

  it("gives every grammar pattern a Grammar Note, and every Sentence English and romanisation", () => {
    const noted = new Set(korean.grammarNotes.map((note) => note.itemId));
    const grammarWithoutNote = korean.items.filter((item) => item.kind === "grammar" && !noted.has(item.id)).map((item) => item.id);
    expect(grammarWithoutNote).toEqual([]);
    for (const sentence of korean.sentences) {
      expect(sentence.meaning, sentence.id).not.toBe("");
      expect(sentence.romanisation, sentence.id).toMatch(/^[A-Z]/);
    }
  });

  it("shows romanisation in week 1, and the 주세요 Grammar Note before its first Sentence, reopenable later", () => {
    const start = new Date("2026-11-07T08:00:00Z");
    const allHangul = korean.order
      .filter((id) => !id.startsWith("sentence-"))
      .map((id, i) => ({ id: `e${i}`, deviceId: "pc", at: start.toISOString(), type: "card-reviewed" as const, cardId: `letter:${id}`, grade: "good" as const }));
    const settings = { newItemsPerDay: 100 };

    const firstQueue = buildQueue({ pack: korean, events: allHangul, now: new Date("2026-11-07T09:00:00Z"), settings });
    const juseyo = firstQueue.find((card) => card.id === "listening:sentence-igeo-juseyo");
    expect(juseyo?.back.romanisation).toBe("Igeo juseyo.");
    expect(juseyo?.noteBeforeCard?.pattern).toBe("주세요");
    expect(juseyo?.noteBeforeCard?.text).not.toBe("");
    const notesShown = firstQueue.flatMap((card) => (card.noteBeforeCard ? [card.noteBeforeCard.pattern] : []));
    expect(notesShown.filter((pattern) => pattern === "주세요")).toHaveLength(1);
    expect(new Set(notesShown).size).toBe(notesShown.length);

    const heard = [
      ...allHangul,
      { id: "j1", deviceId: "pc", at: "2026-11-07T09:05:00Z", type: "card-reviewed" as const, cardId: "listening:sentence-igeo-juseyo", grade: "good" as const },
    ];
    const weekTwo = buildQueue({ pack: korean, events: heard, now: new Date("2026-11-20T09:00:00Z"), settings });
    const again = weekTwo.find((card) => card.id === "listening:sentence-igeo-juseyo");
    expect(again?.noteBeforeCard).toBeUndefined();
    expect(again?.grammarNotes?.map((note) => note.pattern)).toEqual(["주세요"]);
    expect(again?.back.romanisation).toBeUndefined();
  });
});
