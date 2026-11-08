# Sync via an add-only History Log in a private GitHub repo

Review happens on the phone, while Study Sessions and the nightly episode build happen on the PC, so both need the same history at $0. Each device keeps a local copy and adds events (reviews, sessions, Checkpoints) to an add-only History Log, synced to a private GitHub repo through the GitHub API with a fine-grained personal access token. Because nothing in the log is ever edited, combining copies is just joining their events, so devices never conflict. The FSRS schedule and all progress are calculated from the log, not stored.

## Considered Options

- **Free hosted database tier (Supabase/Firebase)**: works, but adds a third-party account and free-tier limits for one user's data.
- **Sync to the PC over home Wi-Fi or Tailscale**: needs the PC on and reachable, and a service worker requires HTTPS.
