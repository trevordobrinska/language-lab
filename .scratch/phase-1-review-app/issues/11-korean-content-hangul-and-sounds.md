# 11: Korean content: Hangul and sound contrasts

**What to build:** The learner's first days teach them to read and hear Korean: every basic Hangul consonant and vowel, how they build syllable blocks, and the plain/tense/aspirated consonant contrasts (such as ㄱ/ㄲ/ㅋ, ㄷ/ㄸ/ㅌ, ㅂ/ㅃ/ㅍ, ㅈ/ㅉ/ㅊ, ㅅ/ㅆ). Every Item has generated audio. It's authored in a Claude Code session, comes first in the introduction order, and passes the content check.

**Blocked by:** 02, 03

**Status:** resolved

- [x] All basic consonants and vowels are Items, with romanisation and audio
- [x] Syllable-block Items show how letters combine
- [x] The sound-contrast Items cover the three-way consonant contrasts
- [x] Audio is generated with the ticket 03 command, and a sample has been listened to (flag any garbled clips for the user)
- [x] The content check passes

## Comments

**Built (agent):** `content/ko/pack.json` now holds 62 Items, all in the introduction order (Hangul is the whole order for now; sentences from 07/12 follow it).

- **40 letters:**
  - The 14 basic consonants, plus the 5 tense doubles ㄲㄸㅃㅆㅉ, which the contrasts need.
  - The 10 basic vowels, plus all 11 compound vowels (ㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ). I judged these basic enough for week 1, because the first sentences need ㅔ/ㅐ/ㅘ/ㅢ (e.g. 주세요, 네). The rare ones (ㅒ, ㅞ) are marked "rare".
- **17 syllables** (new `syllable` kind):
  - CV with the vowel to the right (가 나 머) and below (고 누 소).
  - Silent ㅇ (아 우 와), and a compound vowel (과).
  - CVC with batchim: 산 물 밥 강 국 옷 꽃, which show the final ㄹ=l, ㅂ=p, ㅇ=ng, ㄱ=k, ㅅ/ㅊ=t.
- **5 sound contrasts:** 가·까·카, 다·따·타, 바·빠·파, 자·짜·차, 사·싸.
- **Order:** the six simple vowels, then 10 consonants, then CV blocks, then the y-vowels, aspirated letters, tense letters, the contrasts, the compound vowels, and finally the batchim blocks.
- **IDs:** ticket 01's IDs (`hangul-g/n/m/a/o`) are kept. New letters are `hangul-<RR>`; the others are `syllable-<RR>` and `sound-<plain>-<tense>-<aspirated>`. Romanisation is Revised Romanization; letter meanings give the letter's name in RR.

**Format changes (tested):**

- The `syllable` Item kind needs audio, like `letter` and `sound` (see `AUDIO_ITEM_KINDS` in `src/core/contentPack.ts`). The content check and the audio script both use it.
- There's an optional Item `speech` field: what the audio script says instead of `text`.
  - Consonants say their name plus an example syllable ("기역. 가."; ㅇ says "이응. 아. 앙.").
  - Vowels say the vowel with a silent ㅇ ("아").
  - Contrasts say each syllable in turn ("가. 까. 카.").
  - Syllables need no `speech`, because their text is speakable.
  - Tests are in `scripts/audio/generatePackAudio.test.ts`. `docs/audio-setup.md` step 8 is updated.
- `src/content/packs.test.ts` now allows the contrast cards' "가 · 까 · 카" front text.

**Audio placeholders:** each new Item has a placeholder tone `content/ko/audio/<id>.wav` (8 kHz, 8-bit, 0.4 s, like ticket 01's). `npm run audio` will generate `<id>.mp3`, repoint the pack, and delete the tones.

**Open, for the user (box 4):**

1. Install MeloTTS per `docs/audio-setup.md` (ticket 03), then run `npm run audio`.
2. Listen-check a sample: at least a few consonants (especially ㅇ, ㄹ and a tense one like ㄲ), ㅓ vs ㅗ, ㅡ, ㅢ, a batchim block (옷, 꽃), and all 5 contrasts. The tense/aspirated difference is the point of those clips, so if MeloTTS blurs it, flag it.
3. Fix a garbled clip by editing its `speech`, deleting the mp3, and rerunning.

Also spot-check the Korean against Naver Dictionary if you like: the letter names and the word glosses (나 I, 소 cow, 산 mountain, 물 water, 밥 rice, 강 river, 국 soup, 옷 clothes, 꽃 flower).

- 2026-11-08: User listen-checked the priority clips (5 contrasts, tricky letters, 옷/꽃) and a sample of Sentences: all audible, none garbled. The user is a beginner, so this confirms clarity, not native accuracy. Worth re-listening to the contrast clips against a native reference (e.g. Naver Dictionary pronunciation audio) once the ear has developed; regenerate any that are off by editing `speech` and rerunning `npm run audio`.
