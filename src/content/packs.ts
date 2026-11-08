import type { ContentPack } from "../core";
import koreanPack from "../../content/ko/pack.json";

/** The Korean content pack (`content/ko/pack.json`). Korean is the Active Language. */
export const korean = koreanPack as ContentPack;

/**
 * Every audio file under `content/`, bundled by Vite so the build (and later
 * the service worker) carries them. Keyed by path from the repo root.
 */
const audioFiles = import.meta.glob<string>("/content/*/audio/*", { eager: true, query: "?url", import: "default" });

/** The URL to play a pack's audio file, given its path relative to the pack's folder; undefined if the file is missing. */
export function audioUrl(pack: ContentPack, path: string): string | undefined {
  return audioFiles[`/content/${pack.language}/${path}`];
}
