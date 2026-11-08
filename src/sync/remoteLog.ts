import type { HistoryEvent } from "../core";

/**
 * The shared History Log in the private data repo, as a set of log files
 * (ADR 0003). Each device writes only its own files, so writes never
 * conflict; reading means fetching every file and merging.
 *
 * File layout: `history/<deviceId>/<YYYY-MM>.jsonl`, one JSON event per line,
 * events grouped by the UTC month of their timestamp.
 */
export interface RemoteLog {
  /** Paths of every log file, from every device. */
  list(): Promise<string[]>;
  /** The events in one log file. */
  read(path: string): Promise<HistoryEvent[]>;
  /** Creates or replaces one log file. */
  write(path: string, events: readonly HistoryEvent[]): Promise<void>;
}

export const HISTORY_DIR = "history";

/** Where a device keeps its events for one month. */
export function logFilePath(deviceId: string, month: string): string {
  return `${HISTORY_DIR}/${deviceId}/${month}.jsonl`;
}

/** The folder holding all of one device's files. */
export function deviceFolder(deviceId: string): string {
  return `${HISTORY_DIR}/${deviceId}/`;
}

/** The UTC month ("YYYY-MM") an event belongs to. */
export function monthOf(event: HistoryEvent): string {
  return event.at.slice(0, 7);
}

/** Log file contents: one JSON event per line. */
export function toJsonLines(events: readonly HistoryEvent[]): string {
  return events.map((event) => JSON.stringify(event) + "\n").join("");
}

export function fromJsonLines(text: string): HistoryEvent[] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as HistoryEvent);
}
