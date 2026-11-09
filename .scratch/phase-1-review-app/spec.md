# Phase 1: Review app with Korean starter content

Status: built

## Problem Statement

I want to reach CEFR B1 speaking and listening in Korean, then Japanese, Mandarin, Spanish and Polish, using only methods research shows work, and I won't spend extra money doing it. I have no tool yet that does daily spaced Review built exactly the way I want: whole-sentence cards with native-style audio, recall before reveal, an order built around my Korean Missions (food and culture, starting with the market shop owner), and no streaks or gamification that work against learning. Until Review exists I can't start the daily habit the rest of the platform depends on.

## Solution

A web app I add to my iPhone home screen. It works offline and gives me a daily Review of about 10 minutes, wherever I am. It starts by teaching Hangul and Korean sounds, then brings in the first ~300 words, chosen for the market and restaurant, as whole sentences with audio. Each sentence is first a Listening Card (hear the Korean, recall the meaning). Once I've passed that a few times it also becomes a Speaking Card (see the English, say the Korean aloud, reveal, grade myself). FSRS decides when each card comes back, aiming for 90% recall. Daily caps stop the queue from becoming overwhelming after missed days, and the cards I'm closest to forgetting come first. Every review is written to an add-only History Log that syncs through a private GitHub repo, so my history is never lost and the PC can read it in later phases. The app makes no AI calls (ADR 0001). All Korean content and audio are written and generated ahead of time on the PC.

## User Stories

### Getting started

1. As a learner, I want to open the app from my iPhone home screen like a normal app, so that starting a Review is one tap.
2. As a learner, I want the app to work fully offline once installed, so that I can do Review anywhere, including with no signal.
3. As a learner, I want Korean to be the Active Language without any setup, so that I can start right away.
4. As a learner, I want a short first-run screen explaining how Review works (recall first, then reveal, then grade myself honestly), so that I use it the way the research intends.
5. As a learner, I want to paste a GitHub access token into settings once, so that my History Log starts syncing without logging in again.
6. As a learner, I want the app to work even if I haven't set up sync yet, so that setup never blocks studying.

### Hangul and sounds

7. As a learner, I want my first days to teach Hangul letters and how they combine into syllable blocks, so that I can read Korean before I meet whole sentences.
8. As a learner, I want every Hangul card to play the sound, so that I tie each letter to how it sounds, not to an English spelling.
9. As a learner, I want romanisation shown only during my first week, so that it helps me start without becoming a crutch that shapes my pronunciation.
10. As a learner, I want romanisation to disappear automatically after week 1, so that I don't have to remember to turn it off.
11. As a learner, I want sound cards for the hard Korean contrasts (plain, tense and aspirated consonants, such as ㄱ/ㄲ/ㅋ), so that I learn to hear differences English doesn't have.
12. As a learner, I want sentences to start only once I've met enough Hangul to read them, so that I'm never shown a sentence I can't decode.

### Sentence cards

13. As a learner, I want every new word to arrive inside a whole sentence, so that I learn it in a real context.
14. As a learner, I want each new sentence to bring in exactly one new item, so that I can always understand the sentence and work out the new piece.
15. As a learner, I want new material ordered so that what I need for the market Mission comes first, so that my first real conversation comes sooner.
16. As a learner, I want my first ~300 words to cover greetings, numbers and prices, food words and basic small talk, so that I can handle the market and the restaurant.
17. As a learner, I want a Listening Card that plays the sentence audio and lets me recall the meaning before I reveal it, so that I practise recognition through retrieval.
18. As a learner, I want to replay the audio as often as I like before revealing, so that I can listen closely.
19. As a learner, I want the reveal to show the Hangul, the English meaning and the new item highlighted, so that I can check exactly what I missed.
20. As a learner, I want a Speaking Card that shows the English and asks me to say the Korean aloud before revealing, so that I practise producing Korean, which conversation needs.
21. As a learner, I want the Speaking Card's reveal to play the native audio, so that I can compare it with what I said.
22. As a learner, I want a sentence's Speaking Card to unlock only after I've passed its Listening Card a few times, so that I recognise something before I'm asked to produce it.
23. As a learner, I want a short Grammar Note the first time a grammar pattern appears, so that I understand the rule right when I need it.
24. As a learner, I want to reopen a card's Grammar Note later, so that I can refresh a rule I've half forgotten.

