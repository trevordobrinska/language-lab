import { describe, expect, it } from "vitest";
import { describeSyncError } from "./syncError";

describe("describeSyncError", () => {
  it("explains GitHub's status codes in a fixable way", () => {
    expect(describeSyncError(new Error("GitHub GET history: 401"))).toMatch(/rejected the token \(401\)/);
    expect(describeSyncError(new Error("GitHub PUT history/a/2026-11.jsonl: 403"))).toMatch(/Contents: Read and write/);
    expect(describeSyncError(new Error("GitHub PUT history/a/2026-11.jsonl: 404 (check the repo name and token access)"))).toMatch(
      /can't find the data repo \(404\)/,
    );
    expect(describeSyncError(new Error("GitHub PUT history/a/2026-11.jsonl: 409"))).toMatch(/another device/);
    expect(describeSyncError(new Error("GitHub GET history: 500"))).toBe("GitHub returned an error (500). It will retry.");
  });

  it("calls a failed fetch a connection problem", () => {
    expect(describeSyncError(new TypeError("Load failed"))).toMatch(/Couldn't reach GitHub/);
  });

  it("passes anything else through", () => {
    expect(describeSyncError(new Error("boom"))).toBe("Sync failed: boom");
    expect(describeSyncError("boom")).toBe("Sync failed: boom");
  });
});
