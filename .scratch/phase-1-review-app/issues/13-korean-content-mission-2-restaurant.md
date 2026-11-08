# 13: Korean content: Mission 2, the restaurant

**What to build:** About 150 more word Items, tagged for Mission 2 (ordering and talking with staff at a Korean restaurant), building on Mission 1's vocabulary. Same rules: one-new-item Sentences in polite speech, Grammar Notes and generated audio. It covers ordering, asking what a dish is and how spicy it is, making requests (more water, less spicy, the bill), and talking with the staff.

**Blocked by:** 12

**Status:** ready-for-human

- [x] About 150 word Items tagged Mission 2, each introduced by a Sentence with exactly one new Item, building only on earlier Items
- [x] All Sentences use polite speech, with Grammar Notes for any new patterns
- [x] Every Sentence has English, romanisation and generated audio
- [ ] Korean has been spot-checked against a dictionary, with doubtful sentences flagged for the user
- [x] The content check passes, and the Korean pack totals about 300 word Items

## Comments

**Built (agent):** `content/ko/pack.json` now has 146 new word Items, 11 new grammar Items (each with a Grammar Note) and 157 new Sentences. They come after ticket 12's Sentences in the order. The pack now has **300 word Items**. All the new Items are tagged `restaurant` only, so the market Sentences still come first in the queue. The restaurant Sentences then start with 맛있어요, which is the first of them in the authored order. No existing IDs changed. 이거 and 사요 were tagged `market` only, but restaurant Sentences now use them (사요 in 제가 살게요, "it's on me"), so they also carry `restaurant` now.

- **Order (most useful first):**
  1. water, the menu and getting a table (몇 분이세요?, 두 명이요, 자리 있어요?, 여기요!, 사장님);
  2. ordering (이거/이걸로 할게요, 주문할게요, 뭐 드시겠어요?, 추천, 제일, 인기 메뉴, 인분, -하고, 같은 거, 먹고 싶어요);
  3. more water and refills (물 한 잔 더, 물은 셀프예요, 반찬 좀 더, 리필, 공깃밥, 물만);
  4. how spicy it is (이 찌개 얼마나 매워요?, 아주, 하나도 안 매워요, 못 먹어요, 덜 매운 거, 덜 맵게 해 주세요);
  5. what a dish is and what's in it (무슨 음식, 무슨 맛, 뭐 들어가요?, 해산물/새우, 고기 빼 주세요, 채식주의자, 알레르기);
  6. the food arriving (나왔어요, 맛있게 드세요, 잘 먹겠습니다, 뜨거워요/조심하세요);
  7. asking for things at the table and talking with staff (앞접시, 숟가락, 젓가락, 휴지, 가위, 치워 주세요, 이모, 안 시켰어요, 아직 안 나왔어요, 언제/금방, 걸려요, 기다려 주세요, 기다려야 돼요?);
  8. taste and feelings (싱거워요, 국물이 시원해요, 고소해요, 부드러워요, 배고파요/배불러요/목말라요);
  9. drinks (마셔요, 맥주/소주/막걸리 한 병, 음료수, 얼음, 건배);
  10. paying, takeout and leaving (계산해 주세요, 따로/같이, 제가 살게요/낼게요, 카드로, 포장, 여기서 먹을게요, 잘 먹었습니다, 다음에 또 올게요, 몇 시까지 해요?);
  11. about 30 dish and table words (냉면, 갈비, 삼겹살, 상추, 쌈장, 김밥 두 줄, 떡볶이, 순두부찌개, 부대찌개, 삼계탕, 짜장면, 짬뽕, 식당, 근처, 맛집, 유명해요...).
- **Grammar Items:** -아도/-어도 돼요?, -(으)ㄹ게요, -고 싶어요, -하고, -만, 못, -게, -아/-어 보세요, -아야/-어야 돼요, -(으)로, -까지. They follow ticket 12's convention: a grammar Item comes in through a Sentence made of known words. If a fixed phrase uses a pattern first (이걸로 before -(으)로), its meaning explains it.
- **하다 nouns** are new here. 주문, 예약, 추천, 계산, 포장, 추가 and 조심 are noun Items, and their Sentences also list the existing 해요 ("do (하다)") Item, e.g. 계산해 주세요 = 계산 + 해요 + -아/-어 주세요. The learner gets the noun and the verb from one Item. Other verbs keep ticket 12's style: a word Item in its 해요체 form, with the dictionary form in the meaning (기다려요 (기다리다), 빼요 (빼다)).
- **Polite speech:** every Sentence is 해요체 except four fixed phrases that are normally said in formal 합니다체: 잘 먹겠습니다, 잘 먹었습니다, 알겠습니다 and 죄송합니다. Their meanings say so. Staff phrases with -시- (주문하시겠어요?, 뭐 드시겠어요?, 드세요) are fixed word Items that you'll mostly hear rather than say.
- **Letters, romanisation and audio** follow ticket 12. I generated the letter lists with a throwaway script (not committed), and the Hangul-letter content check passes. Romanisation is RR following pronunciation within a word, e.g. 국물이 gungmuri, 목말라요 mongmallayo, 음료수 eumnyosu, 맛있게 masitge, 예약했어요 yeyakaesseoyo. Each new Sentence has a placeholder tone `content/ko/audio/<sentence-id>.wav`.

