import { describe, expect, it } from "vitest";
import { buildQueue, progress } from "./index";
import { later, letter, packWith, reviewed, sentence, word } from "./testing";

const START = new Date("2026-11-07T08:00:00Z");

const nieun = letter("ko-n", "ㄴ", "n");
const e = letter("ko-e", "ㅔ", "e");
const letters = [nieun, e];

describe("Items learned", () => {
  it("counts an Item once a card introducing it has been graded Good", () => {
    const pack = packWith(letters, []);

    const result = progress({ pack, events: [reviewed("letter:ko-n", "good", START)], now: later(START, 0, 1) });

    expect(result.items).toEqual({ learned: 1, total: 2 });
  });
});

describe("Items learned, through Sentences", () => {
  const ne = word("w-ne", "네", "yes");
  const pack = packWith([...letters, ne], [sentence("s-ne", "네.", "Yes.", ["ko-n", "ko-e", "w-ne"])]);
  const lettersGood = letters.map((l) => reviewed(`letter:${l.id}`, "good", START));

  it("counts a word once the Listening Card of the Sentence introducing it has been graded Good", () => {
    const events = [...lettersGood, reviewed("listening:s-ne", "good", later(START, 0, 1))];

    expect(progress({ pack, events, now: later(START, 0, 2) }).items).toEqual({ learned: 3, total: 3 });
  });

  it("doesn't count a word only failed so far", () => {
    const events = [...lettersGood, reviewed("listening:s-ne", "again", later(START, 0, 1))];

    expect(progress({ pack, events, now: later(START, 0, 2) }).items.learned).toBe(2);
  });

  it("stops counting an Item while it's relearning after a later Again, and counts it again once passed", () => {
    const passed = [...lettersGood, reviewed("listening:s-ne", "good", later(START, 0, 1))];
    const forgotten = [...passed, reviewed("listening:s-ne", "again", later(START, 3))];
    const relearned = [...forgotten, reviewed("listening:s-ne", "good", later(START, 3, 0.2))];

    expect(progress({ pack, events: forgotten, now: later(START, 3, 0.1) }).items.learned).toBe(2);
    expect(progress({ pack, events: relearned, now: later(START, 3, 0.3) }).items.learned).toBe(3);
  });

  it("ignores the Speaking Card when counting Items", () => {
    const events = [...lettersGood, reviewed("speaking:s-ne", "good", later(START, 0, 1))];

    expect(progress({ pack, events, now: later(START, 0, 2) }).items.learned).toBe(2);
  });
});

describe("cards due", () => {
  const many = Array.from({ length: 7 }, (_, n) => letter(`l${n}`, `L${n}`, `meaning ${n}`));
  const pack = packWith(many, []);
  const fiveReviewed = many.slice(0, 5).map((l) => reviewed(`letter:${l.id}`, "good", START));

  it("reports every reviewed card due now, however far over the daily review cap", () => {
    const result = progress({ pack, events: fiveReviewed, now: later(START, 60), settings: { reviewsPerDay: 3 } });

    expect(result.cardsDue).toBe(5);
  });

  it("doesn't count cards not yet due, or never seen", () => {
    expect(progress({ pack, events: fiveReviewed, now: later(START, 0, 1) }).cardsDue).toBe(0);
  });

  it("reports how many cards today's Review will serve, within the caps and including new cards", () => {
    const input = { pack, events: fiveReviewed, now: later(START, 60), settings: { reviewsPerDay: 3, newItemsPerDay: 1 } };

    expect(progress(input).todaysReview).toBe(4);
    expect(progress(input).todaysReview).toBe(buildQueue(input).length);
  });
});

describe("Mission coverage", () => {
  const market = { id: "market", name: "The market shop owner" };
  const restaurant = { id: "restaurant", name: "The restaurant" };
  const ne = word("w-ne", "네", "yes", { missions: ["market", "restaurant"] });
  const eolma = word("w-eolma", "얼마", "how much", { missions: ["market"] });
  const masi = word("w-masi", "맛있어요", "it's tasty", { missions: ["restaurant"] });
  const yo = { ...word("g-yo", "-요", "polite ending"), kind: "grammar" as const, missions: ["market"] };
  const taggedLetter = letter("ko-m", "ㅁ", "m", { missions: ["market"] });
  const pack = packWith(
    [...letters, taggedLetter, ne, eolma, masi, yo],
    [
      sentence("s-ne", "네.", "Yes.", ["w-ne"]),
      sentence("s-eolma", "얼마.", "How much.", ["w-ne", "w-eolma"]),
      sentence("s-masi", "맛있어요.", "Tasty.", ["w-masi"]),
      sentence("s-yo", "네요.", "Yes (polite).", ["w-ne", "g-yo"]),
    ],
    { missions: [market, restaurant] },
  );

  it("counts Mission 1's word Items learned, out of all its word Items", () => {
    const events = [
      reviewed("listening:s-ne", "good", START),
      reviewed("listening:s-masi", "good", START),
      reviewed("listening:s-yo", "good", START),
      reviewed("letter:ko-m", "good", START),
    ];

    expect(progress({ pack, events, now: later(START, 0, 1) }).mission).toEqual({
      id: "market",
      name: "The market shop owner",
      learned: 1,
      total: 2,
    });
  });

  it("is absent when the pack has no Missions", () => {
    expect(progress({ pack: { ...pack, missions: undefined }, events: [], now: START }).mission).toBeUndefined();
  });
});

describe("Sentences learned", () => {
  const ne = word("w-ne", "네", "yes");
  const sNe = sentence("s-ne", "네.", "Yes.", ["ko-n", "ko-e", "w-ne"]);
  const sNeNe = sentence("s-nene", "네, 네.", "Yes, yes.", ["ko-n", "ko-e", "w-ne"]);
  const pack = packWith([...letters, ne], [sNe, sNeNe]);

  it("counts a Sentence once its Listening Card's latest grade is Good", () => {
    const events = [reviewed("listening:s-ne", "good", START), reviewed("listening:s-nene", "again", START)];

    expect(progress({ pack, events, now: later(START, 0, 1) }).sentences).toEqual({ learned: 1, total: 2 });
  });
});