### Grading and scheduling

25. As a learner, I want to grade each card myself after the reveal, so that recall stays effortful and honest without speech recognition on the phone.
26. As a learner, I want only a few large grade buttons, so that grading is quick and works one-handed.
27. As a learner, I want FSRS to schedule each card for when I'm about to forget it, so that I spend the least time for the most remembered.
28. As a learner, I want the target recall to be 90%, so that I get the standard balance between effort and remembering.
29. As a learner, I want cards I fail to come back soon in the same Review, so that I fix mistakes while they're fresh.
30. As a learner, I want new material and reviews mixed in one queue, so that each Review interleaves old and new.

### Missed days

31. As a learner, I want a daily cap on new items, so that new material never piles up even if I study a lot one day.
32. As a learner, I want a daily cap on reviews, with leftover cards rolling over to the next day, so that coming back after missed days is never a 300-card wall.
33. As a learner, I want overdue cards ordered by how close I am to forgetting them, so that limited time goes to the cards most at risk.
34. As a learner, I want to change the daily caps in settings, so that I can match them to my week.
35. As a learner, I want no streak counter or guilt messages, so that a missed day doesn't make me want to quit.

### Progress

36. As a learner, I want to see how many items and sentences I've learned, and how many cards are due, so that I know where I stand.
37. As a learner, I want to see my progress toward the market Mission's vocabulary, so that the Mission feels within reach.
38. As a learner, I want progress shown in terms of learning, not points or badges, so that the app rewards what matters.

### Sync and safety of my history

39. As a learner, I want every review saved on my phone the moment I grade it, so that closing the app mid-Review loses nothing.
40. As a learner, I want my History Log to sync to a private GitHub repo whenever I'm online, so that my progress survives losing or resetting my phone.
41. As a learner, I want sync to happen in the background without blocking Review, so that a bad connection never interrupts studying.
42. As a learner, I want to see when the last sync succeeded, so that I know my history is backed up.
43. As a learner, I want history from another device (for example, Review in my PC browser) merged without conflicts, so that I can study anywhere.
44. As a learner, I want my schedule calculated from the full History Log, so that a merge always gives the same result no matter which device synced first.
45. As a learner, I want the access token limited to my one private data repo, so that a leaked token can't touch anything else.
46. As a learner, I want Language Lab's stored data named separately from the kids' Arcade games on the same domain, so that neither can overwrite the other.

### Content authoring (Claude Code sessions on the PC)

47. As the content author, I want Korean content kept as structured data files (Items, Sentences, Grammar Notes, Mission tags), so that it can be checked, versioned and extended in later Claude Code sessions.
48. As the content author, I want a content check that fails if a sentence brings in more than one new item, uses an item that isn't defined, or is missing audio, so that bad content never reaches the phone.
49. As the content author, I want a script that generates every sentence and Hangul audio file with MeloTTS on the PC, so that audio costs nothing and needs no internet.
50. As the content author, I want audio generation to skip files that already exist, so that adding content only generates what's new.
51. As the learner, I want to listen-check a sample of the generated audio before it ships, so that a garbled clip doesn't teach me the wrong sound.
52. As the content author, I want the content format to work for any Target Language, so that Japanese, Mandarin, Spanish and Polish can be added without redesigning it.

### Publishing

53. As a learner, I want the app published on GitHub Pages under the Language Lab path on my existing domain, so that hosting costs nothing.
54. As a learner, I want an updated app version to install itself the next time I open it, so that new content arrives without reinstalling.

## Implementation Decisions

### Modules

