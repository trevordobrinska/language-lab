import { describe, expect, it } from "vitest";
import { checkContentPack, type ContentPack, type Item, type Sentence } from ".";
import { letter, packOf } from "./testing";

const everyFileExists = () => true;

describe("the content check", () => {
  it("passes a well-formed pack", () => {
    const pack = packOf([letter("g", "ㄱ", "g"), letter("a", "ㅏ", "a")]);

    expect(checkContentPack(pack, everyFileExists)).toEqual([]);
  });

  it("names a Sentence that uses an Item ID that is never defined", () => {
    const pack = withSentences(packOf([letter("g", "ㄱ", "g")]), [
      sentence("s1", { itemIds: ["g", "ga"], introduces: "ga" }),
    ]);

    expect(checkContentPack(pack, everyFileExists)).toEqual([
      'Sentence "s1" uses Item "ga", which is not defined',
      'Sentence "s1" introduces Item "ga", which is not defined',
    ]);
  });

  it("names an introduction-order entry that is neither an Item nor a Sentence", () => {
    const pack = { ...packOf([letter("g", "ㄱ", "g")]), order: ["g", "hangul-q"] };

    expect(checkContentPack(pack, everyFileExists)).toEqual([
      'The introduction order lists "hangul-q", which is not a defined Item or Sentence',
    ]);
  });

  it("names a Grammar Note whose Item is never defined", () => {
    const pack = { ...packOf([letter("g", "ㄱ", "g")]), grammarNotes: [{ itemId: "yo-ending", text: "Polite ending." }] };

    expect(checkContentPack(pack, everyFileExists)).toEqual([
      'The Grammar Note for Item "yo-ending" points at an Item that is not defined',
    ]);
  });

  it("names a Grammar Note that points at an Item that isn't a grammar pattern", () => {
    const pack = { ...packOf([letter("g", "ㄱ", "g")]), grammarNotes: [{ itemId: "g", text: "Not grammar." }] };

    expect(checkContentPack(pack, everyFileExists)).toEqual([
      'The Grammar Note for Item "g" points at a letter Item, not a grammar pattern',
    ]);
  });

  it("names an Item or Sentence whose audio file is missing", () => {
    const pack = {
      ...withSentences(packOf([letter("g", "ㄱ", "g")]), [sentence("s1", { itemIds: ["gae"], introduces: "gae" })]),
      items: [letter("g", "ㄱ", "g"), word("gae", "개", "dog")],
    };
    const onlyG = (path: string) => path === "audio/g.wav";

    expect(checkContentPack(pack, onlyG)).toEqual([
      'Item "gae" has audio "audio/gae.wav", but the file is missing',
      'Sentence "s1" has audio "audio/s1.wav", but the file is missing',
    ]);
  });

  it("names a letter, syllable or sound Item that has no audio at all", () => {
    const pack = packOf([
      letter("g", "ㄱ", "g", { audio: undefined }),
      letter("san", "산", "san", { kind: "syllable", audio: undefined }),
      { ...letter("tense", "ㄲ", "kk"), kind: "sound", audio: undefined },
    ]);

    expect(checkContentPack(pack, everyFileExists)).toEqual([
      'Item "g" is a letter Item with no audio',
      'Item "san" is a syllable Item with no audio',
      'Item "tense" is a sound Item with no audio',
    ]);
  });

  describe("at each Sentence's point in the introduction order", () => {
    const letters = [letter("g", "ㄱ", "g"), letter("a", "ㅏ", "a")];
    const words = [word("gae", "개", "dog"), word("ga", "가", "go"), word("yo", "요", "polite ending")];
    /** Letters first, then the Sentences; words arrive only inside Sentences. */
    const lettersThenSentences = (sentences: readonly Sentence[]): ContentPack => ({
      ...withSentences(packOf(letters), sentences),
      items: [...letters, ...words],
    });

    it("passes Sentences that each bring in exactly one new Item", () => {
      const pack = lettersThenSentences([
        sentence("s1", { itemIds: ["g", "gae"], introduces: "gae" }),
        sentence("s2", { itemIds: ["gae", "ga"], introduces: "ga" }),
      ]);

      expect(checkContentPack(pack, everyFileExists)).toEqual([]);
    });

    it("names a Sentence that brings in two new Items", () => {
      const pack = lettersThenSentences([
        sentence("s1", { itemIds: ["gae", "yo"], introduces: "gae" }),
      ]);

      expect(checkContentPack(pack, everyFileExists)).toEqual([
        'Sentence "s1" brings in 2 new Items ("gae", "yo"); it must bring in exactly one',
      ]);
    });

    it("names a Sentence that brings in no new Item", () => {
      const pack = lettersThenSentences([
        sentence("s1", { itemIds: ["gae"], introduces: "gae" }),
        sentence("s2", { itemIds: ["g", "gae"], introduces: "gae" }),
      ]);

      expect(checkContentPack(pack, everyFileExists)).toEqual([
        'Sentence "s2" brings in no new Item; it must bring in exactly one ("gae" was already introduced)',
      ]);
    });

    it("names a Sentence whose one new Item isn't the one it says it introduces", () => {
      const pack = lettersThenSentences([sentence("s1", { itemIds: ["g", "gae"], introduces: "ga" })]);

      expect(checkContentPack(pack, everyFileExists)).toEqual([
        'Sentence "s1" brings in "gae", but says it introduces "ga"',
      ]);
    });

    it("names a Sentence that isn't in the introduction order", () => {
      const pack = { ...lettersThenSentences([]), sentences: [sentence("s1", { itemIds: ["gae"], introduces: "gae" })] };

      expect(checkContentPack(pack, everyFileExists)).toEqual([
        'Sentence "s1" is not in the introduction order',
      ]);
    });
  });
});

function word(id: string, text: string, meaning: string): Item {
  return { id, kind: "word", text, meaning, audio: `audio/${id}.wav`, missions: [] };
}

function sentence(id: string, fields: Partial<Sentence> & Pick<Sentence, "itemIds" | "introduces">): Sentence {
  return { id, text: id, meaning: id, audio: `audio/${id}.wav`, ...fields };
}

/** Adds Sentences to a pack, appending them to the introduction order. */
function withSentences(pack: ContentPack, sentences: readonly Sentence[]): ContentPack {
  return { ...pack, sentences, order: [...pack.order, ...sentences.map((s) => s.id)] };
}
