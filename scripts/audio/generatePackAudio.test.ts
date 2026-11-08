import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generatePackAudio, type Mp3Encoder, type TtsBackend } from "./generatePackAudio.ts";

/** A fake TTS backend: writes the text it was asked to say into the WAV file, and records each batch. */
function fakeTts(): TtsBackend & { batches: string[][] } {
  const batches: string[][] = [];
  return {
    batches,
    async synthesize(jobs) {
      batches.push(jobs.map((j) => j.text));
      for (const job of jobs) await writeFile(job.wavPath, `WAV:${job.text}`);
    },
  };
}

/** A fake encoder: the "MP3" is the WAV's contents with a marker in front. */
const fakeEncoder: Mp3Encoder = {
  async encode(wavPath, mp3Path) {
    await writeFile(mp3Path, `MP3:${await readFile(wavPath, "utf8")}`);
  },
};

let packDir: string;

beforeEach(async () => {
  packDir = await mkdtemp(join(tmpdir(), "pack-audio-"));
  await mkdir(join(packDir, "audio"));
});
afterEach(async () => {
  await rm(packDir, { recursive: true, force: true });
});

const item = (id: string, kind: string, text: string, audio?: string) => ({
  id,
  kind,
  text,
  meaning: id,
  missions: [],
  ...(audio ? { audio } : {}),
});
const sentence = (id: string, text: string) => ({
  id,
  text,
  meaning: id,
  itemIds: [],
  introduces: "x",
  audio: `audio/${id}.mp3`,
});

async function writePack(pack: object) {
  await writeFile(join(packDir, "pack.json"), JSON.stringify(pack, null, 2));
}
async function readPack() {
  return JSON.parse(await readFile(join(packDir, "pack.json"), "utf8"));
}
const read = (rel: string) => readFile(join(packDir, rel), "utf8");
const audioFiles = async () => (await readdir(join(packDir, "audio"))).sort();

const basePack = {
  language: "ko",
  name: "Korean",
  items: [
    item("hangul-g", "letter", "ㄱ", "audio/hangul-g.mp3"),
    item("sound-ga", "sound", "가", "audio/sound-ga.mp3"),
    item("word-water", "word", "물"),
  ],
  sentences: [sentence("s1", "물 주세요.")],
  grammarNotes: [],
  order: [],
};

describe("generatePackAudio", () => {
  it("makes one mp3 per Sentence and per letter or sound Item, named after its ID", async () => {
    await writePack(basePack);

    const result = await generatePackAudio({ packDir, tts: fakeTts(), encoder: fakeEncoder });

    expect(await read("audio/hangul-g.mp3")).toBe("MP3:WAV:ㄱ");
    expect(await read("audio/sound-ga.mp3")).toBe("MP3:WAV:가");
    expect(await read("audio/s1.mp3")).toBe("MP3:WAV:물 주세요.");
    expect(await audioFiles()).toEqual(["hangul-g.mp3", "s1.mp3", "sound-ga.mp3"]);
    expect([...result.generated].sort()).toEqual(["audio/hangul-g.mp3", "audio/s1.mp3", "audio/sound-ga.mp3"]);
  });

  it("skips files that already exist, so a second run generates nothing", async () => {
    await writePack(basePack);
    await generatePackAudio({ packDir, tts: fakeTts(), encoder: fakeEncoder });

    const tts = fakeTts();
    const result = await generatePackAudio({ packDir, tts, encoder: fakeEncoder });

    expect(result.generated).toEqual([]);
    expect(tts.batches).toEqual([]);
    expect(await audioFiles()).toEqual(["hangul-g.mp3", "s1.mp3", "sound-ga.mp3"]);
  });

  it("generates exactly one new file when one Sentence is added", async () => {
    await writePack(basePack);
    await generatePackAudio({ packDir, tts: fakeTts(), encoder: fakeEncoder });
    await writePack({ ...basePack, sentences: [...basePack.sentences, sentence("s2", "감사합니다.")] });

    const tts = fakeTts();
    const result = await generatePackAudio({ packDir, tts, encoder: fakeEncoder });

    expect(result.generated).toEqual(["audio/s2.mp3"]);
    expect(tts.batches).toEqual([["감사합니다."]]);
    expect(await audioFiles()).toEqual(["hangul-g.mp3", "s1.mp3", "s2.mp3", "sound-ga.mp3"]);
  });

  it("replaces placeholder audio: points the pack at the mp3 and removes the old file", async () => {
    const placeholderPack = {
      ...basePack,
      items: [item("hangul-g", "letter", "ㄱ", "audio/hangul-g.wav")],
      sentences: [],
    };
    const original = `{\n  "language": "ko",\n  "items": [\n    ${JSON.stringify(placeholderPack.items[0])}\n  ],\n  "sentences": [], "grammarNotes": [], "order": []\n}\n`;
    await writeFile(join(packDir, "pack.json"), original);
    await writeFile(join(packDir, "audio/hangul-g.wav"), "placeholder tone");

    await generatePackAudio({ packDir, tts: fakeTts(), encoder: fakeEncoder });

    expect((await readPack()).items[0].audio).toBe("audio/hangul-g.mp3");
    expect(await audioFiles()).toEqual(["hangul-g.mp3"]);
    // Only the audio reference changes; the hand-written layout is kept.
    expect(await read("pack.json")).toBe(original.replace('"audio/hangul-g.wav"', '"audio/hangul-g.mp3"'));
  });
});
