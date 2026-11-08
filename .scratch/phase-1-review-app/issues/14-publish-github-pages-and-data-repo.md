# 14: Publish (your steps)

**What to build:** The app is live at the Language Lab path on the user's GitHub Pages domain, and sync has somewhere to write. These are steps only the user can take. A `/wizard` script can walk them through it:
- push the Language Lab repo to a new **public** GitHub repo and turn on Pages;
- create a separate **private** data repo for the History Log (ADR 0003);
- create a fine-grained personal access token limited to that one private repo, with contents read/write.

**Blocked by:** 05, 06

**Status:** ready-for-human

- [ ] The public app repo exists, and Pages serves the app at the Language Lab path
- [ ] The private data repo exists
- [ ] A fine-grained token limited to the data repo (contents read/write only) exists and is stored somewhere safe
- [ ] Opening the published app in the PC browser runs a Review
