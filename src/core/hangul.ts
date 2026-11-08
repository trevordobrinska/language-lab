/**
 * Hangul syllable decomposition, for the content check's letter rule. Pure.
 *
 * A precomposed syllable (U+AC00–U+D7A3) is split arithmetically into its
 * lead consonant, vowel and optional final, each returned as a compatibility
 * jamo (the letters a pack's letter Items are written with, e.g. "ㄱ").
 */

const FIRST_SYLLABLE = 0xac00;
const LAST_SYLLABLE = 0xd7a3;
const LEADS = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"];
const VOWELS = [..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"];
/** Index 0 is "no final". */
const FINALS = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

/** The letters a compound letter is built from, for packs that don't teach the compound as its own letter. */
const COMPONENTS: Readonly<Record<string, string>> = {
  ㄳ: "ㄱㅅ", ㄵ: "ㄴㅈ", ㄶ: "ㄴㅎ", ㄺ: "ㄹㄱ", ㄻ: "ㄹㅁ", ㄼ: "ㄹㅂ", ㄽ: "ㄹㅅ", ㄾ: "ㄹㅌ", ㄿ: "ㄹㅍ", ㅀ: "ㄹㅎ", ㅄ: "ㅂㅅ",
  ㅘ: "ㅗㅏ", ㅙ: "ㅗㅐ", ㅚ: "ㅗㅣ", ㅝ: "ㅜㅓ", ㅞ: "ㅜㅔ", ㅟ: "ㅜㅣ", ㅢ: "ㅡㅣ",
};

/** Every jamo in the text's Hangul syllables, in reading order. Anything that isn't a precomposed syllable is skipped. */
export function hangulJamo(text: string): string[] {
  const jamo: string[] = [];
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code < FIRST_SYLLABLE || code > LAST_SYLLABLE) continue;
    const index = code - FIRST_SYLLABLE;
    jamo.push(LEADS[Math.floor(index / 588)], VOWELS[Math.floor((index % 588) / 28)]);
    const final = FINALS[index % 28];
    if (final) jamo.push(final);
  }
  return jamo;
}

/**
 * Maps one jamo to the letters a pack teaches: itself if the pack has a letter
 * for it, otherwise its components (a compound final such as ㅄ becomes ㅂ, ㅅ).
 * Returns undefined if neither the jamo nor its components are taught.
 */
export function taughtLetters(jamo: string, isTaught: (letter: string) => boolean): string[] | undefined {
  if (isTaught(jamo)) return [jamo];
  const parts = COMPONENTS[jamo];
  if (!parts) return undefined;
  const letters = [...parts].map((part) => taughtLetters(part, isTaught));
  return letters.every((l) => l !== undefined) ? letters.flat() : undefined;
}