- **Review core** (the main test seam). Pure and deterministic, with no UI, storage or network inside it. Its interface is roughly:
  - it takes the content pack, the History Log events, the current time and settings, and returns today's queue (an ordered list of cards to show, each with what to show before and after the reveal);
  - grading a card returns a new History Log event;
  - it also answers progress questions (items learned, cards due, Mission coverage).

  All scheduling state comes from replaying the History Log through FSRS. No schedule is stored anywhere.

  It owns:
  - new-material ordering: Hangul and sounds first; sentences become eligible only when all but one of their items are known and their Hangul has been met; within those, Mission 1 items come first, then the authored order;
  - the Speaking Card unlock;
  - the week-1 romanisation rule, with week 1 counted from the first History Log event;
  - the daily caps and rollover;
  - ordering overdue cards by forgetting risk;
  - when each Grammar Note is shown.
- **Scheduler adapter.** A thin wrapper around `ts-fsrs` inside the Review core, with target recall 0.9 and default FSRS parameters. Nothing outside the core touches `ts-fsrs` directly.
- **History Log store.** An add-only event list kept on the device, in browser storage named with a `language-lab` prefix.
- **History Log merge** (second test seam). A pure join of event sets, with duplicates removed by event ID. Merging is order-independent and harmless to repeat.
- **GitHub sync adapter.** Sits behind a small remote-log interface that has an in-memory fake for tests. To avoid write conflicts entirely, each device writes **only its own** log file(s) in the private data repo. Reading means fetching every device's files and merging them. It uses the GitHub contents API with a fine-grained personal access token limited to the one private data repo (contents read/write), stored on the device.
- **Content pack** (Korean). Structured data, defined as:
  - **Items**: a Hangul letter, a sound contrast, a word, or a grammar pattern, each with Mission tags.
  - **Sentences**: Hangul text, English meaning, romanisation, the IDs of the items they use, the one item they introduce, and a reference to their audio.
  - **Grammar Notes**: attached to grammar-pattern Items.
  - **Introduction order**, as authored.

  The format is language-neutral: script, romanisation and tone or pitch fields are all optional per language.
- **Content check** (third test seam). Runs over a content pack and fails on any of these:
  - a sentence that introduces anything other than exactly one new item at its point in the order;
  - an item ID used but never defined;
  - a missing audio file;
  - a Grammar Note pointing at an item that isn't a grammar pattern.
- **Audio generation script.** Runs MeloTTS (Korean) on the PC's CPU and makes one compressed audio file per Sentence and per Hangul or sound Item. It's incremental: files that already exist are skipped. It never runs in the phone app.
- **Phone app shell.** TypeScript + Vite, no framework, the same stack as Doodle Monsters and Secret Script Studio. An installable home-screen web app with a service worker that caches the app, content and audio for offline use. Screens: today's Review, the card front and reveal, the Grammar Note view, progress, and settings (daily caps, sync token, last sync time). Grade buttons are large and usable one-handed.

### Decisions

- **Two grades: Again and Good.** Self-grading after recalling aloud is a pass/fail judgement, and FSRS handles binary grades well. Fewer buttons means faster, more consistent grading. (This was assumed when writing the spec. Revisit before implementation if you want four grades.)
- **Speaking Card unlock:** after the Listening Card has been graded Good on two separate days.
- **Default daily caps:** 15 new items and 150 reviews, both adjustable.
- **Failed cards** come back later in the same Review (FSRS relearning steps).
- **Romanisation** shows on cards during the first 7 days from the first History Log event, then never again.
- **History Log event shape:** a unique event ID, the device ID, a timestamp, the event type (card reviewed with its grade, or card first introduced), and the card ID. Events are never edited or deleted.
- **Starter content scope:**
  - all basic Hangul letters and syllable-block construction;
  - the plain/tense/aspirated consonant contrasts;
  - about 300 word Items chosen for Mission 1 (the market) and Mission 2 (the restaurant): greetings and politeness, numbers (both number systems, as prices and quantities need), prices, food and ingredients, asking what something is and how it's cooked, and small talk about where you're from and liking Korean food;
  - the grammar patterns those sentences need, each with a Grammar Note;
  - all sentences in polite speech (해요체), the right level for a shop owner.
