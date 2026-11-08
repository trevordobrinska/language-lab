import { describe, expect, it } from "vitest";
import { buildQueue, gradeCard } from "./review";
import { later, letter, packOf } from "./testing";
const START = new Date("2026-11-07T08:00:00Z");

const giyeok = letter("ko-g", "ㄱ", "g / k (giyeok)", { romanisation: "g" });
const nieun = letter("ko-n", "ㄴ", "n (nieun)", { romanisation: "n" });
const a = letter("ko-a", "ㅏ", "a (as in 'father')", { romanisation: "a" });
const pack = packOf([giyeok, nieun, a]);

describe("today's queue", () => {
  it("on the first day, shows every letter card in the authored order", () => {
    const queue = buildQueue({ pack, events: [], now: START });

    expect(queue.map((card) => card.front.text)).toEqual(["ㄱ", "ㄴ", "ㅏ"]);
  });
});

describe("grading a card", () => {
  it("returns a History Log event recording the grade", () => {
    const [card] = buildQueue({ pack, events: [], now: START });

    const event = gradeCard(card, "good", { now: START, deviceId: "pc", eventId: "e1" });

    expect(event).toEqual({
      id: "e1",
      deviceId: "pc",
      at: "2026-11-07T08:00:00.000Z",
      type: "card-reviewed",
      cardId: card.id,
      grade: "good",
    });
  });

  it("a card graded Good leaves today's queue", () => {
    const [first] = buildQueue({ pack, events: [], now: START });
    const events = [gradeCard(first, "good", { now: START, deviceId: "pc", eventId: "e1" })];

    const queue = buildQueue({ pack, events, now: later(START, 0, 1) });

    expect(queue.map((card) => card.front.text)).toEqual(["ㄴ", "ㅏ"]);
  });

  it("a card graded Again stays in today's queue", () => {
    const [first] = buildQueue({ pack, events: [], now: START });
    const events = [gradeCard(first, "again", { now: START, deviceId: "pc", eventId: "e1" })];

    const queue = buildQueue({ pack, events, now: later(START, 0, 1) });

    expect(queue.map((card) => card.front.text)).toContain("ㄱ");
  });

  it("a card graded Good comes back on a later day", () => {
    const [first] = buildQueue({ pack, events: [], now: START });
    const events = [gradeCard(first, "good", { now: START, deviceId: "pc", eventId: "e1" })];

    const queue = buildQueue({ pack, events, now: later(START, 10) });

    expect(queue.map((card) => card.front.text)).toContain("ㄱ");
  });
});
