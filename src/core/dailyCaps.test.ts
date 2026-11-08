import { describe, expect, it } from "vitest";
import { buildQueue, cardSchedules, type Card, type ContentPack, type HistoryEvent } from "./index";
import { later, letter, packOf, reviewed } from "./testing";

const START = new Date("2026-11-07T08:00:00Z");

/** A pack of `count` letters, ids "l0", "l1", ... */
function bigPack(count: number): ContentPack {
  return packOf(Array.from({ length: count }, (_, i) => letter(`l${i}`, `L${i}`, `meaning ${i}`)));
}

const isNew = (events: readonly HistoryEvent[]) => (card: Card) => !events.some((event) => event.cardId === card.id);

describe("the daily new-Item cap", () => {
  it("never introduces more than the cap in a day, however much the learner studies", () => {
    const pack = bigPack(40);
    const events: HistoryEvent[] = [];
    let now = START;
    // Keep studying all day: grade every card shown, a minute apart, until the queue empties.
    for (let step = 0; step < 500; step++) {
      const queue = buildQueue({ pack, events, now, settings: { newItemsPerDay: 5 } });
      if (queue.length === 0) break;
      events.push(reviewed(queue[0].id, "good", now));
      now = new Date(now.getTime() + 60_000);
    }

    expect(new Set(events.map((event) => event.cardId)).size).toBe(5);
  });

  it("introduces new Items again the next day", () => {
    const pack = bigPack(40);
    const events = Array.from({ length: 5 }, (_, i) => reviewed(`letter:l${i}`, "good", START));

    const nextDay = buildQueue({ pack, events, now: later(START, 1), settings: { newItemsPerDay: 5 } });

    expect(nextDay.filter(isNew(events))).toHaveLength(5);
  });

  it("starts a new day at the learner's local midnight, not UTC midnight", () => {
    const pack = bigPack(40);
    // 08:00 UTC is 17:00 in Seoul (UTC+9).
    const events = Array.from({ length: 5 }, (_, i) => reviewed(`letter:l${i}`, "good", START));
    const seoul = { newItemsPerDay: 5, utcOffsetMinutes: 9 * 60 };

    const lateEvening = buildQueue({ pack, events, now: later(START, 0, 6), settings: seoul }); // 23:00 Seoul
    const afterMidnight = buildQueue({ pack, events, now: later(START, 0, 8), settings: seoul }); // 01:00 Seoul
    const afterMidnightUtc = buildQueue({ pack, events, now: later(START, 0, 8), settings: { newItemsPerDay: 5 } });

    expect(lateEvening.filter(isNew(events))).toHaveLength(0);
    expect(afterMidnight.filter(isNew(events))).toHaveLength(5);
    expect(afterMidnightUtc.filter(isNew(events))).toHaveLength(0);
  });

  it("defaults to 15 new Items a day", () => {
    const queue = buildQueue({ pack: bigPack(40), events: [], now: START });

    expect(queue).toHaveLength(15);
  });
});

describe("the daily review cap", () => {
  const pack = bigPack(30);
  const learned = Array.from({ length: 30 }, (_, i) => reviewed(`letter:l${i}`, "good", START));
  const caps = { reviewsPerDay: 10, newItemsPerDay: 0 };

  /** Grades every card in the queue Good, a minute apart, until it's empty. Returns the cards shown. */
  function studyAll(events: HistoryEvent[], from: Date): string[] {
    const shown: string[] = [];
    let now = from;
    for (let step = 0; step < 200; step++) {
      const queue = buildQueue({ pack, events, now, settings: caps });
      if (queue.length === 0) break;
      shown.push(queue[0].id);
      events.push(reviewed(queue[0].id, "good", now));
      now = new Date(now.getTime() + 60_000);
    }
    return shown;
  }

  it("after a week away, holds today's queue to the cap and rolls the rest over to following days", () => {
    const events = [...learned];
    const backOn = later(START, 9); // All 30 cards fell due about a week ago.

    const first = studyAll(events, backOn);
    const second = studyAll(events, later(backOn, 1));
    const third = studyAll(events, later(backOn, 2));

    expect(first).toHaveLength(10);
    expect(second).toHaveLength(10);
    expect(third).toHaveLength(10);
    expect(new Set([...first, ...second, ...third]).size).toBe(30);
  });

  it("keeps a card failed today in the Review even once the cap is reached", () => {
    const events = [...learned];
    const backOn = later(START, 9);
    events.push(reviewed("letter:l0", "again", backOn));
    const capOne = { reviewsPerDay: 1, newItemsPerDay: 0 };

    const afterStep = buildQueue({ pack, events, now: later(backOn, 0, 0.5), settings: capOne });

    expect(afterStep.map((card) => card.id)).toEqual(["letter:l0"]);
  });

  it("doesn't pull in a card from an earlier day just because it falls due in a few minutes", () => {
    const events = [reviewed("letter:l0", "good", START)];
    const due = cardSchedules({ events, now: START }).get("letter:l0")!.due;
    const fewMinutesBefore = new Date(due.getTime() - 5 * 60_000);

    const queue = buildQueue({ pack, events, now: fewMinutesBefore, settings: { reviewsPerDay: 0, newItemsPerDay: 0 } });

    expect(queue).toEqual([]);
  });

  it("defaults to 150 reviews a day", () => {
    const many = bigPack(200);
    const events = Array.from({ length: 200 }, (_, i) => reviewed(`letter:l${i}`, "good", START));

    const queue = buildQueue({ pack: many, events, now: later(START, 30) });

    expect(queue).toHaveLength(150);
  });
});

describe("overdue cards, most at risk first", () => {
  // "old" has been learned well and fell due first, but is still well remembered;
  // "young" fell due later and is closer to being forgotten.
  const pack = packOf([letter("old", "O", "old"), letter("young", "Y", "young")]);
  const events = [
    reviewed("letter:old", "good", START),
    reviewed("letter:old", "good", later(START, 2)),
    reviewed("letter:old", "good", later(START, 8)),
    reviewed("letter:young", "good", later(START, 47)),
  ];
  const now = later(START, 51);

  it("come out lowest recall probability first, not in the order they fell due", () => {
    const queue = buildQueue({ pack, events, now });

    expect(queue.map((card) => card.id)).toEqual(["letter:young", "letter:old"]);
  });

  it("with a tight review cap, the most at-risk card is the one kept today", () => {
    const queue = buildQueue({ pack, events, now, settings: { reviewsPerDay: 1 } });

    expect(queue.map((card) => card.id)).toEqual(["letter:young"]);
  });
});
