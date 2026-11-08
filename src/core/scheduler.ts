import type { Grade } from "./historyLog";

/**
 * The scheduler adapter: the one place that decides when a card comes back.
 * It's a seam reserved for `ts-fsrs` (ticket 04), which will replay a card's
 * reviews through FSRS at 90% target recall. Nothing outside this file
 * should know how scheduling works, and no schedule is ever stored: it's
 * recalculated from the History Log each time.
 *
 * PLACEHOLDER until ticket 04: Good brings the card back a day later, Again
 * a minute later.
 */

/** One review of a card, from the History Log. */
export interface PastReview {
  readonly grade: Grade;
  readonly at: Date;
}

/** Where a card stands after its reviews so far. */
export interface CardState {
  /** When the card is next due. */
  readonly due: Date;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Replays a card's reviews (oldest first, at least one) into its current state. */
export function replay(reviews: readonly PastReview[]): CardState {
  const last = reviews[reviews.length - 1];
  const gap = last.grade === "good" ? DAY_MS : MINUTE_MS;
  return { due: new Date(last.at.getTime() + gap) };
}
