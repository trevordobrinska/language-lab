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

/**
 * The one order of History Log events: oldest first, ties broken by event ID,
 * so merged logs replay the same way whatever order their events arrived in.
 */
export function byTimeThenId(a: HistoryEvent, b: HistoryEvent): number {
  return Date.parse(a.at) - Date.parse(b.at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/** When each card first appeared in the History Log (introduced or first reviewed), as epoch ms by card ID. */
export function firstSeen(events: readonly HistoryEvent[]): Map<string, number> {
  const first = new Map<string, number>();
  for (const event of events) {
    const at = Date.parse(event.at);
    const known = first.get(event.cardId);
    if (known === undefined || at < known) first.set(event.cardId, at);
  }
  return first;
}

/** Every card ID with any event in the History Log. */
export function seenCardIds(events: readonly HistoryEvent[]): Set<string> {
  return new Set(events.map((event) => event.cardId));
}
