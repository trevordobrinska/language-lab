import { describe, expect, it } from "vitest";
import { appCacheName, buildVersion, precacheUrls, staleCaches } from "./cachePlan";

describe("cache naming", () => {
  it("names the app cache under the language-lab prefix, per build version", () => {
    expect(appCacheName("abc123")).toBe("language-lab-app-abc123");
  });
});

describe("precache list", () => {
  it("lists the start URL then every built file relative to the app, whatever the audio format", () => {
    const built = [
      "index.html",
      "assets/index-a1b2.js",
      "assets/hangul-a-9f8e.wav",
      "assets/sentence-001-77aa.mp3",
      "manifest.webmanifest",
      "icons/icon-192.png",
    ];
    expect(precacheUrls(built)).toEqual([
      "./",
      "./assets/hangul-a-9f8e.wav",
      "./assets/index-a1b2.js",
      "./assets/sentence-001-77aa.mp3",
      "./icons/icon-192.png",
      "./index.html",
      "./manifest.webmanifest",
    ]);
  });

  it("leaves out the service worker itself and source maps", () => {
    expect(precacheUrls(["index.html", "sw.js", "assets/index-a1b2.js.map"])).toEqual(["./", "./index.html"]);
  });

  it("accepts Windows path separators from the build", () => {
    expect(precacheUrls(["assets\\index-a1b2.js"])).toEqual(["./", "./assets/index-a1b2.js"]);
  });
});

describe("build version", () => {
  const file = (path: string, text: string) => ({ path, bytes: new TextEncoder().encode(text) });
  const build = [file("index.html", "<html>v1</html>"), file("icons/icon-192.png", "png")];

  it("is the same for the same files, in any order", () => {
    expect(buildVersion(build)).toBe(buildVersion([...build].reverse()));
  });

  it("changes when any file's contents change, so a new build gets a fresh cache", () => {
    const edited = [file("index.html", "<html>v2</html>"), file("icons/icon-192.png", "png")];
    expect(buildVersion(edited)).not.toBe(buildVersion(build));
  });

  it("changes when a file is added or renamed", () => {
    expect(buildVersion([...build, file("assets/new.mp3", "x")])).not.toBe(buildVersion(build));
    expect(buildVersion([file("index2.html", "<html>v1</html>"), build[1]])).not.toBe(buildVersion(build));
  });

  it("is short and safe inside a cache name", () => {
    expect(buildVersion(build)).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("old-cache cleanup", () => {
  it("deletes only older Language Lab caches, never the current one or an Arcade game's", () => {
    const existing = [
      "language-lab-app-old1",
      "language-lab-app-new2",
      "doodle-monsters-v3",
      "secret-script-studio",
      "language-lab-app-old0",
    ];
    expect(staleCaches(existing, "language-lab-app-new2")).toEqual(["language-lab-app-old1", "language-lab-app-old0"]);
  });
});
