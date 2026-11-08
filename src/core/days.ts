/**
 * The learner's local calendar days. The core never reads the clock or the
 * device timezone; callers pass `utcOffsetMinutes` (minutes ahead of UTC,
 * e.g. +540 for Seoul, -300 for New York in winter).
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** When the learner's local day containing `now` began. */
export function startOfDay(now: Date, utcOffsetMinutes: number): Date {
  const offsetMs = utcOffsetMinutes * 60 * 1000;
  const local = now.getTime() + offsetMs;
  return new Date(local - (((local % DAY_MS) + DAY_MS) % DAY_MS) - offsetMs);
}
