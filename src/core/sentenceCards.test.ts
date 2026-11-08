import { describe, expect, it } from "vitest";
import { buildQueue, type Card, type HistoryEvent } from "./index";
import { later, letter, packWith, reviewed, sentence, word } from "./testing";

const START = new Date("2026-11-07T08:00:00Z");

// Letters for 네 ("yes") and 아니요 ("no").
const nieun = letter("ko-n", "ㄴ", "n");
const e = letter("ko-e", "ㅔ", "e");
const ieung = letter("ko-ng", "ㅇ", "silent / ng");
const a = letter("ko-a", "ㅏ", "a");
const i = letter("ko-i", "ㅣ", "i");
const yo = letter("ko-yo", "ㅛ", "yo");
const letters = [nieun, e, ieung, a, i, yo];
const lettersMet = (at: Date): HistoryEvent[] => letters.map((l) => reviewed(`letter:${l.id}`, "good", at));

const ne = word("w-ne", "네", "yes");
const aniyo = word("w-aniyo", "아니요", "no");
const sNe = sentence("s-ne", "네.", "Yes.", ["ko-n", "ko-e", "w-ne"]);

const ids = (queue: Card[]) => queue.map((card) => card.id);

describe("Listening Cards", () => {
  it("once the letters are met, a new Sentence arrives as a Listening Card: audio first, then Hangul, English and the new Item", () => {
    const pack = packWith([...letters, ne], [sNe]);

    const queue = buildQueue({ pack, events: lettersMet(START), now: later(START, 0, 1) });

    expect(queue).toContainEqual(
      expect.objectContaining({
        id: "listening:s-ne",
        kind: "listening",
        front: { audio: "audio/s-ne.wav" },
        back: { text: "네.", meaning: "Yes.", newItem: { text: "네", meaning: "yes" } },
      }),
    );
  });
});

describe("introducing Sentences", () => {
  it("shows every Hangul letter before any Sentence", () => {
    const pack = packWith([...letters, ne], [sNe]);

    const queue = buildQueue({ pack, events: [], now: START });

    expect(ids(queue)).toEqual([...letters.map((l) => `letter:${l.id}`), "listening:s-ne"]);
  });

  it("never introduces a Sentence whose Hangul hasn't been met", () => {
    const pack = packWith([...letters, ne], [sNe]);
    const allButE = letters.filter((l) => l !== e).map((l) => reviewed(`letter:${l.id}`, "good", START));
    // ㅔ is defined but left out of the order, so the learner never meets it.
    const withoutE = { ...pack, order: pack.order.filter((id) => id !== e.id) };

    const queue = buildQueue({ pack: withoutE, events: allButE, now: later(START, 0, 1) });

    expect(ids(queue)).not.toContain("listening:s-ne");
  });

  it("never introduces a Sentence with two unknown Items", () => {
    const sNeAniyo = sentence("s-ne-aniyo", "네, 아니요.", "Yes, no.", [...letters.map((l) => l.id), "w-ne", "w-aniyo"]);
    const pack = packWith([...letters, ne, aniyo], [sNeAniyo]);

    const queue = buildQueue({ pack, events: lettersMet(START), now: later(START, 0, 1) });

    expect(ids(queue)).not.toContain("listening:s-ne-aniyo");
  });

  it("introduces a Sentence once all but one of its Items are known", () => {
    const sAniyo = sentence("s-aniyo", "아니요.", "No.", ["ko-ng", "ko-a", "ko-n", "ko-i", "ko-yo", "w-aniyo"]);
    const sNeAniyo = sentence("s-ne-aniyo", "네, 아니요.", "Yes, no.", [...letters.map((l) => l.id), "w-aniyo", "w-ne"]);
    const pack = packWith([...letters, ne, aniyo], [sAniyo, sNeAniyo]);
    const events = [...lettersMet(START), reviewed("listening:s-aniyo", "good", START)];

    const queue = buildQueue({ pack, events, now: later(START, 0, 1) });

    expect(ids(queue)).toContain("listening:s-ne-aniyo");
  });

  it("introduces an eligible Mission 1 Sentence before an eligible Sentence that isn't tagged for a Mission", () => {
    const eolma = word("w-eolma", "얼마", "how much", { missions: ["market"] });
    const sAniyo = sentence("s-aniyo", "아니요.", "No.", ["ko-ng", "ko-a", "ko-n", "ko-i", "ko-yo", "w-aniyo"]);
    const sEolma = sentence("s-eolma", "얼마?", "How much?", ["ko-ng", "ko-a", "w-eolma"]);
    const pack = packWith([...letters, ne, aniyo, eolma], [sNe, sAniyo, sEolma], {
      missions: [
        { id: "market", name: "Chat with the market shop owner" },
        { id: "restaurant", name: "Order at a restaurant" },
      ],
    });

    const queue = buildQueue({ pack, events: lettersMet(START), now: later(START, 0, 1) });

    expect(ids(queue)).toEqual(["listening:s-eolma", "listening:s-ne", "listening:s-aniyo"]);
  });

  it("puts a Mission 2 Sentence in the authored order, not ahead of untagged ones", () => {
    const eolma = word("w-eolma", "얼마", "how much", { missions: ["restaurant"] });
    const sEolma = sentence("s-eolma", "얼마?", "How much?", ["ko-ng", "ko-a", "w-eolma"]);
    const pack = packWith([...letters, ne, eolma], [sNe, sEolma], {
      missions: [
        { id: "market", name: "Chat with the market shop owner" },
        { id: "restaurant", name: "Order at a restaurant" },
      ],
    });

    const queue = buildQueue({ pack, events: lettersMet(START), now: later(START, 0, 1) });

    expect(ids(queue)).toEqual(["listening:s-ne", "listening:s-eolma"]);
  });
});
