import type { ContentPack, Item } from "./contentPack";
import type { CardReviewedEvent, Grade, HistoryEvent } from "./historyLog";
import { capNewCards, capReviews, DEFAULT_REVIEW_SETTINGS, mostAtRiskFirst, type ReviewSettings } from "./dailyCaps";
import { schedule, type CardSchedule, type PastReview } from "./scheduler";

/** One card in today's queue: what to show before and after the reveal. */
export interface Card {
  /** Stable ID used in History Log events, e.g. "letter:ko-g". */
  readonly id: string;
  readonly kind: "letter";
  readonly front: {
    /** Text to show, e.g. the letter. */
    readonly text: string;
    /** Audio path relative to the pack's folder, played on showing the front. */
    readonly audio?: string;
  };
  readonly back: {
    /** The answer to check recall against. */
    readonly text: string;
  };
}

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
 * the queue until then, so the Review never ends before it comes back.
 */
const LEARN_AHEAD_MS = 20 * 60 * 1000;

/** Today's Review: the cards to show, in order. */
export function buildQueue({ pack, events, now, settings }: QueueInput): Card[] {
  const day = { events, now, settings: { ...DEFAULT_REVIEW_SETTINGS, ...settings } };
  const items = new Map(pack.items.map((item) => [item.id, item]));
  const schedules = cardSchedules({ events, now });
  const cards = pack.order.flatMap((id) => {
    const item = items.get(id);
    return item ? [letterCard(item)] : [];
  });
  const dueBy = (card: Card) => schedules.get(card.id)?.due.getTime() ?? now.getTime();
  const newCards = capNewCards(
    cards.filter((card) => !schedules.has(card.id)),
    day,
  );
  const reviews = cards.filter((card) => schedules.has(card.id)).sort((a, b) => dueBy(a) - dueBy(b));
  const dueReviews = capReviews(
    mostAtRiskFirst(
      reviews.filter((card) => dueBy(card) <= now.getTime()),
      schedules,
    ),
    day,
  );
  const comingBack = reviews.filter(
    (card) => dueBy(card) > now.getTime() && dueBy(card) <= now.getTime() + LEARN_AHEAD_MS,
  );
  return [...interleave(dueReviews, newCards), ...comingBack];
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
 * Each card's reviews, oldest first. Ties break by event ID, so merged logs
 * replay the same way whatever order their events arrived in.
 */
function reviewsByCard(events: readonly HistoryEvent[]): Map<string, PastReview[]> {
  const sorted = events
    .filter((event): event is CardReviewedEvent => event.type === "card-reviewed")
    .map((event) => ({ event, at: new Date(event.at) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime() || (a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0));
  const byCard = new Map<string, PastReview[]>();
  for (const { event, at } of sorted) {
    const list = byCard.get(event.cardId) ?? [];
    list.push({ grade: event.grade, at });
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

function letterCard(item: Item): Card {
  return {
    id: `letter:${item.id}`,
    kind: "letter",
    front: { text: item.text, audio: item.audio },
    back: { text: item.meaning },
  };
}