**Test change** (`src/content/packs.test.ts`): ticket 12's test said 맛있어요 comes last in the queue, and that's no longer true. It now checks that no market Sentence follows a restaurant-only one, and that the restaurant Sentences start with 맛있어요. A new test checks that the pack holds 290–310 word Items, with at least 140 of them restaurant-only.

**Dictionary check:** Naver refuses automated fetches, so I spot-checked on Wiktionary:
- 공깃밥 ("rice in an empty bowl", RR gonggitbap);
- 쫄깃하다 ("(of food) chewy; springy");
- 고소하다 ("fragrant or tasty as sesame oil");
- 싱겁다 ("bland, not salty"; 싱거워요 singgeowoyo);
- 쌈장 (gochujang and soybean paste);
- 시원하다 ("refreshing; cool"). Wiktionary has no soup sense, see item 11 below.

앞접시 and 바삭하다 have no Wiktionary entries. Everything else is conservative textbook phrasing, but **please check these on Naver Dictionary before they're memorised.** I'm less than sure they're the most natural choice:

1. 이거 할게요 ("I'll have this one"). 이걸로 할게요 or 이거 주세요 may be more natural. Both 이걸로 할게요 and 이거 주세요 are also in the pack.
2. 예약했어요 ("I have a reservation"). People often say 예약했는데요 or give their name.
3. 메뉴 좀 추천해 주세요. Maybe just 추천 좀 해 주세요, or 뭐가 맛있어요?
4. 같은 거 주세요. Maybe 같은 걸로 주세요.
5. 매운 거 못 먹어요. 매운 거 잘 못 먹어요 is softer and probably more common.
6. 이거 뭐 들어가요? / 해산물 들어가요? / 새우 들어가요? ("what's in it?"). Maybe 뭐가 들어가요?, or 해산물 들어 있어요?
7. 이거 먹어 보세요 ("Try this"). Staff would say 드셔 보세요; the Grammar Note mentions it.
8. 음식 나왔어요 ("Here's your food"). Staff usually say 주문하신 음식 나왔습니다.
9. 이거 안 시켰어요 ("We didn't order this"). 이거 안 시켰는데요 is softer.
10. 아직 못 정했어요 ("I haven't decided yet"). Maybe 아직 안 정했어요.
11. 국물이 시원해요. The gloss "a hot soup that is clean-tasting and satisfying" is my reading of the colloquial sense; Wiktionary only gives "refreshing; cool".
12. 이모 as a way to call a woman serving. It's common, but check it's okay for a foreigner to use. 사장님 is the safer option.
13. 계산은 카운터에서 해 주세요 ("Please pay at the counter").
14. 보통으로 주세요 ("Regular, please", meaning a normal size or spice level).
15. 여기서 먹을게요 / 가져갈게요 (eat in / take away). 먹고 갈게요 and 포장해 갈게요 may be more natural.
16. 같이 계산해 주세요 = "one bill" and 따로 계산해 주세요 = "separate bills".
17. 몇 시까지 해요? ("What time are you open until?"). Maybe 몇 시까지 영업해요?
18. 하시겠어요 as a word Item in 주문하시겠어요?, and 드시겠어요. Check the meanings.
19. 여기 맛집이에요 / 한국 식당 좋아해요 / 여기 냉면이 유명해요. These are correct, but check they sound natural.
20. These drop a particle, as speech often does: 냄새 좋아요, 고기 다 익었어요?, 알레르기 있어요, 자리 있어요?
21. Romanisation: 쫄깃해요 jjolgitaeyo and 바삭해요 basakaeyo apply ㅅ/ㄱ+ㅎ aspiration, as RR does for verbs. Wiktionary gives 쫄깃하다 as jjolgithada, so check which you prefer.

**Open, for the user:**
1. Run `npm run audio`, then listen-check a sample of the new clips: the dish names, 몇 분이세요?, 덜 맵게 해 주세요, 잘 먹겠습니다. Then tick the audio box.
2. Check the doubtful list above on Naver Dictionary and fix any Sentence that's wrong. To change a Sentence's text, delete its audio and rerun `npm run audio`. Then tick the dictionary box.
