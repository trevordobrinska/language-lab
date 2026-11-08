import type { HistoryEvent } from "../core";
import type { RemoteLog } from "./remoteLog";

export interface MemoryRemoteLog extends RemoteLog {
  /** Paths written through this fake, in order (to check who wrote what). */
  readonly writes: string[];
  /** Make the next `count` requests fail, like a dropped connection. */
  failNext(count?: number): void;
}

/** An in-memory stand-in for the private data repo, for tests. */
export function memoryRemoteLog(): MemoryRemoteLog {
  const files = new Map<string, HistoryEvent[]>();
  const writes: string[] = [];
  let failures = 0;
  const request = () => {
    if (failures > 0) {
      failures--;
      throw new Error("network down");
    }
  };
  return {
    writes,
    failNext(count = 1) {
      failures = count;
    },
    async list() {
      request();
      return [...files.keys()].sort();
    },
    async read(path) {
      request();
      return [...(files.get(path) ?? [])];
    },
    async write(path, events) {
      request();
      writes.push(path);
      files.set(path, [...events]);
    },
  };
}
