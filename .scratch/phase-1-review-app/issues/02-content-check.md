# 02: Content check

**What to build:** Bad content can't reach the phone. A content check runs over a content pack as part of the normal test run and fails, with a clear message naming the offending entry, when:
- a Sentence brings in anything other than exactly one new Item at its point in the introduction order;
- an Item ID is used but never defined;
- an audio file is missing;
- a Grammar Note points at an Item that isn't a grammar pattern.

**Blocked by:** 01

**Status:** resolved

- [x] The check runs on the real Korean content pack during the test run, and a failure fails the run
- [x] Each kind of error has a small sample pack proving the check catches it
- [x] The error message names the Sentence or Item and what's wrong
- [x] The current Korean pack passes

## Comments

**Interface:** `checkContentPack(pack, audioExists)` lives in `src/core/contentCheck.ts` and is exported from `src/core/index.ts`. It's pure. `audioExists(path)` answers whether a pack-relative audio path has a file. It returns a `string[]` with one message per problem, and each message names the Sentence, Item, Grammar Note or order entry at fault. An empty list means the pack is clean.

**What it catches:** it walks `order`, and every non-Sentence ID listed there counts as known. Each Sentence must bring in exactly one Item that isn't known yet, and that Item must be its `introduces`. It also flags:
- a Sentence that's missing from `order`;
- an undefined Item ID in a Sentence's `itemIds` or `introduces`, in `order`, or in a Grammar Note;
- a missing audio file for any Item or Sentence, and a letter/sound Item with no `audio`;
- a Grammar Note on an Item that isn't `grammar`.

**How it runs:** `src/content/contentCheck.test.ts` runs the check on the real Korean pack during `npm test`. It uses `audioUrl` (Vite's bundled audio glob) as `audioExists` and expects `[]`, so any problem fails the run and the diff shows the messages. Fixture packs for each kind of error are in `src/core/contentCheck.test.ts`. When a new language's pack arrives, add one line for it to the real-pack test.
