# Audio generation setup (MeloTTS on Windows)

`npm run audio` (or `npm run audio -- ko`) generates one mono 64 kbps mp3 per Sentence and per letter or sound Item in `content/<language>/`, named `audio/<id>.mp3`. It runs MeloTTS on the CPU, so it's free and works offline once the models are downloaded. It skips files that already exist, updates the pack's `audio` references to point at the new files, and deletes the ticket 01 placeholder `.wav` files they replace.

The logic lives in `scripts/audio/generatePackAudio.ts` (tested with a fake TTS engine). The real engines are thin adapters: `scripts/audio/melo_tts.py` (MeloTTS) and ffmpeg, both in `scripts/audio/backends.ts`.

## Why the setup is fiddly

- MeloTTS needs **Python 3.10** (3.9 to 3.11). The PC's Python 3.14 won't work, because MeloTTS pins old packages (`transformers==4.27.4`, `librosa==0.9.1`, and others) that have no 3.14 wheels. So it gets its own venv at `.venv-tts` in the repo root (this is gitignored).
- MeloTTS doesn't officially support Windows. The steps below work around that. Docker is the fallback.
- ffmpeg isn't installed on the PC. It's needed for the mp3 step.

Steps marked **(you)** need you: they install system software, may show a UAC prompt, or download large files.

## Steps

Run these from the repo root in PowerShell.

1. **(you)** Install uv (it fetches Python 3.10 without touching your PATH) and ffmpeg:
   ```powershell
   winget install astral-sh.uv
   winget install Gyan.FFmpeg
   ```
   Then open a new terminal so both are on PATH. Check with `uv --version` and `ffmpeg -version`.
2. Create the venv:
   ```powershell
   uv venv -p 3.10 .venv-tts
   .venv-tts\Scripts\activate
   ```
3. **(you, ~200 MB download)** Install the CPU-only torch first. The default PyPI build is much larger.
   ```powershell
   uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
   ```
4. Install MeloTTS:
   ```powershell
   uv pip install git+https://github.com/myshell-ai/MeloTTS.git
   ```
5. Install `eunjeon`. Korean pronunciation (g2pkk) needs it on Windows, and g2pkk would otherwise try to `pip install` it at runtime.
   ```powershell
   uv pip install eunjeon
   ```
   If it fails to compile: **(you, admin)** run `winget install Microsoft.VisualStudio.2022.BuildTools`, add the "Desktop development with C++" workload, then retry. If you later see a confusing `TypeError` mentioning `print`, it means eunjeon is missing: g2pkk does `raise print(...)`.
6. **(you, ~500 MB download)** Download unidic. Korean doesn't use it, but MeloTTS imports it at load time.
   ```powershell
   python -m unidic download
   ```
7. **(you, several hundred MB to ~1 GB download, the first time only)** Generate the audio. The first run downloads the Korean checkpoint (`myshell-ai/MeloTTS-Korean`) and `kykim/bert-kor-base` from Hugging Face. No account or token is needed.
   ```powershell
   npm run audio
   ```
   Run it again: it should say "All audio already exists."
8. **(you)** Listen-check a sample of the new files (spec story 51). In particular, check the **letter** Items. MeloTTS is given the bare jamo (e.g. `ㄱ`), and a lone consonant may come out as its name, as silence, or garbled. If it does, tell a Claude Code session, which can change what's spoken for letters (for example, a syllable such as `가`). Then delete the bad mp3 and rerun.
9. Run `npm test`, then commit `content/` (the new mp3s, the updated `pack.json`, and the deleted placeholder `.wav`s).

## Overrides

- `MELO_PYTHON` is the path to a different Python with MeloTTS installed (the default is `.venv-tts\Scripts\python.exe`).
- `FFMPEG` is the path to ffmpeg, if it isn't on PATH.

## If the native install fails

Use Docker Desktop with MeloTTS's own Dockerfile (this needs admin and WSL2). Then set `MELO_PYTHON` to a wrapper that runs `scripts/audio/melo_tts.py` in the container. The jobs file and WAV paths it uses are under the system temp folder, so mount that folder too.

Sources: the MeloTTS [install doc](https://github.com/myshell-ai/MeloTTS/blob/main/docs/install.md), [requirements](https://github.com/myshell-ai/MeloTTS/blob/main/requirements.txt), [api.py](https://github.com/myshell-ai/MeloTTS/blob/main/melo/api.py), and [g2pkk](https://github.com/harmlessman/g2pkk/blob/main/g2pkk/g2pkk.py).
