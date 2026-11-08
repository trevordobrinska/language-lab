import type { ContentPack, Item } from "./contentPack";
import type { CardReviewedEvent, Grade, HistoryEvent } from "./historyLog";
import { replay, type PastReview } from "./scheduler";

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
}

/** Today's Review: the cards to show, in order. */
export function buildQueue({ pack, events, now }: QueueInput): Card[] {
  const items = new Map(pack.items.map((item) => [item.id, item]));
  const reviews = reviewsByCard(events);
  const isInToday = (card: Card) => {
    const past = reviews.get(card.id);
    return !past || replay(past).due <= now;
  };
  return pack.order.flatMap((id) => {
    const item = items.get(id);
    return item ? [letterCard(item)] : [];
  }).filter(isInToday);
}

/** Each card's reviews, oldest first. */
function reviewsByCard(events: readonly HistoryEvent[]): Map<string, PastReview[]> {
  const byCard = new Map<string, PastReview[]>();
  for (const event of events) {
    if (event.type !== "card-reviewed") continue;
    const list = byCard.get(event.cardId) ?? [];
    list.push({ grade: event.grade, at: new Date(event.at) });
    byCard.set(event.cardId, list);
  }
  for (const list of byCard.values()) list.sort((a, b) => a.at.getTime() - b.at.getTime());
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
