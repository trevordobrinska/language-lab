# 08: Daily caps and most-at-risk-first ordering

**What to build:** Coming back after missed days never means a wall of cards. Each day has a cap on new Items (default 15) and a cap on reviews (default 150). Reviews over the cap roll over to the next day. Overdue cards are ordered by how close the learner is to forgetting them, using the FSRS recall probability, so limited time goes to the cards most at risk. Both caps can be changed in settings. There are no streaks and no guilt messages.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Review core tests: never more than the new-Item cap of new Items in a day, however much the learner studies
- [ ] Review core tests: after a simulated week away, today's queue holds at most the review cap, and the rest show up on following days
- [ ] Review core tests: overdue cards come out in order of lowest recall probability first
- [ ] Settings let the learner change both caps, and the change takes effect on the next queue
- [ ] Nowhere in the app is there a streak counter or a missed-day message
