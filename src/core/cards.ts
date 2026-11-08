import { AUDIO_ITEM_KINDS, type ContentPack, type Item, type Sentence } from "./contentPack";

/**
 * - `letter`: hear and see a letter or sound, recall what it is.
 * - `listening`: hear a Sentence, recall its meaning.
 * - `speaking`: see a Sentence's English, say it aloud in the Target Language.
 */
export type CardKind = "letter" | "listening" | "speaking";

/**
 * One card in today's queue: what to show before and after the reveal.
 * Fields are optional where a kind doesn't use them, so later tickets can add
 * more (romanisation, a Grammar Note) without changing the existing ones.
 */
export interface Card {
  /** Stable ID used in History Log events: `letter:<itemId>`, `listening:<sentenceId>` or `speaking:<sentenceId>`. */
  readonly id: string;
  readonly kind: CardKind;
  /** Every Item the card practises (a letter card's own Item; a Sentence's `itemIds`). */
  readonly itemIds: readonly string[];
  readonly front: {
    /** Text to show before the reveal: the letter, or a Speaking Card's English. Listening Cards have none. */
    readonly text?: string;
    /** Audio path relative to the pack's folder, played on showing the front and replayable before the reveal. */
    readonly audio?: string;
  };
  readonly back: {
    /** The answer to check recall against: a letter's meaning, or a Sentence in the Target Language. */
    readonly text: string;
    /** A Sentence's English meaning. */
    readonly meaning?: string;
    /** Audio played on the reveal (a Speaking Card's native audio). */
    readonly audio?: string;
    /** The Item this Sentence introduces, to highlight in the reveal. */
    readonly newItem?: { readonly text: string; readonly meaning: string };
  };
}

export const letterCardId = (itemId: string) => `letter:${itemId}`;
export const listeningCardId = (sentenceId: string) => `listening:${sentenceId}`;
export const speakingCardId = (sentenceId: string) => `speaking:${sentenceId}`;

/**
 * Whether a new card brings in a new Item, so it counts towards the daily
 * new-Item cap. A Speaking Card practises a Sentence already heard, so it doesn't.
 */
export const bringsNewItem = (cardId: string) => !cardId.startsWith("speaking:");

/** Items whose cards are letter cards: the script (letters, syllable blocks) and its sounds, met before any Sentence. */
export const isLetterOrSound = (item: Item) => AUDIO_ITEM_KINDS.includes(item.kind);

export function letterCard(item: Item): Card {
  return {
    id: letterCardId(item.id),
    kind: "letter",
    itemIds: [item.id],
    front: { text: item.text, audio: item.audio },
    back: { text: item.meaning },
  };
}

export function listeningCard(sentence: Sentence, newItem: Item | undefined): Card {
  return {
    id: listeningCardId(sentence.id),
    kind: "listening",
    itemIds: sentence.itemIds,
    front: { audio: sentence.audio },
    back: { text: sentence.text, meaning: sentence.meaning, ...highlight(newItem) },
  };
}

export function speakingCard(sentence: Sentence, newItem: Item | undefined): Card {
  return {
    id: speakingCardId(sentence.id),
    kind: "speaking",
    itemIds: sentence.itemIds,
    front: { text: sentence.meaning },
    back: { text: sentence.text, meaning: sentence.meaning, audio: sentence.audio, ...highlight(newItem) },
  };
}

function highlight(item: Item | undefined) {
  return item ? { newItem: { text: item.text, meaning: item.meaning } } : {};
}

/** Every card the pack can produce, in the authored order: letter cards, and each Sentence's Listening then Speaking Card. */
export function packCards(pack: ContentPack): Card[] {
  const items = new Map(pack.items.map((item) => [item.id, item]));
  const sentences = new Map(pack.sentences.map((s) => [s.id, s]));
  return pack.order.flatMap((id) => {
    const item = items.get(id);
    if (item) return [letterCard(item)];
    const sentence = sentences.get(id);
    if (!sentence) return [];
    const newItem = items.get(sentence.introduces);
    return [listeningCard(sentence, newItem), speakingCard(sentence, newItem)];
  });
}
