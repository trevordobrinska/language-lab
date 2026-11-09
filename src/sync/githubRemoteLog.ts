import { fromJsonLines, HISTORY_DIR, toJsonLines, type RemoteLog } from "./remoteLog";

export interface GitHubRepo {
  /** A fine-grained personal access token limited to the data repo (contents read/write). */
  readonly token: string;
  readonly owner: string;
  readonly repo: string;
}

/**
 * The remote History Log in a private GitHub repo, through the contents API
 * (ADR 0003). Sync logic is tested against `memoryRemoteLog`; githubRemoteLog.test.ts
 * checks only the requests (headers GitHub's CORS allows, fresh GETs).
 *
 * Updating a file needs its current blob SHA, which `list()` collects from
 * the directory listings. A write with a stale SHA fails, and the next sync
 * lists again and retries.
 */
export function githubRemoteLog({ token, owner, repo }: GitHubRepo, fetchFn: typeof fetch = fetch.bind(globalThis)): RemoteLog {
  const shas = new Map<string, string>();
  const url = (path: string) =>
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  const request = async (path: string, { accept, ...init }: RequestInit & { accept?: string } = {}) => {
    // No `cache: "no-store"`: Safari turns it into Cache-Control and Pragma request headers,
    // which GitHub's CORS preflight doesn't allow, so every request failed on the iPhone.
    // A unique query string keeps GETs fresh without adding headers.
    const fresh = init.method ? "" : `?t=${Date.now()}`;
    const response = await fetchFn(url(path) + fresh, {
      ...init,
      headers: {
        Accept: accept ?? "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!response.ok && response.status !== 404) throw new Error(`GitHub ${init.method ?? "GET"} ${path}: ${response.status}`);
    return response;
  };
  const listDir = async (path: string): Promise<DirEntry[]> => {
    const response = await request(path);
    if (response.status === 404) return [];
    const body = await response.json();
    return Array.isArray(body) ? body : [];
  };

  return {
    async list() {
      const paths: string[] = [];
      const devices = await listDir(HISTORY_DIR);
      // No history folder is normal for a new data repo, but a wrong repo name or a token
      // without access to the repo also gives 404: tell them apart by the repo's root.
      if (devices.length === 0 && (await request("")).status === 404) throw new Error("GitHub GET (data repo): 404");
      for (const device of devices) {
        if (device.type !== "dir") continue;
        for (const file of await listDir(device.path)) {
          if (file.type !== "file" || !file.name.endsWith(".jsonl")) continue;
          shas.set(file.path, file.sha);
          paths.push(file.path);
        }
      }
      return paths.sort();
    },
    async read(path) {
      const response = await request(path, { accept: "application/vnd.github.raw+json" });
      return response.status === 404 ? [] : fromJsonLines(await response.text());
    },
    async write(path, events) {
      const sha = shas.get(path);
      const response = await request(path, {
        method: "PUT",
        body: JSON.stringify({
          message: `History Log: ${path}`,
          content: base64(toJsonLines(events)),
          ...(sha ? { sha } : {}),
        }),
      });
      if (response.status === 404) throw new Error(`GitHub PUT ${path}: 404 (check the repo name and token access)`);
      const body = await response.json();
      if (body?.content?.sha) shas.set(path, body.content.sha);
    },
  };
}

interface DirEntry {
  readonly type: string;
  readonly name: string;
  readonly path: string;
  readonly sha: string;
}

/** Base64 of the UTF-8 bytes (`btoa` alone only handles Latin-1). */
function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
