import type { ContentPack } from "./contentPack";

/**
 * The content check: finds content that must not reach the phone. Returns one
 * message per problem, each naming the offending Sentence, Item or Grammar
 * Note; an empty list means the pack is fine.
 *
 * `audioExists` answers whether an audio path (relative to the pack's folder)
 * has a file, so the check itself stays pure.
 */
export function checkContentPack(pack: ContentPack, audioExists: (path: string) => boolean): string[] {
  const problems: string[] = [];
  const items = new Map(pack.items.map((item) => [item.id, item]));

  const sentences = new Map(pack.sentences.map((sentence) => [sentence.id, sentence]));

  for (const id of pack.order) {
    if (!items.has(id) && !sentences.has(id)) {
      problems.push(`The introduction order lists "${id}", which is not a defined Item or Sentence`);
    }
  }

  for (const note of pack.grammarNotes) {
    const item = items.get(note.itemId);
    if (!item) {
      problems.push(`The Grammar Note for Item "${note.itemId}" points at an Item that is not defined`);
    } else if (item.kind !== "grammar") {
      problems.push(`The Grammar Note for Item "${note.itemId}" points at a ${item.kind} Item, not a grammar pattern`);
    }
  }

  for (const item of pack.items) {
    if (item.audio === undefined) {
      if (item.kind === "letter" || item.kind === "sound") problems.push(`Item "${item.id}" is a ${item.kind} Item with no audio`);
    } else if (!audioExists(item.audio)) {
      problems.push(`Item "${item.id}" has audio "${item.audio}", but the file is missing`);
    }
  }

  for (const sentence of pack.sentences) {
    if (!audioExists(sentence.audio)) {
      problems.push(`Sentence "${sentence.id}" has audio "${sentence.audio}", but the file is missing`);
    }
    for (const id of sentence.itemIds) {
      if (!items.has(id)) problems.push(`Sentence "${sentence.id}" uses Item "${id}", which is not defined`);
    }
    if (!items.has(sentence.introduces)) {
      problems.push(`Sentence "${sentence.id}" introduces Item "${sentence.introduces}", which is not defined`);
    }
  }

  // Walk the introduction order, tracking which Items the learner has met.
  const known = new Set<string>();
  for (const id of pack.order) {
    const sentence = sentences.get(id);
    if (!sentence) {
      known.add(id);
      continue;
    }
    const brought = [...new Set(sentence.itemIds.filter((itemId) => !known.has(itemId)))];
    if (brought.length === 0) {
      problems.push(
        `Sentence "${sentence.id}" brings in no new Item; it must bring in exactly one ("${sentence.introduces}" was already introduced)`,
      );
    } else if (brought.length > 1) {
      const list = brought.map((itemId) => `"${itemId}"`).join(", ");
      problems.push(`Sentence "${sentence.id}" brings in ${brought.length} new Items (${list}); it must bring in exactly one`);
    } else if (brought[0] !== sentence.introduces) {
      problems.push(`Sentence "${sentence.id}" brings in "${brought[0]}", but says it introduces "${sentence.introduces}"`);
    }
    for (const itemId of brought) known.add(itemId);
  }

  const ordered = new Set(pack.order);
  for (const sentence of pack.sentences) {
    if (!ordered.has(sentence.id)) problems.push(`Sentence "${sentence.id}" is not in the introduction order`);
  }

  return problems;
}
