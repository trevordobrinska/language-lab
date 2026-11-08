# 01: First working piece: one Hangul card, start to finish

**What to build:** In the PC browser, the learner opens Language Lab and sees one Review with a few Hangul letter cards. Each card shows a letter and plays its sound. The learner reveals the answer, grades it Again or Good, and that grade is saved to the on-device History Log, so after a reload the Review knows which cards have been graded. This sets up the project (TypeScript + Vite + Vitest, no framework, same as Doodle Monsters), the language-neutral content pack format (Items, Sentences, Grammar Notes, introduction order, Mission tags, optional romanisation and script fields), and the first version of the pure Review core: content pack + History Log + time in, today's queue out, a grade in, a History Log event out. Placeholder audio files are fine.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The project builds, and the test command runs Vitest
- [ ] A small Korean content pack with a few Hangul Items is loaded in the content pack format described in the spec
- [ ] The Review core returns a queue from content + History Log + time. It has no UI, storage or network inside it, and the clock is passed in as an argument
- [ ] The card front shows the letter and plays audio. Revealing shows the answer. Again and Good buttons are large
- [ ] Grading adds a History Log event (unique event ID, device ID, timestamp, type, card ID) to the on-device store, which is named with a `language-lab` prefix
- [ ] After a reload, already-graded cards are reflected in the queue
- [ ] Vitest tests cover the Review core through its public interface
