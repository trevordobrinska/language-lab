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

  it("once all the Hangul is met, brings in its sample Sentences as Listening Cards, market Sentences first", () => {
    const start = new Date("2026-11-07T08:00:00Z");
    const allHangul = korean.order
      .filter((id) => !id.startsWith("sentence-"))
      .map((id, i) => ({ id: `e${i}`, deviceId: "pc", at: start.toISOString(), type: "card-reviewed" as const, cardId: `letter:${id}`, grade: "good" as const }));

    const queue = buildQueue({ pack: korean, events: allHangul, now: new Date("2026-11-07T09:00:00Z"), settings: { newItemsPerDay: 100 } });

    expect(queue.map((card) => card.id)).toEqual([
      "listening:sentence-ne",
      "listening:sentence-annyeonghaseyo",
      "listening:sentence-eolmayeyo",
      "listening:sentence-igeo-eolmayeyo",
      "listening:sentence-gamsahamnida",
      "listening:sentence-masisseoyo",
    ]);
    for (const card of queue) expect(audioUrl(korean, card.front.audio!)).toBeTruthy();
  });
});
