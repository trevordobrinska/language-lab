# 08: Daily caps and most-at-risk-first ordering

**What to build:** Coming back after missed days never means a wall of cards. Each day has a cap on new Items (default 15) and a cap on reviews (default 150). Reviews over the cap roll over to the next day. Overdue cards are ordered by how close the learner is to forgetting them, using the FSRS recall probability, so limited time goes to the cards most at risk. Both caps can be changed in settings. There are no streaks and no guilt messages.

**Blocked by:** 04

**Status:** resolved

- [x] Review core tests: never more than the new-Item cap of new Items in a day, however much the learner studies
- [x] Review core tests: after a simulated week away, today's queue holds at most the review cap, and the rest show up on following days
- [x] Review core tests: overdue cards come out in order of lowest recall probability first
- [x] Settings let the learner change both caps, and the change takes effect on the next queue
- [x] Nowhere in the app is there a streak counter or a missed-day message

## Comments

**Daily caps and ordering** live in `src/core/dailyCaps.ts`, tested through `buildQueue` in `src/core/dailyCaps.test.ts`.

- `buildQueue({ pack, events, now, settings? })`: `settings` is `Partial<ReviewSettings>` (`newItemsPerDay` default 15, `reviewsPerDay` default 150, `utcOffsetMinutes` default 0). It's exported with `DEFAULT_REVIEW_SETTINGS` and `startOfDay` from `src/core/index.ts`.
- **Day** means the learner's local calendar day, from local midnight to the next. The core never reads the timezone itself. The caller passes `utcOffsetMinutes` (minutes ahead of UTC). The app sets it to `-now.getTimezoneOffset()` through `reviewSettings(settings, now)` in `src/storage/settings.ts`.
- `buildQueue` applies three small functions. It doesn't decide which material is new, so ticket 07 can change how the new list is produced:
  - `mostAtRiskFirst(due, schedules)` sorts due reviews by FSRS `recall`, lowest first.
  - `capReviews(due, day)` then keeps what's left of the review cap. A review is a card first seen before today and reviewed today. A card already reviewed today, such as one failed and coming back after its step, always stays. Leftover cards roll over.
  - `capNewCards(newCards, day)` keeps what's left of the new cap. It counts the distinct cards whose first History Log event (`card-introduced` or first `card-reviewed`) falls today. Note for 07: the count is per card ID. If a Speaking card unlocking shouldn't count as a new Item, filter it before counting.
- The learn-ahead tail is unchanged.
- Settings: `newItemsPerDay` and `reviewsPerDay` are optional in `Settings`. There's a "Daily caps" `SettingsSection`. The Review screen reads settings on every queue rebuild, so a change applies to the next queue.
- The app has no streak counter or missed-day message. The done screen says only "That's today's Review done."
