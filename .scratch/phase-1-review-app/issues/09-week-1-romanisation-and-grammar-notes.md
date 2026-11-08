# 09: Week-1 romanisation and Grammar Notes

**What to build:** During the learner's first 7 days, counted from the first History Log event, cards show romanisation as training wheels. From day 8 on it's never shown again. The first time a Sentence introduces a grammar-pattern Item, its Grammar Note (two or three sentences and an example) appears before the card. The note isn't shown automatically again, but the learner can reopen it from any card that uses the pattern.

**Blocked by:** 07

**Status:** resolved

- [x] Review core tests: romanisation shows on days 1–7 and never on day 8 or later
- [x] Review core tests: a Grammar Note is shown on the pattern's first appearance only
- [x] Any card using a grammar pattern can reopen its Grammar Note
- [x] At least one sample grammar pattern in the Korean pack shows it working end to end

## Comments

**Built (agent):** both rules live in the Review core and are applied to the final queue in `buildQueue`.

- **Romanisation** (`src/core/romanisation.ts`): card builders copy an Item's or Sentence's `romanisation` into a new optional `card.back.romanisation`. `buildQueue` strips it unless `now` is within local days 1–7. Day 1 is the local day (`startOfDay` + `utcOffsetMinutes`) of the earliest History Log event, or today if the log is empty. The UI shows it on the reveal only, so it never gives the answer away on the front. Tests: `src/core/romanisation.test.ts`.
- **Grammar Notes** (`src/core/grammarNotes.ts`): every card whose `itemIds` include a grammar pattern with a note gets `grammarNotes: CardGrammarNote[]` (`itemId`, `pattern`, `meaning`, `text`, `example?`). The note is shown before the card through `noteBeforeCard`, which goes only on the first card in the queue that uses the pattern while no Sentence card using it has a History Log event. If a second Sentence using the pattern follows in the same queue, it doesn't get `noteBeforeCard`. Tests: `src/core/grammarNotes.test.ts`, plus an end-to-end test on the real pack in `src/content/packs.test.ts`.
- **UI:** in `src/ui/reviewScreen.ts`, a card with `noteBeforeCard` first shows the Grammar Note view, and "Got it" then shows the card. The reveal has a "Grammar Note: <pattern>" button for each note. It opens the note as an overlay, and "Back to card" leaves the revealed card as it was. The buttons are in the reveal, not on the front, so they don't hint at the answer. The view is in `src/ui/grammarNoteView.ts`, with styles in `index.html`.
- **Content:** new grammar Item `grammar-juseyo` (주세요, market + restaurant) with a Grammar Note, and Sentence `sentence-igeo-juseyo` (이거 주세요. "This one, please.", introduces 주세요), placed after 이거 얼마예요? in the order. Its audio is a **placeholder** `audio/sentence-igeo-juseyo.wav` (a copy of the placeholder tone). `npm run audio` replaces it. Spot-check the note's Korean.
