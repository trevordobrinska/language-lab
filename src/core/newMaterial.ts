import {
  isLetterOrSound,
  letterCard,
  letterCardId,
  listeningCard,
  listeningCardId,
  speakingCard,
  speakingCardId,
  type Card,
} from "./cards";
import { mission1, type ContentPack, type Item, type Sentence } from "./contentPack";
import { startOfDay } from "./days";
import { seenCardIds, type HistoryEvent } from "./historyLog";

/**
 * The new cards on offer today, in the order to introduce them (ticket 07).
 *
 * - Speaking Cards just unlocked come first: a Sentence's Speaking Card
 *   unlocks once its Listening Card has been graded Good on two separate
 *   days (the learner's local days). They bring in no new Item.
 * - Then letter and sound Items, in the authored order.
 * - A Sentence is eligible only when every letter or sound Item it lists has
 *   been met and all but one of its other Items are known (see `knownItems`).
 * - Among eligible Sentences, one whose new Item serves Mission 1 (the
 *   pack's first Mission) goes first; otherwise the authored order decides.
 *
 * It walks forward as if the learner meets each card in turn, so one
 * Sentence can make the next one eligible within the same queue. Daily caps
 * are applied by the caller.
 */
export function newMaterial(pack: ContentPack, events: readonly HistoryEvent[], utcOffsetMinutes: number): Card[] {
  const seen = seenCardIds(events);
  const items = new Map(pack.items.map((item) => [item.id, item]));
  const sentences = pack.order.flatMap((id) => pack.sentences.filter((s) => s.id === id));
  const known = knownItems(pack, events, seen);
  const goodDays = goodDaysByCard(events, utcOffsetMinutes);
  const cards: Card[] = [];

  for (const s of sentences) {
    const unlocked = (goodDays.get(listeningCardId(s.id))?.size ?? 0) >= SPEAKING_UNLOCK_GOOD_DAYS;
    if (unlocked && !seen.has(speakingCardId(s.id))) cards.push(speakingCard(s, items.get(s.introduces)));
  }

  for (const id of pack.order) {
    const item = items.get(id);
    if (item && isLetterOrSound(item) && !seen.has(letterCardId(id))) {
      cards.push(letterCard(item));
      known.add(id);
    }
  }

  const firstMission = mission1(pack)?.id;
  const servesMission1 = (itemId: string) => firstMission !== undefined && (items.get(itemId)?.missions.includes(firstMission) ?? false);

  let waiting = sentences.filter((s) => !seen.has(listeningCardId(s.id)));
  for (;;) {
    const eligible = waiting.filter((s) => newItemIn(s, known, items) !== undefined);
    const next = eligible.find((s) => servesMission1(newItemIn(s, known, items)!)) ?? eligible[0];
    if (!next) break;
    cards.push(listeningCard(next, items.get(next.introduces)));
    // Looking ahead as if the learner passes it; if they grade it Again, the rebuilt queue drops what built on it.
    known.add(newItemIn(next, known, items)!);
    waiting = waiting.filter((s) => s !== next);
  }
  return cards;
}

/** A Sentence's Speaking Card unlocks once its Listening Card has been graded Good on this many separate days. */
const SPEAKING_UNLOCK_GOOD_DAYS = 2;

/** The learner's local days (as day-start times) on which each card was graded Good. */
function goodDaysByCard(events: readonly HistoryEvent[], utcOffsetMinutes: number): Map<string, Set<number>> {
  const days = new Map<string, Set<number>>();
  for (const event of events) {
    if (event.type !== "card-reviewed" || event.grade !== "good") continue;
    const set = days.get(event.cardId) ?? new Set<number>();
    set.add(startOfDay(new Date(event.at), utcOffsetMinutes).getTime());
    days.set(event.cardId, set);
  }
  return days;
}

/**
 * Items the learner knows well enough to build on:
 * - a letter or sound once its letter card has been seen (reviewed at all),
 *   so reading isn't held up by one shaky letter;
 * - any other Item once the Listening Card of a Sentence that introduces it
 *   has been graded Good at least once. Heard but only ever graded Again
 *   doesn't count. (Looser than Learned: a later Again doesn't undo it.)
 */
function knownItems(pack: ContentPack, events: readonly HistoryEvent[], seen: ReadonlySet<string>): Set<string> {
  const passed = new Set(events.filter((event) => event.type === "card-reviewed" && event.grade === "good").map((event) => event.cardId));
  const known = new Set<string>();
  for (const item of pack.items) if (isLetterOrSound(item) && seen.has(letterCardId(item.id))) known.add(item.id);
  for (const s of pack.sentences) if (passed.has(listeningCardId(s.id))) known.add(s.introduces);
  return known;
}

/** The one new Item a Sentence would bring in, or undefined if it isn't eligible (unmet letters, or not exactly one new Item). */
function newItemIn(sentence: Sentence, met: ReadonlySet<string>, items: ReadonlyMap<string, Item>): string | undefined {
  const unmet = [...new Set(sentence.itemIds.filter((id) => !met.has(id)))];
  if (unmet.some((id) => { const item = items.get(id); return item !== undefined && isLetterOrSound(item); })) return undefined;
  return unmet.length === 1 ? unmet[0] : undefined;
}
