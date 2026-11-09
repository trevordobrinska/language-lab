/**
 * A short, fixable explanation of why a sync failed, for the settings screen.
 * The phone has no console, so this is the only place a learner sees it.
 */
export function describeSyncError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status = /^GitHub \w+ .*: (\d{3})\b/.exec(message)?.[1];
  switch (status) {
    case "401":
      return "GitHub rejected the token (401). It may be mistyped, expired or revoked: paste it again, or make a new one.";
    case "403":
      return "The token can't write to the data repo (403). Give it Contents: Read and write on that repo.";
    case "404":
      return "GitHub can't find the data repo (404). Check the owner and repo name, and that the token includes that repo.";
    case "409":
    case "422":
      return `GitHub refused the write (${status}), usually because another device synced at the same moment. It will retry.`;
  }
  if (status) return `GitHub returned an error (${status}). It will retry.`;
  if (error instanceof TypeError) return "Couldn't reach GitHub. Check the connection; it will retry.";
  return `Sync failed: ${message}`;
}
