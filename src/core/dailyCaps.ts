import { bringsNewItem, type Card } from "./cards";
import { startOfDay } from "./days";
import { firstSeen, type CardEvent } from "./historyLog";
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

/**
 * Orders due cards by FSRS recall probability, lowest (closest to being
 * forgotten) first. Ties keep their incoming order.
 */
export function mostAtRiskFirst<T extends { id: string }>(dueCards: readonly T[], schedules: ReadonlyMap<string, CardSchedule>): T[] {
  const recall = (card: T) => schedules.get(card.id)?.recall ?? 0;
  return [...dueCards].sort((a, b) => recall(a) - recall(b));
}

export interface DayContext {
  readonly events: readonly CardEvent[];
  readonly now: Date;
  readonly settings: ReviewSettings;
}

/**
 * Keeps only as many of `newCards` (already in introduction order) as are
 * left of today's new-Item cap. Every card first seen today that brings in
 * a new Item counts; Speaking Cards bring in none, so they're never capped.
 * `packCards` (every card the pack can produce) tells logged card IDs apart.
 */
export function capNewCards(newCards: readonly Card[], { events, now, settings }: DayContext, packCards: readonly Card[]): Card[] {
  const dayStart = startOfDay(now, settings.utcOffsetMinutes).getTime();
  const byId = new Map(packCards.map((card) => [card.id, card]));
  const introducedToday = [...firstSeen(events)].filter(([id, at]) => {
    const card = byId.get(id);
    return at >= dayStart && card !== undefined && bringsNewItem(card);
  }).length;
  let left = settings.newItemsPerDay - introducedToday;
  return newCards.filter((card) => !bringsNewItem(card) || left-- > 0);
}

/** IDs of the cards graded today (the learner's local day). */
export function reviewedToday({ events, now, settings }: DayContext): Set<string> {
  const dayStart = startOfDay(now, settings.utcOffsetMinutes).getTime();
  return new Set(
    events.filter((event) => event.type === "card-reviewed" && new Date(event.at).getTime() >= dayStart).map((event) => event.cardId),
  );
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
  const seenToday = reviewedToday({ events, now, settings });
  let left = settings.reviewsPerDay - [...seenToday].filter((id) => (first.get(id) ?? 0) < dayStart).length;
  return dueReviews.filter((card) => seenToday.has(card.id) || left-- > 0);
}
