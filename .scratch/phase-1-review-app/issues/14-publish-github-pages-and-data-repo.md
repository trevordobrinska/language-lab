# 14: Publish (your steps)

**What to build:** The app is live at the Language Lab path on the user's GitHub Pages domain, and sync has somewhere to write. These are steps only the user can take. A `/wizard` script can walk them through it:
- push the Language Lab repo to a new **public** GitHub repo and turn on Pages;
- create a separate **private** data repo for the History Log (ADR 0003);
- create a fine-grained personal access token limited to that one private repo, with contents read/write.

**Blocked by:** 05, 06

**Status:** ready-for-human

- [x] The public app repo exists, and Pages serves the app at the Language Lab path
- [x] The private data repo exists
- [ ] A fine-grained token limited to the data repo (contents read/write only) exists and is stored somewhere safe
- [ ] Opening the published app in the PC browser runs a Review

## Comments

**Done (agent), 2026-11-08,** with `gh` (logged in as trevordobrinska):
- Public app repo: https://github.com/trevordobrinska/language-lab. `main` holds the merged Phase 1 branch. All commits use the GitHub noreply email.
- `.github/workflows/deploy.yml` runs `npm ci`, `npm test` and `npm run build` on every push to `main` (or by hand), then deploys `dist/` to Pages. Pages is set to the GitHub Actions source.
- The app is live at https://trevordobrinska.github.io/language-lab/. The first run passed, and the page, `sw.js`, the manifest, the JS bundle and an mp3 all return 200.
- Private data repo: https://github.com/trevordobrinska/language-lab-data, with a README so it isn't empty.

**Open, for the user:**
1. Create the token. GitHub has no API for fine-grained tokens, so do it at https://github.com/settings/personal-access-tokens/new: name it `language-lab-sync`, choose **Only select repositories** → `language-lab-data`, and under Repository permissions set **Contents: Read and write** (Metadata: read-only is added automatically). Store it in your password manager.
2. Open the live app on the PC. In Settings, enter the token, owner `trevordobrinska` and repo `language-lab-data`, then run a Review. Check that a log file appears in the data repo, then tick the last two boxes.
