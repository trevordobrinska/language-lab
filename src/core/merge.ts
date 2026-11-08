import { byTimeThenId, type HistoryEvent } from "./historyLog";

/**
 * Joins History Logs (from several devices, or local + remote) into one.
 * Events are never edited, so the join is just the union of events by ID:
 * order-independent (A+B equals B+A) and harmless to repeat. The result is
 * oldest first, ties broken by event ID, so it's the same on every device.
 */
export function mergeLogs(...logs: readonly (readonly HistoryEvent[])[]): HistoryEvent[] {
  const byId = new Map<string, HistoryEvent>();
  for (const log of logs) for (const event of log) if (!byId.has(event.id)) byId.set(event.id, event);
  return [...byId.values()].sort(byTimeThenId);
}
