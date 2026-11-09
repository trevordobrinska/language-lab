import { describe, expect, it } from "vitest";
import { githubRemoteLog } from "./githubRemoteLog";

/**
 * The request headers GitHub's CORS preflight allows (api.github.com,
 * Access-Control-Allow-Headers, checked 2026-11-09). A browser fails any
 * request that sends another header before it reaches GitHub.
 */
const CORS_ALLOWED = ["accept", "authorization", "content-type", "x-github-api-version"];

describe("githubRemoteLog", () => {
  it("sends only headers GitHub's CORS preflight allows, and no cache mode Safari would turn into headers", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (init.method === "PUT") return Response.json({ content: { sha: "new" } });
      if (url.includes("/contents/history/dev?")) return Response.json([]);
      if (url.includes("/contents/history?")) return Response.json([{ type: "dir", name: "dev", path: "history/dev", sha: "d" }]);
      return new Response("", { status: 404 });
    }) as typeof fetch;

    const remote = githubRemoteLog({ token: "t", owner: "me", repo: "data" }, fetchFn);
    await remote.list();
    await remote.write("history/dev/2026-11.jsonl", []);

    expect(calls.length).toBeGreaterThan(0);
    for (const { init } of calls) {
      expect(init.cache).toBeUndefined();
      expect("accept" in init).toBe(false);
      for (const header of Object.keys(init.headers as Record<string, string>)) {
        expect(CORS_ALLOWED).toContain(header.toLowerCase());
      }
    }
  });

  it("makes each GET URL unique so the browser cache can't serve a stale file list", async () => {
    const urls: string[] = [];
    const fetchFn = (async (url: string) => {
      urls.push(url);
      return Response.json([{ type: "file", name: "README.md", path: "README.md", sha: "r" }]);
    }) as typeof fetch;

    await githubRemoteLog({ token: "t", owner: "me", repo: "data" }, fetchFn).list();

    expect(urls[0]).toMatch(/^https:\/\/api\.github\.com\/repos\/me\/data\/contents\/history\?t=\d+$/);
  });
});
