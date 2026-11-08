import { mergeLogs, type HistoryEvent } from "../core";
import type { HistoryLogStore } from "../storage/historyLogStore";
import { deviceFolder, logFilePath, monthOf, type RemoteLog } from "./remoteLog";

export interface SyncInput {
  readonly local: HistoryLogStore;
  readonly remote: RemoteLog;
  /** This device's ID: the only files it ever writes are its own. */
  readonly deviceId: string;
}

export type SyncResult = { readonly ok: true } | { readonly ok: false; readonly error: unknown };

/**
 * One sync: pull every device's files into the local log, then write this
 * device's own events to its own files (only the ones that changed). Never
 * throws. If a request fails, the local log keeps everything it had (it is
 * add-only) and the next sync picks up where this one stopped.
 */
export async function syncHistoryLog({ local, remote, deviceId }: SyncInput): Promise<SyncResult> {
  try {
    const remoteOwn = new Map<string, HistoryEvent[]>();
    for (const path of await remote.list()) {
      const events = await remote.read(path);
      if (path.startsWith(deviceFolder(deviceId))) remoteOwn.set(path, events);
      for (const event of events) await local.add(event);
    }

    const ownByFile = new Map<string, HistoryEvent[]>();
    for (const event of await local.all()) {
      if (event.deviceId !== deviceId) continue;
      const path = logFilePath(deviceId, monthOf(event));
      ownByFile.set(path, [...(ownByFile.get(path) ?? []), event]);
    }

    for (const [path, events] of ownByFile) {
      const onRemote = remoteOwn.get(path) ?? [];
      const merged = mergeLogs(onRemote, events);
      if (merged.length > onRemote.length) await remote.write(path, merged);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
