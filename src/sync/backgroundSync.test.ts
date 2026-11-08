import { describe, expect, it } from "vitest";
import { reviewed } from "../core/testing";
import { memoryHistoryLog } from "../storage/historyLogStore";
import { backgroundSync } from "./backgroundSync";
import { memoryRemoteLog } from "./memoryRemoteLog";
import { syncHistoryLog } from "./sync";

const START = new Date("2026-11-07T08:00:00Z");

/** A clock and timer the test moves by hand. */
function fakeTimers() {
  let pending: { run: () => void; ms: number } | undefined;
  return {
    setTimer(run: () => void, ms: number) {
      pending = { run, ms };
    },
    get pendingMs() {
      return pending?.ms;
    },
    fire() {
      const due = pending;
      pending = undefined;
      due?.run();
    },
  };
}

function setUp() {
  const remote = memoryRemoteLog();
  const local = memoryHistoryLog();
  const timers = fakeTimers();
  const synced: Date[] = [];
  const syncer = backgroundSync({
    sync: () => syncHistoryLog({ local, remote, deviceId: "phone" }),
    now: () => START,
    setTimer: timers.setTimer,
    retryAfterMs: 60_000,
    onSynced: (at) => synced.push(at),
  });
  return { remote, local, timers, synced, syncer };
}

describe("background sync", () => {
  it("records the time of a successful sync", async () => {
    const { syncer, synced } = setUp();

    await syncer.syncNow();

    expect(synced).toEqual([START]);
  });

  it("a failed request keeps the local log and retries later", async () => {
    const { remote, local, timers, synced, syncer } = setUp();
    const event = reviewed("letter:ko-g", "good", START, "phone");
    await local.add(event);
    remote.failNext();

    await syncer.syncNow();

    expect(await local.all()).toEqual([event]);
    expect(synced).toEqual([]);
    expect(timers.pendingMs).toBe(60_000);

    timers.fire();
    await syncer.idle();

    expect(synced).toEqual([START]);
    expect(await remote.read("history/phone/2026-11.jsonl")).toEqual([event]);
    expect(timers.pendingMs).toBeUndefined();
  });

  it("never rejects, so Review is never held up by sync", async () => {
    const { remote, syncer } = setUp();
    remote.failNext(5);

    await expect(syncer.syncNow()).resolves.toBeUndefined();
  });
});
