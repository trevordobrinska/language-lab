# 03: Audio generation with MeloTTS

**What to build:** One command on the PC creates an audio file for every Sentence and every Hangul or sound Item in a content pack, using MeloTTS (Korean) on the CPU. It never involves the phone app or any paid service. It skips files that already exist, so adding content only generates what's new. The generated files replace ticket 01's placeholders and are committed with the content.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Setup steps for MeloTTS on Windows are documented (installing it may need the user to step in, so flag it if it does)
- [ ] One command generates compressed audio for every Sentence and audio-bearing Item in the pack
- [ ] Running it again creates no new files. Adding one Sentence generates exactly one new file
- [ ] The file names and references match what the content pack expects, and the content check passes
- [ ] Placeholder audio from 01 is replaced
