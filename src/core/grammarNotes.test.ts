import { describe, expect, it } from "vitest";
import { buildQueue, type Card, type GrammarNote, type HistoryEvent, type Item } from "./index";
import { later, letter, packWith, reviewed, sentence, word } from "./testing";

const START = new Date("2026-11-07T08:00:00Z");

const ieung = letter("ko-ng", "ㅇ", "silent / ng");
const i = letter("ko-i", "ㅣ", "i");
const g = letter("ko-g", "ㄱ", "g / k");
const eo = letter("ko-eo", "ㅓ", "eo");
const j = letter("ko-j", "ㅈ", "j");
const u = letter("ko-u", "ㅜ", "u");
const s = letter("ko-s", "ㅅ", "s");
const e = letter("ko-e", "ㅔ", "e");
const yo = letter("ko-yo", "ㅛ", "yo");
const m = letter("ko-m", "ㅁ", "m");
const r = letter("ko-r", "ㄹ", "r / l");
const letters = [ieung, i, g, eo, j, u, s, e, yo, m, r];

const igeo = word("w-igeo", "이거", "this");
const mul = word("w-mul", "물", "water");
const juseyo: Item = { id: "g-juseyo", kind: "grammar", text: "주세요", meaning: "please give me", missions: [] };
const note: GrammarNote = {
  itemId: "g-juseyo",
  text: "Put 주세요 after a thing to ask for it politely.",
  example: "물 주세요. = Water, please.",
};

const sIgeo = sentence("s-igeo", "이거.", "This.", ["ko-ng", "ko-i", "ko-g", "ko-eo", "w-igeo"]);
const sIgeoJuseyo = sentence("s-igeo-juseyo", "이거 주세요.", "This, please.", ["ko-ng", "ko-i", "ko-g", "ko-eo", "ko-j", "ko-u", "ko-s", "ko-e", "ko-yo", "w-igeo", "g-juseyo"]);
const sMulJuseyo = sentence("s-mul-juseyo", "물 주세요.", "Water, please.", ["ko-m", "ko-u", "ko-r", "ko-j", "ko-s", "ko-e", "ko-ng", "ko-yo", "g-juseyo", "w-mul"]);

const pack = packWith([...letters, igeo, mul, juseyo], [sIgeo, sIgeoJuseyo, sMulJuseyo], { grammarNotes: [note] });

const lettersMet = (at: Date): HistoryEvent[] => letters.map((l) => reviewed(`letter:${l.id}`, "good", at));
const card = (queue: Card[], id: string) => queue.find((c) => c.id === id);
const expectedNote = { itemId: "g-juseyo", pattern: "주세요", meaning: "please give me", text: note.text, example: note.example };

describe("Grammar Notes", () => {
  it("are shown before the card on the pattern's first appearance", () => {
    const events = [...lettersMet(START), reviewed("listening:s-igeo", "good", START)];

    const queue = buildQueue({ pack, events, now: later(START, 0, 1) });

    expect(card(queue, "listening:s-igeo-juseyo")?.noteBeforeCard).toEqual(expectedNote);
  });

  it("are shown before only the first card using the pattern, even when a second follows in the same queue", () => {
    const events = [...lettersMet(START), reviewed("listening:s-igeo", "good", START)];

    const queue = buildQueue({ pack, events, now: later(START, 0, 1), settings: { newItemsPerDay: 100 } });

    expect(card(queue, "listening:s-mul-juseyo")).toBeDefined();
    expect(card(queue, "listening:s-mul-juseyo")?.noteBeforeCard).toBeUndefined();
  });

  it("aren't shown automatically again once the pattern has appeared", () => {
    const events = [
      ...lettersMet(START),
      reviewed("listening:s-igeo", "good", START),
      reviewed("listening:s-igeo-juseyo", "good", later(START, 0, 1)),
    ];

    for (const day of [0, 1, 2, 5]) {
      const queue = buildQueue({ pack, events, now: later(START, day, 2), settings: { newItemsPerDay: 100 } });
      for (const c of queue) expect(c.noteBeforeCard).toBeUndefined();
    }
  });

  it("can be reopened from any card that uses the pattern", () => {
    const events = [
      ...lettersMet(START),
      reviewed("listening:s-igeo", "good", START),
      reviewed("listening:s-igeo-juseyo", "good", later(START, 0, 1)),
      reviewed("listening:s-igeo-juseyo", "good", later(START, 1)),
    ];

    const queue = buildQueue({ pack, events, now: later(START, 60), settings: { newItemsPerDay: 100 } });

    expect(card(queue, "listening:s-igeo-juseyo")?.grammarNotes).toEqual([expectedNote]);
    expect(card(queue, "speaking:s-igeo-juseyo")?.grammarNotes).toEqual([expectedNote]);
    expect(card(queue, "listening:s-mul-juseyo")?.grammarNotes).toEqual([expectedNote]);
  });

  it("are absent from cards that use no pattern with a note", () => {
    const queue = buildQueue({ pack, events: lettersMet(START), now: later(START, 0, 1) });

    expect(card(queue, "listening:s-igeo")?.grammarNotes).toBeUndefined();
    expect(card(queue, "listening:s-igeo")?.noteBeforeCard).toBeUndefined();
  });
});