- **Content and audio are written ahead of time** by Claude Code sessions and committed (ADR 0001). The app makes no AI calls at runtime.
- **Hosting:** the app repo is public and published on GitHub Pages at the Language Lab path of the user's GitHub Pages domain. The History Log lives in a separate **private** data repo (ADR 0003).
- **Storage naming:** every storage name the app creates starts with `language-lab`, because the domain is shared with the Arcade games.

## Testing Decisions

- **What makes a good test here:** tests go through each seam's public interface and assert behaviour the learner would notice: what's in today's queue and in what order, when a card comes back, when a Speaking Card appears, whether romanisation shows. They never assert internal FSRS fields or how a function is built inside. The Review core is pure, and the clock is passed in as an argument, so tests can simulate weeks of study by creating History Log events at chosen times.
- **Review core tests** cover:
  - Hangul comes before sentences;
  - the one-new-item eligibility rule;
  - Mission 1 items jump the queue;
  - the Speaking Card unlocks after two Good days;
  - romanisation shows on days 1–7 and not on day 8;
  - the new-item and review caps, and rollover after missed days;
  - overdue cards come out in forgetting-risk order;
  - a failed card comes back in the same Review;
  - a Grammar Note shows on first appearance only;
  - the progress counts are correct.
- **History Log merge tests** cover:
  - merging is order-independent: A+B equals B+A;
  - merging twice changes nothing;
  - duplicates are removed by event ID;
  - two devices' logs merge into the same schedule as one combined log.
- **Sync adapter tests:** run against the in-memory fake remote. They check that a device writes only its own files, reads and merges the others, and that a failed request leaves the local log intact and gets retried later.
- **Content check:** runs on the real Korean content pack as part of the normal test run, so bad content fails the build. It also gets small fixture packs proving it catches each kind of error.
- **Not automated:** the phone UI, the service worker and offline behaviour, and audio quality. These are checked by hand on the iPhone, including installing to the home screen and running a Review in airplane mode.
- **Prior art:** Doodle Monsters keeps a pure game core under its source tree with Vitest tests beside each module, such as round, catch and habitats. The Review core follows that same shape.

## Out of Scope

- Commute Lessons and the podcast feed (Phase 2, ADR 0002).
- Study Sessions, graded stories, Conversation Practice, and the Whisper and Claude bridge on the PC (Phase 3).
- Checkpoints and Record and Compare (Phase 4).
- Any speech recognition or pronunciation scoring on the phone.
- Missions 3 and 4 content (the cooking video and the culture chat), and any vocabulary past the starter ~300 words.
- Any Target Language other than Korean, apart from keeping the content format language-neutral.
- Maintained Language behaviour (switching the Active Language).
- Streaks, points, badges or notifications.
- Accounts or logins beyond the one sync token.

## Further Notes

- **Evidence behind Phase 1:** spaced retrieval practice and FSRS scheduling (strong); interleaved review (strong); explicit Grammar Notes followed by practice (strong; Norris & Ortega 2000, Spada & Tomita 2010); recognition before production (part of the "speak early vs. silent period" debate, so promising); dropping romanisation after week 1 (promising). Each Method should carry its Evidence Tier and citation wherever the app explains itself.
- **Steps only you can take:** creating the GitHub remote for the app repo and turning on Pages; creating the private data repo and a fine-grained token limited to it; installing MeloTTS on the PC; and the listen-check of generated audio. These are good candidates for `/wizard`.
- **Korean accuracy:** Claude writes the Korean. Spot-check sentences against a dictionary (e.g. Naver Dictionary, which is free) during authoring, because a natural-sounding but wrong sentence is costly once memorised.
- **iOS storage:** home-screen web apps on iOS are usually exempt from Safari's 7-day storage purge, but sync is the real backup. Don't rely on the device keeping the only copy.
- **Romanisation in data:** sentences carry their romanisation even though it's only shown in week 1, so the content check can verify it and later languages (Mandarin pinyin) can use the same field.

## Comments

**2026-11-09 (close-out):** Built. Tickets 01–15 done (15 waits only on a few days of real use to check caps and Progress); `npm test` (110), typecheck and build pass; live at https://trevordobrinska.github.io/language-lab/ and installed on the iPhone.
