import { isLetterOrSound, letterCardId, listeningCardId } from "./cards";
import type { ContentPack, Item } from "./contentPack";
import type { CardReviewedEvent, Grade, HistoryEvent } from "./historyLog";
import { buildQueue, cardSchedules, type QueueInput } from "./review";

/** A count out of a total, e.g. 40 of the pack's 300 Items learned. */
export interface Tally {
  readonly learned: number;
  readonly total: number;
}

/** Where the learner stands, in learning terms only (no points, badges or streaks). */
export interface Progress {
  /** Items learned, out of every Item in the pack. */
  readonly items: Tally;
  /** Sentences learned (through their Listening Card), out of every Sentence in the pack. */
  readonly sentences: Tally;
  /**
   * Every card seen before that is due now, before the daily review cap: the
   * raw backlog. After missed days this can be far more than one Review.
   */
  readonly cardsDue: number;
  /**
   * How many cards today's Review will serve right now: exactly what
   * `buildQueue` returns for the same input, so it respects both daily caps
   * and includes new cards and cards coming back after a failed grade.
   */
  readonly todaysReview: number;
  /**
   * Mission 1 (`pack.missions[0]`): its word Items learned, out of every word
   * Item tagged for it. Letters, sounds and grammar patterns aren't counted:
   * this is the Mission's vocabulary. Absent if the pack has no Missions.
   */
  readonly mission?: Tally & { readonly id: string; readonly name: string };
}

/**
 * Progress, calculated from the History Log like everything else.
 *
 * **Learned** means the card that introduces it has been graded Good and its
 * latest grade is still Good. A card graded Again goes into a (re)learning
 * step and stops counting as learned until it's graded Good again; Good
 * always graduates it (see `scheduler.ts`), so "latest grade Good" is the
 * same as "passed at least once and not currently relearning".
 * - An Item is introduced by its letter card (letters, syllables, sounds) or
 *   by the Listening Card of the Sentence whose `introduces` names it.
 * - A Sentence is learned through its Listening Card. Its Speaking Card is
 *   extra practice, so it doesn't change either count.
 */
export function progress(input: QueueInput): Progress {
  const { pack, events, now } = input;
  const latest = latestGrades(events);
  const learnedCard = (cardId: string | undefined) => cardId !== undefined && latest.get(cardId) === "good";
  const introducedBy = introducingCards(pack);
  const learnedItem = (item: Item) => learnedCard(introducedBy.get(item.id));
  const mission1 = pack.missions?.[0];
  const missionWords = mission1 ? pack.items.filter((item) => item.kind === "word" && item.missions.includes(mission1.id)) : [];
  return {
    ...(mission1 && { mission: { id: mission1.id, name: mission1.name, ...tally(missionWords, learnedItem) } }),
    items: tally(pack.items, learnedItem),
    sentences: tally(pack.sentences, (s) => learnedCard(listeningCardId(s.id))),
    cardsDue: [...cardSchedules({ events, now }).values()].filter((card) => card.due.getTime() <= now.getTime()).length,
    todaysReview: buildQueue(input).length,
  };
}

function tally<T>(things: readonly T[], learned: (thing: T) => boolean): Tally {
  return { learned: things.filter(learned).length, total: things.length };
}

/** The card that introduces each Item, by Item ID. */
function introducingCards(pack: ContentPack): Map<string, string> {
  const cards = new Map<string, string>();
  for (const item of pack.items) if (isLetterOrSound(item)) cards.set(item.id, letterCardId(item.id));
  for (const s of pack.sentences) if (!cards.has(s.introduces)) cards.set(s.introduces, listeningCardId(s.id));
  return cards;
}

/** Each reviewed card's latest grade. Ties in time break by event ID, as in `cardSchedules`. */
function latestGrades(events: readonly HistoryEvent[]): Map<string, Grade> {
  const latest = new Map<string, CardReviewedEvent>();
  for (const event of events) {
    if (event.type !== "card-reviewed") continue;
    const known = latest.get(event.cardId);
    if (!known || isLater(event, known)) latest.set(event.cardId, event);
  }
  return new Map([...latest].map(([cardId, event]) => [cardId, event.grade]));
}

function isLater(a: HistoryEvent, b: HistoryEvent): boolean {
  const at = new Date(a.at).getTime() - new Date(b.at).getTime();
  return at > 0 || (at === 0 && a.id > b.id);
}
