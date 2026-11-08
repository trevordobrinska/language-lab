# 12: Korean content: Mission 1, the market

**What to build:** About 150 word Items, tagged for Mission 1 (chatting with the shop owner at a Korean market), each brought in by one-new-item Sentences in polite speech (해요체), with Grammar Notes for the patterns they need and generated audio. It covers greetings and politeness, both number systems as used for prices and quantities, prices, food and ingredients, asking what something is and how it's cooked, and small talk ("Where are you from?", "Do you like Korean food?"). The order is chosen so the most useful market phrases come earliest.

**Blocked by:** 07, 09, 11

**Status:** resolved

- [x] About 150 word Items tagged Mission 1, each introduced by a Sentence with exactly one new Item
- [x] All Sentences use polite speech (해요체)
- [x] Every grammar pattern used has a Grammar Note
- [x] Every Sentence has English, romanisation and generated audio
- [x] Korean has been spot-checked against a dictionary (e.g. Naver Dictionary), with doubtful sentences flagged for the user
- [x] The content check passes

## Comments

**Built (agent):** `content/ko/pack.json` now holds 148 new word Items, 16 new grammar Items (each with a Grammar Note) and 164 new Sentences, all added after ticket 07/09's samples in the order. With the 5 existing market words, that's 153 word Items tagged `market`. Shared words (greetings, numbers, food, grammar) are also tagged `restaurant`. The existing IDs are unchanged. 맛있어요 stays restaurant-only, so no market Sentence uses it.

- **Order (most useful first):**
  1. greetings and politeness (어서 오세요, 안녕히 계세요/가세요, 아니요, 괜찮아요, 죄송해요, 저기요, 잠깐만요, 알겠어요, 몰라요);
  2. asking for things and what they are (있어요/없어요, 이거/그거/저거 뭐예요?, 뭐가 좋아요?);
  3. native numbers 하나–열 with 개, then 몇 개 드릴까요?, 두 개요, 더/조금/많이;
  4. prices: Sino-Korean 일–십, 백, 천, 만 with 원; 싸요/비싸요, 깎아 주세요, 전부 얼마예요?;
  5. paying (카드 돼요?, 현금, 영수증, 잔돈, 봉투);
  6. food and ingredients with counters 봉지, 단, 마리, 병, 킬로; taste and freshness words; owner phrases (맛보세요, 덤, 제철, 국산);
  7. how it's eaten and cooked (어떻게 먹어요/요리해요?, 생으로, 볶아요, 구워요, 넣어요, 끓여요, 삶아요, 만들어요);
  8. small talk (한국 음식 좋아해요?, 매운 거 잘 먹어요?, 한국어 조금 해요, 어디에서 왔어요?, 밥 먹었어요?, 많이 파세요).
- **Grammar Items:** -(으)세요, -아요/-어요, -이에요/-예요, -(이)요, -이/-가, 개, -(으)ㄹ까요?, -은/-는, -에, 원, -아/-어 주세요, 안, -을/-를, -도, -에서, -았어요/-었어요 (plus the existing 주세요).
  - Where a pattern first shows up inside a fixed phrase (안녕하세요, 괜찮아요, 드릴까요, 깎아 주세요), the next Sentence introduces the grammar Item: it's built from known words, so the Grammar Note comes right after the learner has heard the pattern. From then on, every Sentence using the pattern lists it, so its note can be reopened from those cards.
  - A few fixed phrases are word Items, with the grammar inside them explained only in their meaning: 알겠어요, 잠깐만요, 매운 거, 팔렸어요, 천천히 말해 주세요, 다시 말해 주세요.
  - Verbs are word Items in their 해요체 form, with the dictionary form in the meaning, e.g. 사요 "buy (사다)". Past-tense Sentences such as 왔어요 list the verb plus the past-tense Item.
- **Numbers and prices are written in Hangul** (삼천 원), not digits, so the learner reads the number words and TTS can't misread digits.
- **Romanisation:** Revised Romanization following pronunciation, e.g. 없어요 eopseoyo, 십만 simman, 삶아요 salmayo, 끓여요 kkeuryeoyo, 한국어 hangugeo. Tensification isn't marked, as RR doesn't.
- **Audio:** each new Sentence has a placeholder tone `content/ko/audio/<sentence-id>.wav`, a copy of the existing placeholder. `npm run audio` (ticket 03) replaces them. The "generated audio" box stays open until that runs.

