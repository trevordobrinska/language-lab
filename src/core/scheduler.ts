import { createEmptyCard, fsrs, generatorParameters, Rating, type Card as FsrsCard } from "ts-fsrs";
import type { Grade } from "./historyLog";

/**
 * The scheduler adapter: the one place that decides when a card comes back,
 * and the only file that imports `ts-fsrs`. It replays a card's reviews
 * through FSRS (default parameters, 90% target recall). No schedule is ever
 * stored: it's recalculated from the History Log each time.
 *
 * A failed card (Again) goes through a 10-minute (re)learning step, so it
 * comes back later in the same Review. A new card graded Good graduates
 * straight away, so Good always means "not again today".
 */

/** One review of a card, from the History Log. */
export interface PastReview {
  readonly grade: Grade;
  readonly at: Date;
}

/** Where a reviewed card stands at a given moment. */
export interface CardSchedule {
  /** When the card is next due. */
  readonly due: Date;
  /** FSRS's probability (0 to 1) that the learner still recalls the card at `now`. */
  readonly recall: number;
}

const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    learning_steps: ["10m"],
    relearning_steps: ["10m"],
    enable_fuzz: false, // Deterministic: the same History Log always gives the same schedule.
  }),
);

const RATINGS = { again: Rating.Again, good: Rating.Good } as const;

/** Replays a card's reviews (oldest first, at least one) into where it stands at `now`. */
export function schedule(reviews: readonly PastReview[], now: Date): CardSchedule {
  let card: FsrsCard = createEmptyCard(reviews[0].at);
  for (const { grade, at } of reviews) card = scheduler.next(card, at, RATINGS[grade]).card;
  return { due: card.due, recall: scheduler.retrievability(card, now) };
}
