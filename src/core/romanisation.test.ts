import { describe, expect, it } from "vitest";
import { buildQueue, type Card, type HistoryEvent } from "./index";
import { later, letter, packWith, reviewed, sentence, word } from "./testing";

const START = new Date("2026-11-07T08:00:00Z");

const g = letter("ko-g", "ㄱ", "g / k", { romanisation: "g" });
const n = letter("ko-n", "ㄴ", "n", { romanisation: "n" });
const e = letter("ko-e", "ㅔ", "e", { romanisation: "e" });
const ne = word("w-ne", "네", "yes");
const sNe = { ...sentence("s-ne", "네.", "Yes.", ["ko-n", "ko-e", "w-ne"]), romanisation: "Ne." };
const pack = packWith([g, n, e, ne], [sNe]);

const card = (queue: Card[], id: string) => queue.find((c) => c.id === id);
const firstEvent: HistoryEvent[] = [reviewed("letter:ko-g", "good", START)];

describe("week-1 romanisation", () => {
  it("shows on a brand-new learner's first cards, on the reveal", () => {
    const queue = buildQueue({ pack, events: [], now: START });

    expect(card(queue, "letter:ko-g")?.back.romanisation).toBe("g");
  });

  it("shows on days 1 to 7, counted from the first History Log event", () => {
    for (const day of [0, 1, 3, 6]) {
      const queue = buildQueue({ pack, events: firstEvent, now: later(START, day, 2) });
      expect(card(queue, "letter:ko-n")?.back.romanisation).toBe("n");
    }
  });

  it("is never shown from day 8 on", () => {
    for (const day of [7, 8, 30, 365]) {
      const queue = buildQueue({ pack, events: firstEvent, now: later(START, day) });
      expect(card(queue, "letter:ko-n")).toBeDefined();
      expect(card(queue, "letter:ko-n")?.back.romanisation).toBeUndefined();
    }
  });

  it("counts days by the learner's local calendar day", () => {
    // First event at 23:30 in Seoul (UTC+9). Day 8 starts at Seoul midnight
    // seven days later, though less than 7 x 24 hours have passed.
    const lateNight = new Date("2026-11-07T14:30:00Z");
    const events = [reviewed("letter:ko-g", "good", lateNight)];
    const settings = { utcOffsetMinutes: 540 };

    const lastMinuteOfDay7 = new Date("2026-11-13T14:59:00Z");
    const firstMinuteOfDay8 = new Date("2026-11-13T15:00:00Z");

    expect(card(buildQueue({ pack, events, now: lastMinuteOfDay7, settings }), "letter:ko-n")?.back.romanisation).toBe("n");
    expect(card(buildQueue({ pack, events, now: firstMinuteOfDay8, settings }), "letter:ko-n")?.back.romanisation).toBeUndefined();
  });

  it("shows a Sentence's romanisation on its Listening Card in week 1", () => {
    const lettersMet = [n, e].map((l) => reviewed(`letter:${l.id}`, "good", START));

    const queue = buildQueue({ pack, events: lettersMet, now: later(START, 2) });

    expect(card(queue, "listening:s-ne")?.back.romanisation).toBe("Ne.");
  });
});
