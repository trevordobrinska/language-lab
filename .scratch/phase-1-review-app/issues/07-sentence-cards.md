# 07: Sentence cards

**What to build:** New words arrive inside whole sentences. A Listening Card plays the sentence audio (replayable as often as the learner likes) and asks them to recall the meaning. The reveal shows the Hangul, the English meaning and the new Item highlighted. Once a sentence's Listening Card has been graded Good on two separate days, its Speaking Card unlocks: it shows the English, the learner says the Korean aloud, then reveals the Hangul and plays the native audio. A Sentence becomes eligible to introduce only when all its Hangul has been met and exactly one of its Items is new. Among eligible Sentences, Mission 1 (market) Items come first, then the authored order.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Listening Card: audio first, replay before revealing, then a reveal with Hangul, English and the new Item highlighted
- [ ] Speaking Card: English first, then a reveal with Hangul and native audio
- [ ] Review core tests: no Speaking Card before two Good days on its Listening Card; it appears after them
- [ ] Review core tests: a Sentence with two unknown Items, or unmet Hangul, is never introduced
- [ ] Review core tests: an eligible Mission 1 Sentence is introduced before an eligible Sentence that isn't tagged for a Mission
- [ ] A few sample Sentences in the Korean pack show it working end to end
