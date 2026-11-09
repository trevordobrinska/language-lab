import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { reviewed } from "../core/testing";
import { indexedDbHistoryLog } from "./indexedDbHistoryLog";

const at = new Date("2026-11-09T08:00:00Z");

let run = 0;
/** A History Log in a brand-new, empty IndexedDB. */
const freshLog = () => {
  globalThis.indexedDB = new IDBFactory();
  return indexedDbHistoryLog();
};

describe("the IndexedDB History Log", () => {
  it("keeps the events it's given, oldest first", async () => {
    const log = freshLog();
    const later = reviewed(`letter:b-${++run}`, "good", new Date(at.getTime() + 1000));
    const earlier = reviewed(`letter:a-${run}`, "again", at);
    await log.add(later);
    await log.add(earlier);

    expect(await log.all()).toEqual([earlier, later]);
  });

  it("ignores an event it already has, without failing (every sync re-adds what it pulls)", async () => {
    const log = freshLog();
    const event = reviewed(`letter:a-${++run}`, "good", at);
    await log.add(event);

    await expect(log.add(event)).resolves.toBeUndefined();
    expect(await log.all()).toEqual([event]);
  });

  it("still adds new events after ignoring a duplicate", async () => {
    const log = freshLog();
    const first = reviewed(`letter:a-${++run}`, "good", at);
    const second = reviewed(`letter:b-${run}`, "good", new Date(at.getTime() + 1000));
    await log.add(first);
    await log.add(first).catch(() => undefined);
    await log.add(second);

    expect(await log.all()).toEqual([first, second]);
  });
});
