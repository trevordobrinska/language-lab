/**
 * The service worker. Built separately to `sw.js` at the app root by the
 * `serviceWorker` plugin in `vite.config.ts`, which fills in the two constants
 * below. Not unit-tested: offline behaviour is checked by hand on the iPhone.
 *
 * - install: cache every file of this build (app, content pack, all audio)
 *   into a cache named for this build, bypassing the HTTP cache.
 * - activate: delete older Language Lab caches (never another app's on the
 *   shared domain) and take over open pages straight away.
 * - fetch: answer from this build's cache, falling back to the network.
 */
import { appCacheName, staleCaches } from "./cachePlan";

declare const __PRECACHE_URLS__: string[];
declare const __BUILD_VERSION__: string;

// Minimal service-worker types (the project's lib is DOM, not WebWorker).
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}
interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response>): void;
}
interface ServiceWorkerScope {
  registration: { scope: string };
  location: Location;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  addEventListener(type: "install" | "activate", listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: "fetch", listener: (event: FetchEvent) => void): void;
}

const sw = self as unknown as ServiceWorkerScope;
const CACHE = appCacheName(__BUILD_VERSION__);
const scoped = (url: string) => new URL(url, sw.registration.scope).href;

sw.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(__PRECACHE_URLS__.map((url) => new Request(scoped(url), { cache: "reload" })));
      await sw.skipWaiting();
    })(),
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const stale = staleCaches(await caches.keys(), CACHE);
      await Promise.all(stale.map((name) => caches.delete(name)));
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== sw.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached =
        (await cache.match(request, { ignoreSearch: true })) ??
        (request.mode === "navigate" ? await cache.match(scoped("./index.html")) : undefined);
      return cached ?? fetch(request);
    })(),
  );
});
