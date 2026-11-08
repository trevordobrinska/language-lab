import { describe, expect, it } from "vitest";
import { later, reviewed } from "../core/testing";
import { memoryHistoryLog } from "../storage/historyLogStore";
import { memoryRemoteLog } from "./memoryRemoteLog";
import { syncHistoryLog } from "./sync";

const START = new Date("2026-11-07T08:00:00Z");

describe("syncing the History Log", () => {
  it("adds every other device's events to the local log", async () => {
    const remote = memoryRemoteLog();
    const pcEvent = reviewed("letter:ko-a", "good", START, "pc");
    await remote.write("history/pc/2026-11.jsonl", [pcEvent]);
    const local = memoryHistoryLog();

    const result = await syncHistoryLog({ local, remote, deviceId: "phone" });

    expect(result.ok).toBe(true);
    expect(await local.all()).toEqual([pcEvent]);
  });

  it("writes only this device's own files, holding only this device's events", async () => {
    const remote = memoryRemoteLog();
    const pcEvent = reviewed("letter:ko-a", "good", START, "pc");
    await remote.write("history/pc/2026-11.jsonl", [pcEvent]);
    remote.writes.length = 0;
    const local = memoryHistoryLog();
    const november = reviewed("letter:ko-g", "good", START, "phone");
    const december = reviewed("letter:ko-g", "good", later(START, 30), "phone");
    await local.add(november);
    await local.add(december);

    await syncHistoryLog({ local, remote, deviceId: "phone" });

    expect(remote.writes.sort()).toEqual(["history/phone/2026-11.jsonl", "history/phone/2026-12.jsonl"]);
    expect(await remote.read("history/phone/2026-11.jsonl")).toEqual([november]);
    expect(await remote.read("history/phone/2026-12.jsonl")).toEqual([december]);
    expect(await remote.read("history/pc/2026-11.jsonl")).toEqual([pcEvent]);
  });

  it("doesn't rewrite files that are already up to date", async () => {
    const remote = memoryRemoteLog();
    const local = memoryHistoryLog();
    await local.add(reviewed("letter:ko-g", "good", START, "phone"));
    await syncHistoryLog({ local, remote, deviceId: "phone" });
    remote.writes.length = 0;

    await syncHistoryLog({ local, remote, deviceId: "phone" });

    expect(remote.writes).toEqual([]);
  });

  it("another device then sees this device's events", async () => {
    const remote = memoryRemoteLog();
    const phone = memoryHistoryLog();
    const pc = memoryHistoryLog();
    const phoneEvent = reviewed("letter:ko-g", "good", START, "phone");
    const pcEvent = reviewed("letter:ko-a", "again", later(START, 0, 1), "pc");
    await phone.add(phoneEvent);
    await pc.add(pcEvent);

    await syncHistoryLog({ local: phone, remote, deviceId: "phone" });
    await syncHistoryLog({ local: pc, remote, deviceId: "pc" });
    await syncHistoryLog({ local: phone, remote, deviceId: "phone" });

    expect(await phone.all()).toEqual([phoneEvent, pcEvent]);
    expect(await pc.all()).toEqual([phoneEvent, pcEvent]);
  });
});
