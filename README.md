# Language Lab

A personal, research-backed app for reaching conversational fluency (CEFR B1 speaking and listening), one language at a time. Phase 1 is a daily spaced Review for Korean: Hangul, sound contrasts and ~300 market and restaurant words in whole sentences with audio, scheduled by FSRS.

## Use it

- **Live app:** https://trevordobrinska.github.io/language-lab/
- **iPhone:** open the live app in Safari, then Share > Add to Home Screen. It opens standalone and works offline once loaded. New versions install themselves on the next open.
- **Sync:** in Settings, enter a fine-grained GitHub token scoped to the private `language-lab-data` repo (Contents: read and write), owner `trevordobrinska`, repo `language-lab-data`. The History Log syncs in the background; the app works without it. See `docs/adr/0003-history-log-in-private-github-repo.md`.

## Develop

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Run locally; open the address Vite prints |
| `npm test` | Run Vitest, including the content check on the real Korean pack |
| `npm run typecheck` | Type-check the app and `scripts/` |
| `npm run build` | Typecheck and build to `dist/` (with the service worker) |
| `npm run preview` | Serve the built `dist/` |
| `npm run audio [-- <language>]` | Generate missing audio with MeloTTS on the PC (setup: `docs/audio-setup.md`) |

Pushing to `main` runs `.github/workflows/deploy.yml`: tests, build, then deploy to GitHub Pages.

## Docs

- `GLOSSARY.md`: domain terms.
- `docs/adr/`: architecture decisions.
- `.scratch/<feature>/`: specs and tickets (`docs/agents/issue-tracker.md`).
