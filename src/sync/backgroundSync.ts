import type { SyncResult } from "./sync";

export interface BackgroundSyncDeps {
  /** One sync attempt (e.g. `syncHistoryLog` bound to this device). */
  readonly sync: () => Promise<SyncResult>;
  readonly now: () => Date;
  readonly setTimer: (run: () => void, ms: number) => void;
  /** How long to wait before retrying a failed sync. */
  readonly retryAfterMs: number;
  /** Called with the time of each successful sync. */
  readonly onSynced: (at: Date) => void;
  /** Called with the error of each failed sync (it will be retried). */
  readonly onFailed?: (error: unknown) => void;
}

export interface BackgroundSync {
  /** Sync now (or join the sync already running). Never rejects. */
  syncNow(): Promise<void>;
  /** Resolves once no sync is running. */
  idle(): Promise<void>;
}

/**
 * Runs syncs in the background, one at a time, retrying failures later.
 * Nothing here ever throws to the caller, so Review never waits on it.
 */
export function backgroundSync({ sync, now, setTimer, retryAfterMs, onSynced, onFailed }: BackgroundSyncDeps): BackgroundSync {
  let running: Promise<void> | undefined;
  let retryScheduled = false;

  const attempt = async () => {
    const result = await sync().catch((error): SyncResult => ({ ok: false, error }));
    if (result.ok) {
      onSynced(now());
    } else {
      onFailed?.(result.error);
      if (!retryScheduled) {
        retryScheduled = true;
        setTimer(() => {
          retryScheduled = false;
          void syncNow();
        }, retryAfterMs);
      }
    }
  };

  const syncNow = () => {
    running ??= attempt().finally(() => {
      running = undefined;
    });
    return running;
  };

  return {
    syncNow,
    idle: async () => {
      while (running) await running;
    },
  };
}
