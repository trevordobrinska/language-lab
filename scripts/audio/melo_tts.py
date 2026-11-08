"""MeloTTS backend for `npm run audio` (ticket 03).

Usage: python melo_tts.py <jobs.json>

jobs.json is {"language": "KR", "jobs": [{"text": "...", "wavPath": "..."}]}.
Loads the model once, then writes one WAV per job. Run it with the
Python 3.10 venv described in docs/audio-setup.md, not the system Python.
"""

import json
import sys


def main() -> None:
    with open(sys.argv[1], encoding="utf-8") as f:
        spec = json.load(f)

    from melo.api import TTS  # imported late so a bad path to jobs.json fails fast

    language = spec["language"]
    model = TTS(language=language, device="cpu")
    speaker = model.hps.data.spk2id[language]
    jobs = spec["jobs"]
    for i, job in enumerate(jobs, 1):
        print(f"[{i}/{len(jobs)}] {job['text']}", flush=True)
        model.tts_to_file(job["text"], speaker, job["wavPath"], speed=1.0, quiet=True)


if __name__ == "__main__":
    main()
