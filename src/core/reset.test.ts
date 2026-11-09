import { describe, expect, it } from "vitest";
import { buildQueue, mergeLogs, progress, startOver, type HistoryEvent } from "./index";
import { later, letter, packOf, reviewed } from "./testing";

const START = new Date("2026-11-07T08:00:00Z");

const pack = packOf(
  ["a", "b", "c", "d"].map((id) => letter(id, id.toUpperCase(), `letter ${id}`, { romanisation: id })),
);

const reset = (at: Date, deviceId = "test-device", eventId = `reset-${at.getTime()}-${deviceId}`) =>
  startOver({ now: at, deviceId, eventId });

/** A few days of study: every letter reviewed, some more than once. */
const studied: HistoryEvent[] = [
  reviewed("letter:a", "good", START),
  reviewed("letter:b", "good", START),
  reviewed("letter:c", "again", START),
  reviewed("letter:c", "good", later(START, 0, 1)),
  reviewed("letter:a", "good", later(START, 2)),
  reviewed("letter:d", "good", later(START, 2)),
];

const ids = (events: readonly HistoryEvent[], now: Date) => buildQueue({ pack, events, now }).map((card) => card.id);

describe("starting over", () => {
  it("makes today's queue the same as a brand-new learner's", () => {
    const now = later(START, 10);
    const events = [...studied, reset(later(START, 9))];

    expect(buildQueue({ pack, events, now })).toEqual(buildQueue({ pack, events: [], now }));
  });

  it("sets progress back to nothing", () => {
    const now = later(START, 10);
    const before = progress({ pack, events: studied, now });
    const after = progress({ pack, events: [...studied, reset(later(START, 9))], now });

    expect(before.items.learned).toBe(4);
    expect(after.items.learned).toBe(0);
    expect(after.cardsDue).toBe(0);
  });

  it("counts what's studied after it", () => {
    const resetAt = later(START, 9);
    const events = [...studied, reset(resetAt), reviewed("letter:b", "good", later(START, 9, 1))];

    expect(progress({ pack, events, now: later(START, 9, 2) }).items.learned).toBe(1);
    expect(ids(events, later(START, 9, 2))).not.toContain("letter:b");
  });

  it("starts every device over once the logs merge, whichever arrives first", () => {
    const phone = studied.map((event) => ({ ...event, deviceId: "phone" }));
    const pc = [reset(later(START, 9), "pc")];
    const now = later(START, 10);

    expect(ids(mergeLogs(phone, pc), now)).toEqual(ids([], now));
    expect(ids(mergeLogs(pc, phone), now)).toEqual(ids([], now));
  });

  it("goes by the latest reset", () => {
    const events = [
      ...studied,
      reset(later(START, 3)),
      reviewed("letter:a", "good", later(START, 4)),
      reset(later(START, 5)),
    ];

    expect(progress({ pack, events, now: later(START, 6) }).items.learned).toBe(0);
  });

  it("restarts the romanisation week from the first review after it", () => {
    const resetAt = later(START, 20);
    const events = [...studied, reset(resetAt), reviewed("letter:a", "good", later(START, 21))];
    const queue = buildQueue({ pack, events, now: later(START, 23) });

    expect(queue.find((card) => card.id === "letter:b")?.back.romanisation).toBe("b");
  });

  it("is a History Log event of its own; nothing else is changed or removed", () => {
    const event = reset(START, "pc", "event-id");

    expect(event).toEqual({ id: "event-id", deviceId: "pc", at: START.toISOString(), type: "reset" });
  });
});
