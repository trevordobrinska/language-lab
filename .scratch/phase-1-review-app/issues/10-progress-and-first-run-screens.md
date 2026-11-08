# 10: Progress and first-run screens

**What to build:** A progress screen shows, in learning terms only, how many Items and Sentences the learner has learned, how many cards are due today, and how much of the market Mission's vocabulary they have learned. There are no points, badges or streaks. On first launch, a short screen explains how Review works: recall first, then reveal, then grade yourself honestly, plus why (retrieval practice and spacing, with Evidence Tiers).

**Blocked by:** 07

**Status:** resolved

- [x] The Review core answers progress questions (Items learned, Sentences learned, cards due, Mission coverage), with tests
- [x] The progress screen shows those numbers and nothing game-like
- [x] The first-run screen appears once, can be reopened from settings, and names each Method with its Evidence Tier

## Comments

**Progress core:** `progress({ pack, events, now, settings? })` in `src/core/progress.ts` takes the same input as `buildQueue` and is exported from `src/core/index.ts`. Tests are in `src/core/progress.test.ts`. It returns:

- `items` and `sentences`, each `{ learned, total }`.
- `cardsDue`: every reviewed card due at `now`, before the review cap (the raw backlog).
- `todaysReview`: `buildQueue(input).length`, so it always matches what Review serves. It respects both caps and includes new cards and the learn-ahead tail. Both due counts are reported on purpose; the screen notes when the backlog is bigger than today's Review.
- `mission?`: `{ id, name, learned, total }` for `pack.missions[0]`. It counts word Items tagged for that Mission only, so letters, sounds and grammar don't count. It's absent if the pack has no Missions.

**"Learned"** (added to `GLOSSARY.md`): the Item's introducing card was graded Good on its latest review. The introducing card is its letter card for letter, syllable and sound Items, or the Listening Card of the Sentence whose `introduces` names it. A Sentence is learned through its Listening Card; Speaking Cards don't affect either count. Good always graduates a card in the scheduler, so this is the same as "passed at least once and not currently relearning". An Again later in the card's life stops it counting until it's passed again.

**UI:**

- `src/ui/progressScreen.ts` is opened from a new "Progress" button beside "Settings" (both now sit in `<nav id="nav">` in `index.html`).
- `src/ui/howReviewWorks.ts` has the three steps plus `METHODS`: each Method with its Evidence Tier and citation. It shows on first launch until dismissed, tracked by `seenHowReviewWorks` in `Settings`. Settings has a "How Review works" section to reopen it (`SettingsScreenDeps.openHowReviewWorks`).
- The review screen is unchanged.
- The citations for recognition-before-production (VanPatten & Cadierno 1993) and romanisation (Bassetti 2008) are my choices, since the spec gives none. Check them before relying on them.
