# 04: FSRS scheduling

**What to build:** Cards come back when the learner is about to forget them. The Review core schedules each card with FSRS through `ts-fsrs` (90% target recall, default parameters, behind a thin wrapper nothing else touches), calculating every card's state by replaying the History Log. A card graded Again comes back later in the same Review. Grades are Again and Good only.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Nothing outside the Review core's scheduler wrapper imports `ts-fsrs`
- [ ] No schedule is stored. It's calculated from the History Log each time
- [ ] Tests that simulate weeks of History Log events show cards returning at longer gaps after Good and shorter gaps after Again
- [ ] A failed card comes back in the same Review
- [ ] The queue mixes due reviews with new cards (interleaved, not in separate blocks)
