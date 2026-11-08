import { describe, expect, it } from "vitest";
import { buildQueue, cardSchedules, type ContentPack, type Grade, type HistoryEvent } from "./index";
import { later, letter, packOf, reviewed } from "./testing";

const START = new Date("2026-11-07T08:00:00Z");
const giyeok = letter("ko-g", "ㄱ", "g / k (giyeok)");
const pack = packOf([giyeok]);
const CARD = "letter:ko-g";

/**
 * Simulates a learner opening the app at 08:00 every day for `days` days and
 * grading the card whenever it's in the queue. Returns the days it appeared on.
 */
function studyDaily(pack: ContentPack, days: number, gradeOn: (day: number) => Grade): number[] {
  const events: HistoryEvent[] = [];
  const shownOn: number[] = [];
  for (let day = 0; day < days; day++) {
    const now = later(START, day);
    if (buildQueue({ pack, events, now }).some((card) => card.id === CARD)) {
      shownOn.push(day);
      events.push(reviewed(CARD, gradeOn(day), now));
    }
  }
  return shownOn;
}

function gaps(days: number[]): number[] {
  return days.slice(1).map((day, i) => day - days[i]);
}

describe("FSRS scheduling over weeks", () => {
  it("each Good brings the card back after a longer gap than the last", () => {
    const shownOn = studyDaily(pack, 60, () => "good");

    const gapsBetween = gaps(shownOn);
    expect(gapsBetween.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < gapsBetween.length; i++) expect(gapsBetween[i]).toBeGreaterThan(gapsBetween[i - 1]);
  });

  it("an Again brings the card back after a shorter gap than before the lapse", () => {
    let failed = false;
    const shownOn = studyDaily(pack, 90, (day) => {
      if (day < 10 || failed) return "good";
      failed = true;
      return "again";
    });

    const lapse = shownOn.findIndex((day) => day >= 10);
    const gapBefore = shownOn[lapse] - shownOn[lapse - 1];
    const gapAfter = shownOn[lapse + 1] - shownOn[lapse];
    expect(gapAfter).toBeLessThan(gapBefore);
  });
});

describe("mixing reviews with new cards", () => {
  it("interleaves due reviews with new cards instead of showing them in blocks", () => {
    const four = packOf([
      letter("ko-g", "ㄱ", "g"),
      letter("ko-n", "ㄴ", "n"),
      letter("ko-a", "ㅏ", "a"),
      letter("ko-o", "ㅗ", "o"),
    ]);
    const events = [reviewed("letter:ko-g", "good", START), reviewed("letter:ko-n", "good", START)];

    const queue = buildQueue({ pack: four, events, now: later(START, 7) });

    expect(queue.map((card) => card.front.text)).toEqual(["ㄱ", "ㅏ", "ㄴ", "ㅗ"]);
  });
});

describe("a failed card in today's Review", () => {
  const three = packOf([giyeok, letter("ko-n", "ㄴ", "n (nieun)"), letter("ko-a", "ㅏ", "a")]);

  it("comes back later in the same Review, after the cards still waiting", () => {
    const events = [reviewed(CARD, "again", START)];

    const queue = buildQueue({ pack: three, events, now: later(START, 0, 0.001) });

    expect(queue.map((card) => card.front.text)).toEqual(["ㄴ", "ㅏ", "ㄱ"]);
  });

  it("is still in the Review when it's the only card left", () => {
    const events = [reviewed(CARD, "again", START)];

    const queue = buildQueue({ pack, events, now: later(START, 0, 0.001) });

    expect(queue.map((card) => card.id)).toEqual([CARD]);
  });

  it("failed twice, still comes back in the same Review", () => {
    const events = [reviewed(CARD, "again", START), reviewed(CARD, "again", later(START, 0, 0.01))];

    const queue = buildQueue({ pack, events, now: later(START, 0, 0.02) });

    expect(queue.map((card) => card.id)).toEqual([CARD]);
  });
});

describe("each card's schedule", () => {
  it("gives when a reviewed card is due and how likely it is to be recalled, falling over time", () => {
    const events = [reviewed(CARD, "good", START)];

    const soon = cardSchedules({ events, now: later(START, 1) }).get(CARD)!;
    const muchLater = cardSchedules({ events, now: later(START, 30) }).get(CARD)!;

    expect(soon.due.getTime()).toBeGreaterThan(START.getTime());
    expect(soon.due).toEqual(muchLater.due);
    expect(soon.recall).toBeGreaterThan(0.9);
    expect(muchLater.recall).toBeLessThan(soon.recall);
  });

  it("leaves out cards that were never reviewed", () => {
    expect(cardSchedules({ events: [], now: START }).has(CARD)).toBe(false);
  });

  it("is the same whatever order the History Log events arrive in", () => {
    const events = [
      reviewed(CARD, "good", START),
      reviewed(CARD, "again", later(START, 2)),
      reviewed(CARD, "good", later(START, 3)),
    ];
    const now = later(START, 5);

    expect(cardSchedules({ events: [...events].reverse(), now })).toEqual(cardSchedules({ events, now }));
  });
});
