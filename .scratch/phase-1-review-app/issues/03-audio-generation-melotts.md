# 03: Audio generation with MeloTTS

**What to build:** One command on the PC creates an audio file for every Sentence and every Hangul or sound Item in a content pack, using MeloTTS (Korean) on the CPU. It never involves the phone app or any paid service. It skips files that already exist, so adding content only generates what's new. The generated files replace ticket 01's placeholders and are committed with the content.

**Blocked by:** 01

**Status:** resolved

- [x] Setup steps for MeloTTS on Windows are documented (installing it may need the user to step in, so flag it if it does)
- [x] One command generates compressed audio for every Sentence and audio-bearing Item in the pack
- [x] Running it again creates no new files. Adding one Sentence generates exactly one new file
- [x] The file names and references match what the content pack expects, and the content check passes
- [x] Placeholder audio from 01 is replaced

## Comments

**Built (agent):**

- `npm run audio [-- <language>]` (default `ko`) runs `scripts/audio/cli.ts`. Node 26 runs the TypeScript directly.
- `scripts/audio/generatePackAudio.ts` holds the logic, tested in `generatePackAudio.test.ts` with a fake TTS engine and a fake encoder. It does the following:
  - It creates one `audio/<id>.mp3` per Sentence and per `letter`/`sound` Item.
  - It skips existing files, so a rerun does nothing and one new Sentence makes exactly one new file.
  - It sends the whole batch to the TTS engine in one call, so the model loads once.
  - It rewrites only the `"audio"` strings in `pack.json` (the hand-written layout is kept) and deletes the placeholder `.wav` files it replaces.
- `scripts/audio/backends.ts` holds the thin real adapters: MeloTTS via `scripts/audio/melo_tts.py` in a Python 3.10 venv at `.venv-tts` (gitignored), and ffmpeg (mono, 64 kbps mp3). `MELO_PYTHON` and `FFMPEG` override the paths to each.
- `scripts/tsconfig.json` type-checks the scripts with Node types. `npm run typecheck`/`build` now cover both.
- `docs/audio-setup.md` has the Windows setup, with the steps that need the user marked **(you)**.

**Open, for the user:** the agent couldn't install system software or download models, so nothing has been generated yet. The pack still points at ticket 01's placeholder `.wav` files, which keeps the app and the content check working until real audio exists.

1. Follow `docs/audio-setup.md`:
   - Use winget to install uv and ffmpeg.
   - Create the 3.10 venv.
   - Install CPU torch, MeloTTS, `eunjeon` (this may need VS Build Tools with admin) and unidic.
2. Run `npm run audio`. The first run downloads the Korean model and BERT. Then run it again and confirm it prints "All audio already exists". This closes boxes 2 and 5.
3. Listen-check the clips. Check the bare-jamo letter clips in particular (e.g. `ㄱ`): MeloTTS may say them oddly. If so, ask a session to change what's spoken for letters.
4. Run `npm test`, with ticket 02's content check merged, to confirm the mp3 references resolve. Then commit `content/ko/`. This closes box 4.

- 2026-11-08: User ran `npm run audio`; 390 mp3s generated (7.7 MB), all placeholders replaced, `npm test` passes (105).
