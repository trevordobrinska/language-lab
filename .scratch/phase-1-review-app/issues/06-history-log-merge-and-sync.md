# 06: History Log merge and GitHub sync

**What to build:** The learner pastes a fine-grained GitHub token into settings, and from then on the History Log syncs in the background whenever they're online, without ever blocking Review. Each device writes only its own log file(s) in the private data repo. It reads every device's files and merges them with a pure join that removes duplicates by event ID. Settings show the last successful sync time. A failed sync leaves the local log untouched and is retried later. The app works fully before a token is set. See ADR 0003.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Merge tests show that A+B equals B+A, that merging twice changes nothing, and that duplicates are removed by event ID
- [ ] Two devices' logs merged together give the same queue as one combined log
- [ ] The GitHub calls sit behind a remote-log interface, and tests use an in-memory fake
- [ ] A device only ever writes its own files
- [ ] A failed request keeps the local log and retries later. Review is never blocked
- [ ] Settings take the token and show the last sync time. With no token, the app runs normally
