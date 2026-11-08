import { isLetterOrSound, letterCard, letterCardId, listeningCard, listeningCardId, type Card } from "./cards";
import type { ContentPack, Item, Sentence } from "./contentPack";
import type { HistoryEvent } from "./historyLog";

/**
 * The new cards on offer today, in the order to introduce them (ticket 07).
 *
 * - Letter and sound Items come first, in the authored order.
 * - A Sentence is eligible only when every letter or sound Item it lists has
 *   been met and exactly one of its other Items is new to the learner.
 * - Among eligible Sentences, one whose new Item serves Mission 1 (the
 *   pack's first Mission) goes first; otherwise the authored order decides.
 *
 * It walks forward as if the learner meets each card in turn, so one
 * Sentence can make the next one eligible within the same queue. Daily caps
 * are applied by the caller.
 */
export function newMaterial(pack: ContentPack, events: readonly HistoryEvent[]): Card[] {
  const seen = new Set(events.map((event) => event.cardId));
  const items = new Map(pack.items.map((item) => [item.id, item]));
  const sentences = pack.order.flatMap((id) => pack.sentences.filter((s) => s.id === id));
  const met = metItems(pack, seen);
  const cards: Card[] = [];

  for (const id of pack.order) {
    const item = items.get(id);
    if (item && isLetterOrSound(item) && !seen.has(letterCardId(id))) {
      cards.push(letterCard(item));
      met.add(id);
    }
  }

  const mission1 = pack.missions?.[0]?.id;
  const servesMission1 = (itemId: string) => mission1 !== undefined && (items.get(itemId)?.missions.includes(mission1) ?? false);

  let waiting = sentences.filter((s) => !seen.has(listeningCardId(s.id)));
  for (;;) {
    const eligible = waiting.filter((s) => newItemIn(s, met, items) !== undefined);
    const next = eligible.find((s) => servesMission1(newItemIn(s, met, items)!)) ?? eligible[0];
    if (!next) break;
    cards.push(listeningCard(next, items.get(next.introduces)));
    for (const id of next.itemIds) met.add(id);
    waiting = waiting.filter((s) => s !== next);
  }
  return cards;
}

/** Items the learner has met: letters whose card they've seen, and every Item in a Sentence they've heard. */
function metItems(pack: ContentPack, seen: ReadonlySet<string>): Set<string> {
  const met = new Set<string>();
  for (const item of pack.items) if (isLetterOrSound(item) && seen.has(letterCardId(item.id))) met.add(item.id);
  for (const s of pack.sentences) if (seen.has(listeningCardId(s.id))) for (const id of s.itemIds) met.add(id);
  return met;
}

/** The one new Item a Sentence would bring in, or undefined if it isn't eligible (unmet letters, or not exactly one new Item). */
function newItemIn(sentence: Sentence, met: ReadonlySet<string>, items: ReadonlyMap<string, Item>): string | undefined {
  const unmet = [...new Set(sentence.itemIds.filter((id) => !met.has(id)))];
  if (unmet.some((id) => { const item = items.get(id); return item !== undefined && isLetterOrSound(item); })) return undefined;
  return unmet.length === 1 ? unmet[0] : undefined;
}
