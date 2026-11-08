/**
 * `npm run audio -- <language>` (default `ko`): generate the missing audio
 * for `content/<language>/` with MeloTTS and ffmpeg. Setup: docs/audio-setup.md.
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ffmpegMp3, meloPython, meloTts } from "./backends.ts";
import { generatePackAudio } from "./generatePackAudio.ts";

/** MeloTTS's language codes, by the pack's BCP 47 tag. */
const meloLanguage: Record<string, string> = { ko: "KR", ja: "JP", zh: "ZH", es: "ES", en: "EN", fr: "FR" };

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const language = process.argv[2] ?? "ko";
const melo = meloLanguage[language];
if (!melo) {
  console.error(`MeloTTS has no voice for "${language}".`);
  process.exit(1);
}

const packDir = join(repoRoot, "content", language);
const { generated } = await generatePackAudio({
  packDir,
  tts: meloTts(meloPython(repoRoot), melo),
  encoder: ffmpegMp3(),
}).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
console.log(generated.length === 0 ? "All audio already exists." : `Generated ${generated.length} file(s):\n  ${generated.join("\n  ")}`);
