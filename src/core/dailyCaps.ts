import { bringsNewItem } from "./cards";
import type { HistoryEvent } from "./historyLog";
import type { CardSchedule } from "./scheduler";

/**
 * Daily caps and most-at-risk-first ordering (spec "Missed days"). These
 * functions only trim and order lists that `buildQueue` has already chosen,
 * so they don't care how new material is picked.
 *
 * A "day" is the learner's local calendar day: from local midnight to the
 * next. The core never reads the clock or the device timezone; the caller
 * passes `utcOffsetMinutes` (minutes ahead of UTC, e.g. +540 for Seoul,
 * -300 for New York in winter; in the browser, `-new Date().getTimezoneOffset()`).
 */
export interface ReviewSettings {
  /** Most new Items introduced per day. Default 15. */
  readonly newItemsPerDay: number;
  /** Most reviews (cards seen before today) per day. Default 150. Leftovers roll over. */
  readonly reviewsPerDay: number;
  /** The learner's local timezone, as minutes ahead of UTC. Default 0 (UTC). */
  readonly utcOffsetMinutes: number;
}

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = { newItemsPerDay: 15, reviewsPerDay: 150, utcOffsetMinutes: 0 };

const DAY_MS = 24 * 60 * 60 * 1000;

/** When the learner's local day containing `now` began. */
export function startOfDay(now: Date, utcOffsetMinutes: number): Date {
  const offsetMs = utcOffsetMinutes * 60 * 1000;
  const local = now.getTime() + offsetMs;
  return new Date(local - (((local % DAY_MS) + DAY_MS) % DAY_MS) - offsetMs);
}

/** When each card first appeared in the History Log (introduced or first reviewed), by card ID. */
function firstSeen(events: readonly HistoryEvent[]): Map<string, number> {
  const first = new Map<string, number>();
  for (const event of events) {
    const at = new Date(event.at).getTime();
    const known = first.get(event.cardId);
    if (known === undefined || at < known) first.set(event.cardId, at);
  }
  return first;
}

/**
 * Orders due cards by FSRS recall probability, lowest (closest to being
 * forgotten) first. Ties keep their incoming order.
 */
export function mostAtRiskFirst<T extends { id: string }>(dueCards: readonly T[], schedules: ReadonlyMap<string, CardSchedule>): T[] {
  const recall = (card: T) => schedules.get(card.id)?.recall ?? 0;
  return [...dueCards].sort((a, b) => recall(a) - recall(b));
}

export interface DayContext {
  readonly events: readonly HistoryEvent[];
  readonly now: Date;
  readonly settings: ReviewSettings;
}

/**
 * Keeps only as many of `newCards` (already in introduction order) as are
 * left of today's new-Item cap. Every card first seen today that brings in
 * a new Item counts; Speaking Cards bring in none, so they're never capped.
 */
export function capNewCards<T extends { id: string }>(newCards: readonly T[], { events, now, settings }: DayContext): T[] {
  const dayStart = startOfDay(now, settings.utcOffsetMinutes).getTime();
  const introducedToday = [...firstSeen(events)].filter(([id, at]) => at >= dayStart && bringsNewItem(id)).length;
  let left = settings.newItemsPerDay - introducedToday;
  return newCards.filter((card) => !bringsNewItem(card.id) || left-- > 0);
}

/**
 * Keeps only as many of `dueReviews` (already in priority order) as are left
 * of today's review cap; the rest roll over to a later day. A review is a
 * card first seen before today and reviewed today. A card already reviewed
 * today (e.g. failed and back after its 10-minute step) always stays, so a
 * Review never strands a card mid-relearning.
 */
export function capReviews<T extends { id: string }>(dueReviews: readonly T[], { events, now, settings }: DayContext): T[] {
  const dayStart = startOfDay(now, settings.utcOffsetMinutes).getTime();
  const first = firstSeen(events);
  const seenToday = new Set(
    events.filter((event) => event.type === "card-reviewed" && new Date(event.at).getTime() >= dayStart).map((event) => event.cardId),
  );
  let left = settings.reviewsPerDay - [...seenToday].filter((id) => (first.get(id) ?? 0) < dayStart).length;
  return dueReviews.filter((card) => seenToday.has(card.id) || left-- > 0);
}
