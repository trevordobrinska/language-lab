# 06: History Log merge and GitHub sync

**What to build:** The learner pastes a fine-grained GitHub token into settings, and from then on the History Log syncs in the background whenever they're online, without ever blocking Review. Each device writes only its own log file(s) in the private data repo. It reads every device's files and merges them with a pure join that removes duplicates by event ID. Settings show the last successful sync time. A failed sync leaves the local log untouched and is retried later. The app works fully before a token is set. See ADR 0003.

**Blocked by:** 01

**Status:** resolved

- [x] Merge tests show that A+B equals B+A, that merging twice changes nothing, and that duplicates are removed by event ID
- [x] Two devices' logs merged together give the same queue as one combined log
- [x] The GitHub calls sit behind a remote-log interface, and tests use an in-memory fake
- [x] A device only ever writes its own files
- [x] A failed request keeps the local log and retries later. Review is never blocked
- [x] Settings take the token and show the last sync time. With no token, the app runs normally

## Comments

**Remote file layout (data repo):** `history/<deviceId>/<YYYY-MM>.jsonl`, one JSON History Log event per line, grouped by the UTC month of the event's `at`. A device only writes under `history/<its deviceId>/`, and only rewrites a month file when it has events the remote copy lacks. Monthly files keep each one small, so a PUT never resends years of history.

**Interfaces:**

- `mergeLogs(...logs)` in `src/core/merge.ts` (exported from `src/core/index.ts`) is the pure join: union by event ID, sorted by `at` then ID. Tests are in `src/core/merge.test.ts`, including the same-queue check through `buildQueue`.
- `src/sync/remoteLog.ts` defines `RemoteLog` (`list` / `read(path)` / `write(path, events)`) and the path and JSON-lines helpers. `memoryRemoteLog()` is the fake: `writes` records paths and `failNext(n)` simulates dropped requests. `githubRemoteLog({ token, owner, repo })` uses the contents API via `fetch`: it lists directories to collect the blob SHAs it needs for updates, reads with the raw media type, and writes with PUT. It isn't unit-tested. A write with a stale SHA fails, and the next sync lists again and retries.
- `syncHistoryLog({ local, remote, deviceId })` in `src/sync/sync.ts` does one pull-then-push pass. It never throws and returns `{ ok }`.
- `backgroundSync({ sync, now, setTimer, retryAfterMs, onSynced, onFailed })` in `src/sync/backgroundSync.ts` runs one sync at a time and schedules a retry after a failure. `syncNow()` never rejects.
- `src/storage/settings.ts` holds the `Settings` type in localStorage key `language-lab:settings` (`githubToken`, `dataRepoOwner`, `dataRepoName`, `lastSyncAt`), plus `loadSettings`, `updateSettings(changes)` and `syncTarget`. Add new fields as optional.
- `src/ui/settingsScreen.ts`: **to extend it (ticket 08), write a `SettingsSection` function and add it to `SECTIONS`.** A section gets `{ settings, save, requestSync }`.
- `src/main.ts` syncs at startup, when the browser comes back online, when the app becomes visible, and 30 s after the last grade (`showReviewScreen` gained an optional `onGraded`). With no token, sync is a no-op and `lastSyncAt` isn't set.
