import { describe, expect, it } from "vitest";
import { buildQueue, mergeLogs } from "./index";
import { later, letter, packOf, reviewed } from "./testing";

const START = new Date("2026-11-07T08:00:00Z");

describe("merging History Logs", () => {
  const phone = [reviewed("letter:ko-g", "good", START, "phone"), reviewed("letter:ko-n", "again", later(START, 1), "phone")];
  const pc = [reviewed("letter:ko-a", "good", later(START, 0, 2), "pc")];

  it("gives the same log whichever side comes first (A+B equals B+A)", () => {
    expect(mergeLogs(phone, pc)).toEqual(mergeLogs(pc, phone));
  });

  it("changes nothing when repeated", () => {
    const once = mergeLogs(phone, pc);

    expect(mergeLogs(once, pc)).toEqual(once);
    expect(mergeLogs(once, once)).toEqual(once);
  });

  it("keeps one copy of each event, by event ID, oldest first", () => {
    const merged = mergeLogs(phone, [...phone, ...pc], pc);

    expect(merged.map((event) => event.id)).toEqual([phone[0].id, pc[0].id, phone[1].id]);
  });

  it("two devices' logs give the same queue as one combined log", () => {
    const pack = packOf([letter("ko-g", "ㄱ", "g"), letter("ko-n", "ㄴ", "n"), letter("ko-a", "ㅏ", "a")]);
    const now = later(START, 1, 1);

    const fromMerge = buildQueue({ pack, events: mergeLogs(pc, phone), now });

    expect(fromMerge).toEqual(buildQueue({ pack, events: [...phone, ...pc], now }));
    // ㄱ (Good a day ago) and ㄴ (Again just now) are due; ㅏ (Good on the PC 23 hours ago) is not yet.
    expect(fromMerge.map((card) => card.front.text)).toEqual(["ㄱ", "ㄴ"]);
  });
});
