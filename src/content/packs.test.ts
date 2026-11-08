import { describe, expect, it } from "vitest";
import { buildQueue } from "../core";
import { audioUrl, korean } from "./packs";

describe("the Korean content pack", () => {
  it("gives a first Review of Hangul letter cards, each with a sound and an answer", () => {
    const queue = buildQueue({ pack: korean, events: [], now: new Date("2026-11-07T08:00:00Z") });

    expect(queue.length).toBeGreaterThanOrEqual(3);
    for (const card of queue) {
      expect(card.kind).toBe("letter");
      expect(card.front.text).toMatch(/^\p{Script=Hangul}+$/u);
      expect(audioUrl(korean, card.front.audio!)).toBeTruthy();
      expect(card.back.text).not.toBe("");
    }
  });
});
