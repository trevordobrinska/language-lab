import { packCards, type Card } from "./cards";
import type { ContentPack } from "./contentPack";
import { byTimeThenId, type CardReviewedEvent, type Grade, type HistoryEvent } from "./historyLog";
import { capNewCards, capReviews, DEFAULT_REVIEW_SETTINGS, mostAtRiskFirst, reviewedToday, type ReviewSettings } from "./dailyCaps";
import { withGrammarNotes } from "./grammarNotes";
import { newMaterial } from "./newMaterial";
import { applyRomanisationWeek, inRomanisationWeek } from "./romanisation";
import { schedule, type CardSchedule, type PastReview } from "./scheduler";

export type { Card, CardGrammarNote, CardKind } from "./cards";

export interface QueueInput {
  readonly pack: ContentPack;
  readonly events: readonly HistoryEvent[];
  /** The current time. The core never reads the clock itself. */
  readonly now: Date;
  /** Daily caps and the learner's timezone (see `dailyCaps.ts`); missing fields use the defaults. */
  readonly settings?: Partial<ReviewSettings>;
}

/**
 * How far ahead a failed card still counts as part of today's Review. FSRS
 * brings a failed card back after a 10-minute step; it waits at the end of
 * the queue until then, so the Review never ends before it comes back. Only
 * cards already graded today wait like this: a card from an earlier day that
 * falls due soon waits for its own time (and the review cap) instead.
 */
const LEARN_AHEAD_MS = 20 * 60 * 1000;

/**
 * Today's Review: the cards to show, in order. Cards failed today and not
 * yet back from their 10-minute step come last, marked `notDueUntil`; when
 * one of those is first, nothing is due right now.
 */
export function buildQueue({ pack, events, now, settings }: QueueInput): Card[] {
  const day = { events, now, settings: { ...DEFAULT_REVIEW_SETTINGS, ...settings } };
  const schedules = cardSchedules({ events, now });
  const cards = packCards(pack);
  const dueBy = (card: Card) => schedules.get(card.id)?.due.getTime() ?? now.getTime();
  const newCards = capNewCards(newMaterial(pack, events, day.settings.utcOffsetMinutes), day, cards);
  const reviews = cards.filter((card) => schedules.has(card.id)).sort((a, b) => dueBy(a) - dueBy(b));
  const dueReviews = capReviews(
    mostAtRiskFirst(
      reviews.filter((card) => dueBy(card) <= now.getTime()),
      schedules,
    ),
    day,
  );
  const today = reviewedToday(day);
  const comingBack = reviews
    .filter((card) => today.has(card.id) && dueBy(card) > now.getTime() && dueBy(card) <= now.getTime() + LEARN_AHEAD_MS)
    .map((card) => ({ ...card, notDueUntil: new Date(dueBy(card)) }));
  const queue = [...interleave(dueReviews, newCards), ...comingBack];
  const romanised = applyRomanisationWeek(queue, inRomanisationWeek(events, now, day.settings.utcOffsetMinutes));
  return withGrammarNotes(romanised, pack, events);
}

/** Alternates the two lists (a first), then the rest of whichever is longer. */
function interleave<T>(a: readonly T[], b: readonly T[]): T[] {
  const mixed: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) mixed.push(a[i]);
    if (i < b.length) mixed.push(b[i]);
  }
  return mixed;
}

/**
 * Where every reviewed card stands at `now`, by card ID: when it's due and
 * how likely the learner is to still recall it. Cards never reviewed aren't
 * included. Calculated from the History Log each time; nothing is stored.
 */
export function cardSchedules({ events, now }: Pick<QueueInput, "events" | "now">): Map<string, CardSchedule> {
  const schedules = new Map<string, CardSchedule>();
  for (const [cardId, reviews] of reviewsByCard(events)) schedules.set(cardId, schedule(reviews, now));
  return schedules;
}

/**
 * Each card's reviews, oldest first (in `byTimeThenId` order).
 */
function reviewsByCard(events: readonly HistoryEvent[]): Map<string, PastReview[]> {
  const sorted = events.filter((event): event is CardReviewedEvent => event.type === "card-reviewed").sort(byTimeThenId);
  const byCard = new Map<string, PastReview[]>();
  for (const event of sorted) {
    const list = byCard.get(event.cardId) ?? [];
    list.push({ grade: event.grade, at: new Date(event.at) });
    byCard.set(event.cardId, list);
  }
  return byCard;
}

export interface GradeContext {
  readonly now: Date;
  /** This device's ID (stored on the device). */
  readonly deviceId: string;
  /** A fresh unique event ID; the caller makes it so the core stays deterministic. */
  readonly eventId: string;
}

/** The learner graded a card: the History Log event to add. */
export function gradeCard(card: Card, grade: Grade, { now, deviceId, eventId }: GradeContext): CardReviewedEvent {
  return { id: eventId, deviceId, at: now.toISOString(), type: "card-reviewed", cardId: card.id, grade };
}
