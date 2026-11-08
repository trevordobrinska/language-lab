# 05: Offline install

**What to build:** The learner can add Language Lab to the iPhone home screen, open it like an app, and run a full Review in airplane mode. A service worker caches the app, the content pack and all audio. When a new version is published, it's picked up the next time the app opens. Every stored name (local storage, service-worker caches) starts with `language-lab`, because the domain is shared with the Arcade games.

**Blocked by:** 01

**Status:** resolved

- [ ] A web app manifest and icons let the app be added to the home screen and open in standalone mode (built; hand check on the iPhone, ticket 15)
- [ ] Once loaded, a Review works with the network turned off, including audio (built; hand check on the iPhone, ticket 15)
- [ ] Publishing a new build is picked up on the next open, with no manual reinstall (built; hand check on the iPhone, ticket 15)
- [x] Every storage and cache name starts with `language-lab`
- [x] The app works when served from a sub-path (the Language Lab path on the GitHub Pages domain)

## Comments

**What was built (hand-rolled, no PWA plugin):**

- `src/offline/cachePlan.ts` (pure, tested in `cachePlan.test.ts`): `appCacheName(version)` gives `language-lab-app-<version>`; `precacheUrls(builtFiles)` lists `./` plus every built file except `sw.js` and source maps, as URLs relative to the service worker; `buildVersion(files)` is an 8-hex FNV-1a fingerprint of every path and its bytes; `staleCaches(existing, current)` keeps the cleanup to `language-lab`-prefixed caches, so Arcade games' caches are never touched.
- `src/offline/serviceWorker.ts`: install caches every built file into this build's cache (with `cache: "reload"` so GitHub Pages' HTTP cache can't serve stale files) and calls `skipWaiting`. Activate deletes stale Language Lab caches and claims the open pages. Fetch answers same-origin GETs from this build's cache only (never `caches.match` across all caches), falls back to `index.html` for navigations, then to the network.
- `vite.config.ts` has a `language-lab-service-worker` plugin. After the app build, it lists `dist/`, then builds the worker to `dist/sw.js` (IIFE) with the precache list and build version baked in. Any change to any file changes `sw.js`, and that's how the browser notices a new version. Audio is cached generically as "every file in the build", so moving from `.wav` to `.mp3` (ticket 03) needs no change here.
- `src/offline/registerServiceWorker.ts` (called from `main.ts`, production builds only) registers `./sw.js` with `updateViaCache: "none"`. When an update takes over it reloads the page once, so the new version shows on that same open. It also checks for an update whenever the app becomes visible, because iOS often resumes a home-screen app instead of relaunching it. The reload loses at most an ungraded reveal, because the History Log is in IndexedDB.
- `public/manifest.webmanifest` (relative `start_url`/`scope`, standalone, cream theme) and `public/icons/` (192, 512, maskable 512, and a 180 apple-touch-icon), drawn by `scripts/make-icons.mjs` (no image library). `index.html` links them and adds the Apple standalone meta tags.
- Added `@types/node` (dev) and the `node` type to `tsconfig.json` for the plugin in `vite.config.ts`. `vite build` prints a harmless warning about the future native config loader, because the config imports `src/offline/cachePlan.ts`.

**Verified here:** `npm test` and `npm run build` pass. `npx vite preview --base /language-lab/` serves `/language-lab/`, `sw.js`, the manifest, icons, JS and audio with the right content types. Every URL in the built `index.html` and in `sw.js` is relative.

**Hand check on the iPhone (ticket 15):**

1. Open the published `…/language-lab/` in Safari, then Share > Add to Home Screen. Check the icon and name. Open it from the home screen and confirm it's standalone (no Safari bar).
2. Open it once online, wait a few seconds, then switch to airplane mode, force-quit, and reopen. A full Review should run, including audio playback.
3. Publish a visibly changed build. Open the app online, either relaunched or resumed. Within a few seconds it should reload once into the new version. In Safari's Web Inspector (Storage > Cache Storage), only one `language-lab-app-*` cache should remain, and any Arcade caches should be untouched.
4. All localStorage keys, IndexedDB databases and caches should start with `language-lab`.
