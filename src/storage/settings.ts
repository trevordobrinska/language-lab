import type { ReviewSettings } from "../core";
import { STORAGE_PREFIX } from "./historyLogStore";

/**
 * The learner's settings, kept on this device in localStorage. Add new
 * fields here (e.g. daily caps) as optional, so older saved settings still load.
 */
export interface Settings {
  /** Sync to the private data repo (ADR 0003). Sync is off until all three are set. */
  readonly githubToken?: string;
  readonly dataRepoOwner?: string;
  readonly dataRepoName?: string;
  /** When the last sync succeeded, as an ISO 8601 date and time. */
  readonly lastSyncAt?: string;
  /** Daily caps (spec "Missed days"). Unset means the core's defaults (15 and 150). */
  readonly newItemsPerDay?: number;
  readonly reviewsPerDay?: number;
  /** Set once the first-run "How Review works" screen has been dismissed, so it shows only once. */
  readonly seenHowReviewWorks?: boolean;
}

const KEY = `${STORAGE_PREFIX}:settings`;

export function loadSettings(): Settings {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Settings;
  } catch {
    return {};
  }
}

/** Saves the given fields, keeping the rest. Returns the new settings. */
export function updateSettings(changes: Partial<Settings>): Settings {
  const settings = { ...loadSettings(), ...changes };
  localStorage.setItem(KEY, JSON.stringify(settings));
  return settings;
}

/**
 * What `buildQueue` needs from the settings: the daily caps plus this
 * device's current timezone, so "today" is the learner's local day.
 */
export function reviewSettings(settings: Settings, now: Date): Partial<ReviewSettings> {
  return {
    ...(isCap(settings.newItemsPerDay) && { newItemsPerDay: settings.newItemsPerDay }),
    ...(isCap(settings.reviewsPerDay) && { reviewsPerDay: settings.reviewsPerDay }),
    utcOffsetMinutes: -now.getTimezoneOffset(),
  };
}

function isCap(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** The sync target, if the learner has set one up. */
export function syncTarget(settings: Settings): { token: string; owner: string; repo: string } | undefined {
  const { githubToken: token, dataRepoOwner: owner, dataRepoName: repo } = settings;
  return token && owner && repo ? { token, owner, repo } : undefined;
}
