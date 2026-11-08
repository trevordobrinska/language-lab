/**
 * The content pack format: everything the app teaches for one Target
 * Language, as plain data written ahead of time (ADR 0001).
 *
 * The format is language-neutral. Fields a language doesn't need (a script
 * name, romanisation, tone or pitch) are optional. The Korean pack lives at
 * `content/ko/pack.json`; audio paths are relative to the pack's folder.
 */
export interface ContentPack {
  /** BCP 47 language tag of the Target Language, e.g. "ko". */
  readonly language: string;
  /** The Target Language's name in English, e.g. "Korean". */
  readonly name: string;
  /** The writing system taught, if the language has its own, e.g. "Hangul". */
  readonly script?: string;
  readonly items: readonly Item[];
  readonly sentences: readonly Sentence[];
  readonly grammarNotes: readonly GrammarNote[];
  /**
   * The authored introduction order: Item and Sentence IDs, in the order new
   * material is met. Words and grammar patterns aren't listed on their own;
   * they arrive inside the Sentence that introduces them.
   */
  readonly order: readonly string[];
}

/**
 * - `letter`: one letter of the script (a Hangul jamo, a kana).
 * - `sound`: a sound contrast to hear (e.g. Korean plain/tense/aspirated).
 * - `word`: a word or fixed phrase.
 * - `grammar`: a grammar pattern; it can have a Grammar Note.
 */
export type ItemKind = "letter" | "sound" | "word" | "grammar";

export interface Item {
  /** Stable and unique within the pack; it's part of Card IDs in the History Log. */
  readonly id: string;
  readonly kind: ItemKind;
  /** The item as written in the Target Language, e.g. "ㄱ". */
  readonly text: string;
  /** What the learner should recall, in English, e.g. "g / k (giyeok)". */
  readonly meaning: string;
  readonly romanisation?: string;
  /** Tone or pitch-accent marking, for languages that need it. */
  readonly tone?: string;
  /** Audio file path, relative to the pack's folder. Letter and sound Items have one. */
  readonly audio?: string;
  /** IDs of the Missions this item serves, e.g. "market". */
  readonly missions: readonly string[];
}

export interface Sentence {
  readonly id: string;
  /** The sentence as written in the Target Language. */
  readonly text: string;
  /** Its English meaning. */
  readonly meaning: string;
  readonly romanisation?: string;
  readonly tone?: string;
  /** IDs of every Item the sentence uses, including the one it introduces. */
  readonly itemIds: readonly string[];
  /** The one new Item this sentence brings in. */
  readonly introduces: string;
  /** Audio file path, relative to the pack's folder. */
  readonly audio: string;
}

export interface GrammarNote {
  /** The grammar-pattern Item this note explains. */
  readonly itemId: string;
  /** Two or three sentences of explanation. */
  readonly text: string;
  readonly example?: string;
}
