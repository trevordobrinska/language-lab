# 15: iPhone check (your steps)

**What to build:** Proof that Phase 1 works where it'll actually be used. The user installs the published app on their iPhone, runs a real Review, and confirms sync and audio quality.

**Blocked by:** 08, 10, 13, 14

**Status:** ready-for-human

- [ ] Added to the iPhone home screen, it opens as a standalone app
- [ ] A full Review works in airplane mode, including audio
- [x] After pasting the token and going back online, the phone's log file appears in the private data repo, and the last sync time updates
- [ ] A Review done in the PC browser merges into the phone's queue
- [ ] A random sample of audio clips (Hangul and sentences) has been listened to, and any garbled ones are noted for regeneration
- [ ] The daily caps and progress screen behave as expected over a few real days

## Comments

- 2026-11-08: **Bug found and fixed: iPhone sync never reached GitHub.** The PC synced, but the phone stayed at "Not synced yet", and failures only went to `console.warn`, which you can't see on the phone.
  - `d804298`: the Sync section in Settings now shows why the last attempt failed (bad token 401, no access 403, repo not found 404, offline), cleared by the next success. A wrong repo name no longer counts as an empty repo, and the sync fields turn off iOS auto-capitalisation and autocorrect.
  - With that, the phone showed "Couldn't reach GitHub", meaning `fetch` threw a TypeError. Cause: `githubRemoteLog` passed `cache: "no-store"`, which Safari turns into `Cache-Control` and `Pragma` request headers. GitHub's CORS preflight doesn't allow either (checked with an OPTIONS request), so Safari blocked every request. Chrome doesn't add them, so the PC worked.
  - `e810c17`: dropped the cache mode. GETs add a unique `?t=` query instead, to stay fresh. `githubRemoteLog.test.ts` checks that every request sends only headers GitHub allows.
  - After the fix, the phone synced: `history/b5e19203-ac6f-4a13-99c8-2c53a930fb73/2026-11.jsonl` (2026-11-09 01:34 UTC), next to the PC's log.
