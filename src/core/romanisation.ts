import type { Card } from "./cards";
import { DAY_MS, startOfDay } from "./days";
import type { HistoryEvent } from "./historyLog";

/**
 * Week-1 romanisation (spec "Decisions"): cards show romanisation as training
 * wheels during the learner's first 7 days, then never again, so it can't
 * become a crutch that shapes pronunciation.
 *
 * Day 1 is the learner's local calendar day of the first History Log event
 * (today, for a learner with no events yet); days 1 to 7 inclusive count.
 */
export const ROMANISATION_DAYS = 7;

/** Whether `now` falls within the learner's first `ROMANISATION_DAYS` local days. */
export function inRomanisationWeek(events: readonly HistoryEvent[], now: Date, utcOffsetMinutes: number): boolean {
  if (events.length === 0) return true;
  const first = events.reduce((min, event) => Math.min(min, new Date(event.at).getTime()), Infinity);
  const day1 = startOfDay(new Date(first), utcOffsetMinutes).getTime();
  const today = startOfDay(now, utcOffsetMinutes).getTime();
  return Math.round((today - day1) / DAY_MS) < ROMANISATION_DAYS;
}

/** The cards as they should show: with their romanisation in week 1, without it after. */
export function applyRomanisationWeek(cards: readonly Card[], showRomanisation: boolean): Card[] {
  if (showRomanisation) return [...cards];
  return cards.map((card) => {
    if (card.back.romanisation === undefined) return card;
    const { romanisation: _hidden, ...back } = card.back;
    return { ...card, back };
  });
}
