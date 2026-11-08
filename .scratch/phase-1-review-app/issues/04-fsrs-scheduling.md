# 04: FSRS scheduling

**What to build:** Cards come back when the learner is about to forget them. The Review core schedules each card with FSRS through `ts-fsrs` (90% target recall, default parameters, behind a thin wrapper nothing else touches), calculating every card's state by replaying the History Log. A card graded Again comes back later in the same Review. Grades are Again and Good only.

**Blocked by:** 01

**Status:** resolved

- [x] Nothing outside the Review core's scheduler wrapper imports `ts-fsrs`
- [x] No schedule is stored. It's calculated from the History Log each time
- [x] Tests that simulate weeks of History Log events show cards returning at longer gaps after Good and shorter gaps after Again
- [x] A failed card comes back in the same Review
- [x] The queue mixes due reviews with new cards (interleaved, not in separate blocks)

## Comments

**Scheduler interface** (for tickets 07 and 08):

- `src/core/scheduler.ts` is the only file that imports `ts-fsrs` (v6). `schedule(reviews, now) -> { due, recall }` replays a card's `PastReview`s (oldest first) through FSRS. `recall` is FSRS retrievability at `now`, from 0 to 1. The settings are: default weights, `request_retention` 0.9, `learning_steps` and `relearning_steps` both `["10m"]`, and fuzz off so the same log always gives the same schedule. With a single learning step, a new card graded Good graduates straight away (it comes back about 2 days later), and Again always means a 10-minute step.
- Public, through `src/core/index.ts`: `cardSchedules({ events, now }) -> Map<cardId, CardSchedule>` covers every reviewed card. Cards that were never reviewed are absent. Reviews are sorted by time, with ties broken by event ID, so merged logs replay the same way in any order. Ticket 08 can order overdue cards by `recall` ascending, and progress can count due cards from it.
- `buildQueue` order: due reviews (currently sorted by `due`) are interleaved one-for-one with new cards (in pack order). After them come cards still in a (re)learning step that's due within 20 minutes (`LEARN_AHEAD_MS`). So a failed card waits at the end of the queue, and the Review doesn't end before it comes back. Ticket 08 should apply the caps and the recall ordering to the `dueReviews` / `newCards` lists inside `buildQueue`, and leave the learn-ahead tail alone. Tests are in `src/core/scheduling.test.ts`.
