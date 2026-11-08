/**
 * The real adapters behind `generatePackAudio`: MeloTTS (run in its own
 * Python 3.10 venv) and ffmpeg. They are deliberately thin and not unit
 * tested; setup is in `docs/audio-setup.md`.
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Mp3Encoder, TtsBackend } from "./generatePackAudio.ts";

const here = fileURLToPath(new URL(".", import.meta.url));

/** The venv's Python, unless MELO_PYTHON points somewhere else. */
export function meloPython(repoRoot: string): string {
  return process.env.MELO_PYTHON ?? join(repoRoot, ".venv-tts", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
}

/**
 * MeloTTS for one language (e.g. "KR"). The whole batch goes to one Python
 * process, so the model loads once per run.
 */
export function meloTts(python: string, language: string): TtsBackend {
  return {
    async synthesize(jobs) {
      const dir = await mkdtemp(join(tmpdir(), "language-lab-melo-"));
      try {
        const jobsFile = join(dir, "jobs.json");
        await writeFile(jobsFile, JSON.stringify({ language, jobs }), "utf8");
        await run(python, [join(here, "melo_tts.py"), jobsFile], { PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" });
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
  };
}

/** ffmpeg, mono 64 kbps mp3 (plays everywhere, including iOS Safari). FFMPEG overrides the binary. */
export function ffmpegMp3(ffmpeg = process.env.FFMPEG ?? "ffmpeg"): Mp3Encoder {
  return {
    encode: (wavPath, mp3Path) =>
      run(ffmpeg, ["-y", "-loglevel", "error", "-i", wavPath, "-ac", "1", "-b:a", "64k", mp3Path]),
  };
}

function run(command: string, args: readonly string[], env: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: { ...process.env, ...env } });
    child.on("error", (err) => reject(new Error(`Couldn't start ${command}: ${err.message}. See docs/audio-setup.md.`)));
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))));
  });
}
