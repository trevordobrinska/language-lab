import { STORAGE_PREFIX } from "./historyLogStore";

const KEY = `${STORAGE_PREFIX}:device-id`;

/** This device's ID, made once and kept in localStorage. It tags every History Log event. */
export function deviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
