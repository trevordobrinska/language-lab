import { STORAGE_PREFIX } from "../storage/storagePrefix";

/**
 * Pure rules for the service worker's caches. Shared by the service worker
 * (at run time) and the Vite build plugin (which writes the precache list).
 */

/** The cache holding one build of the app. A new build gets a new name, so old and new never mix. */
export function appCacheName(version: string): string {
  return `${STORAGE_PREFIX}-app-${version}`;
}

/** The service worker's own file name, at the app root so its scope covers the whole app. */
export const SERVICE_WORKER_FILE = "sw.js";

/**
 * URLs to cache on install, given every file in the build output (paths
 * relative to the output folder). URLs stay relative to the service worker, so
 * the app works from any sub-path. Every file is cached, so the content pack
 * and all audio (any format) come along without being listed by type.
 */
export function precacheUrls(builtFiles: readonly string[]): string[] {
  const files = builtFiles
    .map((path) => path.replaceAll("\\", "/"))
    .filter((path) => path !== SERVICE_WORKER_FILE && !path.endsWith(".map"))
    .sort();
  return ["./", ...files.map((path) => `./${path}`)];
}

/**
 * A short fingerprint of a whole build (8 hex chars, FNV-1a over every path
 * and its bytes). It goes into the service worker, so any change to any file
 * makes the browser see a new worker and install the new build.
 */
export function buildVersion(files: readonly { path: string; bytes: Uint8Array }[]): string {
  const encoder = new TextEncoder();
  let hash = 0x811c9dc5;
  const mix = (bytes: Uint8Array) => {
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193);
  };
  for (const file of [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    mix(encoder.encode(`${file.path}\0${file.bytes.length}\0`));
    mix(file.bytes);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Caches to delete once `current` is active: older Language Lab caches only, never another app's on the shared domain. */
export function staleCaches(existing: readonly string[], current: string): string[] {
  return existing.filter((name) => name.startsWith(STORAGE_PREFIX) && name !== current);
}
