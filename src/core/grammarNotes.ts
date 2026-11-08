import { listeningCardId, speakingCardId, type Card, type CardGrammarNote } from "./cards";
import type { ContentPack } from "./contentPack";
import type { HistoryEvent } from "./historyLog";

/**
 * When each Grammar Note is shown (spec "Review core").
 *
 * - Every card using a grammar pattern with a note carries that note in
 *   `grammarNotes`, so the learner can reopen it from the card.
 * - A pattern's first appearance is the first card in the queue that uses it
 *   while no card using it has any History Log event yet. That card gets
 *   `noteBeforeCard`, so the note shows before it. Once a card using the
 *   pattern has been graded, the note isn't shown automatically again.
 */
export function withGrammarNotes(cards: readonly Card[], pack: ContentPack, events: readonly HistoryEvent[]): Card[] {
  const notes = cardNotes(pack);
  if (notes.size === 0) return [...cards];

  const seen = new Set(events.map((event) => event.cardId));
  const appeared = new Set<string>();
  for (const s of pack.sentences) {
    if (seen.has(listeningCardId(s.id)) || seen.has(speakingCardId(s.id))) for (const id of s.itemIds) appeared.add(id);
  }

  return cards.map((card) => {
    const used = [...new Set(card.itemIds)].flatMap((id) => notes.get(id) ?? []);
    if (used.length === 0) return card;
    const first = used.find((note) => !appeared.has(note.itemId));
    for (const note of used) appeared.add(note.itemId);
    return { ...card, grammarNotes: used, ...(first ? { noteBeforeCard: first } : {}) };
  });
}

/** Each grammar pattern's note as cards show it, by the pattern's Item ID. */
function cardNotes(pack: ContentPack): Map<string, CardGrammarNote> {
  const items = new Map(pack.items.map((item) => [item.id, item]));
  const notes = new Map<string, CardGrammarNote>();
  for (const note of pack.grammarNotes) {
    const item = items.get(note.itemId);
    if (!item || item.kind !== "grammar") continue;
    notes.set(item.id, {
      itemId: item.id,
      pattern: item.text,
      meaning: item.meaning,
      text: note.text,
      ...(note.example ? { example: note.example } : {}),
    });
  }
  return notes;
}
