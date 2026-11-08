# 07: Sentence cards

**What to build:** New words arrive inside whole sentences. A Listening Card plays the sentence audio (replayable as often as the learner likes) and asks them to recall the meaning. The reveal shows the Hangul, the English meaning and the new Item highlighted. Once a sentence's Listening Card has been graded Good on two separate days, its Speaking Card unlocks: it shows the English, the learner says the Korean aloud, then reveals the Hangul and plays the native audio. A Sentence becomes eligible to introduce only when all its Hangul has been met and exactly one of its Items is new. Among eligible Sentences, Mission 1 (market) Items come first, then the authored order.

**Blocked by:** 04

**Status:** resolved

- [x] Listening Card: audio first, replay before revealing, then a reveal with Hangul, English and the new Item highlighted
- [x] Speaking Card: English first, then a reveal with Hangul and native audio
- [x] Review core tests: no Speaking Card before two Good days on its Listening Card; it appears after them
- [x] Review core tests: a Sentence with two unknown Items, or unmet Hangul, is never introduced
- [x] Review core tests: an eligible Mission 1 Sentence is introduced before an eligible Sentence that isn't tagged for a Mission
- [x] A few sample Sentences in the Korean pack show it working end to end

## Comments

**Interfaces** (for tickets 09 and 10):

- `src/core/cards.ts` holds `Card` and `CardKind` (`letter` | `listening` | `speaking`) and the card builders. Card IDs are `letter:<itemId>`, `listening:<sentenceId>` and `speaking:<sentenceId>`.
  - Every card has `itemIds`: the Items it practises. Ticket 09 can use this to reopen a Grammar Note from any card that uses the pattern.
  - `front` is `{ text?, audio? }`. Listening Cards have audio only. Speaking Cards have the English only.
  - `back` is `{ text, meaning?, audio?, newItem? }`. For a Sentence, `text` is the Target Language, `meaning` is the English, and `newItem` is `{ text, meaning }` of the Item it introduces. A Speaking Card's `back.audio` is the native audio, played on the reveal.
  - Everything optional can be extended. Add romanisation or a Grammar Note as new optional fields.
- `src/core/newMaterial.ts` has `newMaterial(pack, events, utcOffsetMinutes)`, which returns the new cards in introduction order. `buildQueue` passes them through ticket 08's `capNewCards`. The order is:
  1. Just-unlocked Speaking Cards. A Speaking Card unlocks after Good grades on two distinct local days (ticket 08's `startOfDay`).
  2. Unseen letter, syllable and sound Items (`AUDIO_ITEM_KINDS`), in the authored order.
  3. Eligible Sentences.
- **Sentence eligibility:** every letter, syllable or sound Item listed in the Sentence's `itemIds` has been met, and exactly one other Item is unmet. Eligible Sentences whose new Item is tagged with Mission 1 go first. Otherwise they follow the authored order. Mission 1 is `pack.missions[0]`. `ContentPack.missions` is a new optional field, `{ id, name }[]` in priority order.
  - The walk is greedy: meeting one Sentence can make the next eligible in the same queue.
  - "Met" means the card has any History Log event. Letters count through their letter card. A Sentence's Items count once its Listening Card has been seen.
- **Hangul is listed explicitly:** a Sentence names the letter Items it needs in its own `itemIds`. They aren't worked out from the text. The content check already makes those letters come earlier in `order`. Ticket 12 authors need to list them too.
- **Caps:** `capNewCards` now counts and caps only cards that bring in a new Item (`bringsNewItem` in `cards.ts`). Speaking unlocks never use up the new-Item cap.
- **Korean pack:** six sample Sentences, with word Items and Missions `market` and `restaurant`:
  - 네, 안녕하세요, 맛있어요 (restaurant only), 얼마예요?, 이거 얼마예요?, 감사합니다.
  - At runtime 맛있어요 is introduced last, after the market Sentences, even though it's authored third.
  - Audio is **placeholder** `audio/sentence-*.wav` (copies of a placeholder tone). `npm run audio` replaces them with mp3s (ticket 03).
  - Spot-check the Korean against a dictionary before it's memorised.
- Tests: `src/core/sentenceCards.test.ts` (Review core), and an end-to-end order test on the real pack in `src/content/packs.test.ts`. The UI is in `src/ui/reviewScreen.ts`, with styles in `index.html`.