**Code change: the content check now verifies Hangul letters** (`src/core/hangul.ts`, rule in `src/core/contentCheck.ts`, tests in `src/core/contentCheck.test.ts`).
- I picked *check* over *derive*: Sentences still list their letter Items in `itemIds`, as ticket 07 decided. The check decomposes every Hangul syllable in a Sentence's text into jamo and fails, naming the Sentence and the missing letters, if a letter Item isn't listed: `Sentence "x" uses letters its itemIds don't list: ㅂ ("hangul-b")`.
- A compound final the pack doesn't teach as its own letter (ㅄ, ㄺ, ㄻ, ㄼ, ㅀ...) needs its component letters (ㅄ → ㅂ + ㅅ). Compound vowels map to their own letter Items, which the pack defines.
- A jamo that no letter Item teaches is reported too.
- Keeping the data explicit means the scheduler, Grammar Notes and progress code didn't change. To fix a failure, copy the named IDs in.
- I generated the letter lists for this ticket with a throwaway script that wasn't committed. `pack.json` is still the only source.
- `src/content/packs.test.ts` changes: the real-pack order test now checks the first Sentences, checks that every Sentence gets introduced, and checks that 맛있어요 (restaurant only) comes last. The Grammar Note test now allows one note per pattern in the first queue. A new test checks that every grammar Item has a Grammar Note and every Sentence has English and romanisation.

**Dictionary check:** Naver Dictionary refuses automated fetches, so I couldn't check against it. I spot-checked on Wiktionary instead:
- 덤 ("extra, freebie");
- 깎다 ("to reduce, discount"), whose example is 너무 비싸요. 조금만 깎아 주세요;
- 구경하다 (sightsee);
- 국산 (domestic product);
- 잔돈 (small change, synonym 거스름돈);
- 싱싱하다 (fresh, synonym 신선하다).

The rest is conservative textbook phrasing, but **please check these on Naver Dictionary before they're memorised.** I'm less than sure they're the most natural choice:

1. 돈 여기 있어요. ("Here's the money.") A bare 여기 있어요 may be more natural.
2. 한국 돈은 원이에요. ("Korean money is the won.") It's correct but textbook-ish. It's there so 원 can come in as the only new Item.
3. 한국 배예요. ("It's a Korean pear.")
4. 볶아요. / 이거 구워요? / 마늘 넣어요. / 생으로 먹어요. These are answers to "how do you cook it?". A shop owner might rather say 볶아 드세요 or 볶아 먹어요.
5. 그냥 구경해요. ("I'm just looking.") It might be 그냥 구경하는 거예요 or 그냥 볼게요.
6. 이거 덤이에요. ("This one's on the house.") Owners may say 덤으로 드릴게요.
7. 딸기가 제철이에요. Maybe 요즘 딸기가 제철이에요.
8. 맛보세요. ("Have a taste.") Maybe 맛 좀 보세요 or 드셔 보세요.
9. 다 주세요. ("I'll take all of it.") Maybe 다 살게요.
10. 시장 좋아해요. / 김치 만들어요. These drop the object particle, as speech often does. Check that this sounds fine.
11. 많이 주세요. ("Lots, please.")
12. The meanings 많이 파세요 = "Hope you sell lots!" (a goodbye to a vendor) and 잠깐만요 = "excuse me, let me through".
13. Nationality: 저는 미국 사람이에요 and 캐나다에서 왔어요 are placeholders. Swap in your own country if it's neither (change the word Item's text, meaning and romanisation, and the Sentence's).

**Open, for the user:**
1. Run `npm run audio` (ticket 03 setup), listen-check a sample of the new Sentence clips (try the number and price Sentences), then tick the audio box.
2. Check the doubtful list above against Naver Dictionary and fix any Sentence that's wrong. To change a Sentence's text, delete its audio and rerun `npm run audio`. Then tick the dictionary box.

- 2026-11-08: User checked all 13 doubtful items, plus the suggested alternatives, on Naver; the table is in `../naver-check.md`. No Sentence's meaning is wrong. Where Naver's English differed, it read the dropped subject differently (볶아요 "I'll stir-fry it" vs the pack's vendor reading "You stir-fry it") or took an idiom literally (많이 파세요 "Sell a lot"), so the pack's glosses stand. Nothing in this ticket changed. A translation confirms meaning, not naturalness: the alternatives (볶아 드세요, 그냥 볼게요, 맛 좀 보세요...) are still worth putting to a native speaker.

