/**
 * The History Log: the add-only record every schedule and progress number is
 * calculated from (ADR 0003). Events are plain data, never edited or deleted,
 * so logs from several devices merge by joining their events.
 */

/** Self-grades. Two only: recall is pass/fail after recalling aloud. */
export type Grade = "again" | "good";

interface EventBase {
  /** Unique across all devices, forever. */
  readonly id: string;
  /** The device that recorded it. */
  readonly deviceId: string;
  /** When it happened, as an ISO 8601 date and time (UTC). */
  readonly at: string;
  readonly cardId: string;
}

/** The learner graded a card after revealing it. */
export interface CardReviewedEvent extends EventBase {
  readonly type: "card-reviewed";
  readonly grade: Grade;
}

/** A new card was shown for the first time. */
export interface CardIntroducedEvent extends EventBase {
  readonly type: "card-introduced";
}

export type HistoryEvent = CardReviewedEvent | CardIntroducedEvent;
