/**
 * The incremental audio generator for one content pack (ticket 03).
 *
 * Every Sentence and every letter or sound Item gets one compressed audio
 * file, `audio/<id>.mp3`, relative to the pack folder. Files that already
 * exist are skipped. The text-to-speech engine and the mp3 encoder are passed
 * in, so this logic is tested with fakes and the real MeloTTS and ffmpeg
 * adapters stay thin (see `backends.ts`).
 */
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ContentPack } from "../../src/core/contentPack.ts";

export interface TtsJob {
  /** What to say, in the Target Language. */
  readonly text: string;
  /** Where to write the uncompressed WAV. */
  readonly wavPath: string;
}

/** A text-to-speech engine. It gets the whole batch at once, so a slow model loads only once per run. */
export interface TtsBackend {
  synthesize(jobs: readonly TtsJob[]): Promise<void>;
}

/** Compresses one WAV file to mp3. */
export interface Mp3Encoder {
  encode(wavPath: string, mp3Path: string): Promise<void>;
}

export interface AudioTarget {
  readonly id: string;
  /** What to say. */
  readonly text: string;
  /** The file the generator produces, relative to the pack folder, e.g. `audio/hangul-g.mp3`. */
  readonly path: string;
  /** The audio reference the pack has now, if any (e.g. a ticket 01 placeholder `.wav`). */
  readonly current?: string;
}

/** The audio file name the generator produces for an Item or Sentence ID. */
export function audioPathFor(id: string): string {
  return `audio/${id}.mp3`;
}

/** Every audio file the pack needs: one per Sentence and per letter or sound Item. */
export function audioTargets(pack: ContentPack): AudioTarget[] {
  const entries = [
    ...pack.items.filter((item) => item.kind === "letter" || item.kind === "sound"),
    ...pack.sentences,
  ];
  return entries.map((e) => ({ id: e.id, text: e.text, path: audioPathFor(e.id), current: e.audio }));
}

/**
 * Generates the pack's missing audio, then points the pack's audio
 * references at the generated files (editing only those strings in
 * `pack.json`) and deletes any placeholder files they replace.
 */
export async function generatePackAudio(options: {
  packDir: string;
  tts: TtsBackend;
  encoder: Mp3Encoder;
}): Promise<{ generated: readonly string[] }> {
  const { packDir, tts, encoder } = options;
  const packFile = join(packDir, "pack.json");
  const targets = audioTargets(JSON.parse(await readFile(packFile, "utf8")) as ContentPack);

  const todo: AudioTarget[] = [];
  for (const target of targets) {
    if (!(await exists(join(packDir, target.path)))) todo.push(target);
  }
  if (todo.length > 0) await synthesizeAll(packDir, todo, tts, encoder);

  await pointPackAtGeneratedAudio(packDir, targets);
  return { generated: todo.map((t) => t.path) };
}

async function synthesizeAll(packDir: string, todo: readonly AudioTarget[], tts: TtsBackend, encoder: Mp3Encoder) {
  const workDir = await mkdtemp(join(tmpdir(), "language-lab-tts-"));
  try {
    const jobs = todo.map((target, i) => ({ target, wavPath: join(workDir, `${i}.wav`) }));
    await tts.synthesize(jobs.map((j) => ({ text: j.target.text, wavPath: j.wavPath })));
    await mkdir(join(packDir, "audio"), { recursive: true });
    for (const job of jobs) await encoder.encode(job.wavPath, join(packDir, job.target.path));
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function pointPackAtGeneratedAudio(packDir: string, targets: readonly AudioTarget[]) {
  const packFile = join(packDir, "pack.json");
  const original = await readFile(packFile, "utf8");
  let text = original;
  const replaced: string[] = [];
  for (const t of targets) {
    if (t.current === undefined || t.current === t.path) continue;
    if (!(await exists(join(packDir, t.path)))) continue;
    const reference = new RegExp(`("audio"\\s*:\\s*)${escapeRegExp(JSON.stringify(t.current))}`);
    text = text.replace(reference, (_, key: string) => key + JSON.stringify(t.path));
    replaced.push(t.current);
  }
  if (text === original) return;
  await writeFile(packFile, text);

  const stillReferenced = new Set(targets.map((t) => t.path));
  for (const old of replaced) {
    if (!stillReferenced.has(old)) await rm(join(packDir, old), { force: true });
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
