# 01: First working piece: one Hangul card, start to finish

**What to build:** In the PC browser, the learner opens Language Lab and sees one Review with a few Hangul letter cards. Each card shows a letter and plays its sound. The learner reveals the answer, grades it Again or Good, and that grade is saved to the on-device History Log, so after a reload the Review knows which cards have been graded. This sets up the project (TypeScript + Vite + Vitest, no framework, same as Doodle Monsters), the language-neutral content pack format (Items, Sentences, Grammar Notes, introduction order, Mission tags, optional romanisation and script fields), and the first version of the pure Review core: content pack + History Log + time in, today's queue out, a grade in, a History Log event out. Placeholder audio files are fine.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The project builds, and the test command runs Vitest
- [x] A small Korean content pack with a few Hangul Items is loaded in the content pack format described in the spec
- [x] The Review core returns a queue from content + History Log + time. It has no UI, storage or network inside it, and the clock is passed in as an argument
- [x] The card front shows the letter and plays audio. Revealing shows the answer. Again and Good buttons are large
- [x] Grading adds a History Log event (unique event ID, device ID, timestamp, type, card ID) to the on-device store, which is named with a `language-lab` prefix
- [x] After a reload, already-graded cards are reflected in the queue
- [x] Vitest tests cover the Review core through its public interface

## Comments

**Module layout** (later tickets build on this):

- `src/core/` — the pure Review core. Import it only through `src/core/index.ts`:
  - `buildQueue({ pack, events, now })` returns today's `Card[]`; each `Card` has `id`, `kind`, `front` (text, audio) and `back` (text). The clock is always passed in.
  - `gradeCard(card, grade, { now, deviceId, eventId })` returns a `card-reviewed` History Log event. The caller supplies the event ID, so the core stays deterministic.
  - `contentPack.ts` holds the language-neutral pack types (Items, Sentences, Grammar Notes, `order`, optional `script`/`romanisation`/`tone`). `historyLog.ts` holds the event types (`card-reviewed` with a grade, `card-introduced`).
  - `scheduler.ts` is the scheduler adapter seam reserved for `ts-fsrs`: `replay(reviews) -> { due }`. It's a **placeholder** for now (Good = 1 day, Again = 1 minute). Ticket 04 replaces its inside.
  - `testing.ts` has test-pack and event builders. `review.test.ts` tests the core through its public interface.
- `src/content/packs.ts` loads `content/ko/pack.json` and resolves audio paths (relative to the pack folder) to bundled URLs via `audioUrl(pack, path)`, which returns undefined if the file is missing. This is useful for ticket 02's audio check.
- `content/ko/` holds the Korean pack data and `audio/`. The audio is a set of **placeholder** tones (`hangul-*.wav`) that ticket 03 will replace.
- `src/storage/`: the `HistoryLogStore` interface (`add` / `all`, add-only and idempotent by event ID), `memoryHistoryLog()` for tests, `indexedDbHistoryLog()` (IndexedDB database `language-lab-history-log`), and `deviceId()` (localStorage key `language-lab:device-id`). `STORAGE_PREFIX` is the shared prefix.
- `src/ui/reviewScreen.ts` and `src/main.ts` make up the no-framework shell. They rebuild the queue from the stored log after every grade.

**Decisions:** Card IDs look like `letter:<itemId>`. Sentence cards can follow the same pattern (e.g. `listening:<sentenceId>`). Event timestamps are ISO 8601 UTC strings. The pack's `order` lists letter/sound Item IDs and Sentence IDs. Words and grammar arrive inside the Sentence that introduces them. The UI and IndexedDB store aren't unit-tested (per the spec), and the reload behaviour is covered by the core tests, which replay events.
