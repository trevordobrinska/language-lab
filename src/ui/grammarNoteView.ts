import type { CardGrammarNote } from "../core";
import { button, el } from "./dom";

export interface GrammarNoteViewOptions {
  /** Small heading above the pattern, e.g. "New grammar". */
  readonly heading: string;
  /** Label of the button that leaves the note, e.g. "Got it". */
  readonly closeLabel: string;
  readonly onClose: () => void;
}

/** The Grammar Note view: the pattern, its meaning, the explanation and an example. */
export function grammarNoteView(note: CardGrammarNote, { heading, closeLabel, onClose }: GrammarNoteViewOptions): HTMLElement {
  return el("section", "grammar-note", "", [
    el("p", "note-heading", heading),
    el("p", "note-pattern", note.pattern),
    el("p", "note-meaning", note.meaning),
    el("p", "note-text", note.text),
    ...(note.example ? [el("p", "note-example", note.example)] : []),
    button("close-note", closeLabel, onClose),
  ]);
}

/**
 * Opens a card's Grammar Note on top of the card, leaving the card as it was
 * (revealed or not) underneath; "Back to card" closes it.
 */
export function openGrammarNote(root: HTMLElement, note: CardGrammarNote): void {
  const overlay = el("div", "grammar-note-overlay", "");
  overlay.append(grammarNoteView(note, { heading: "Grammar Note", closeLabel: "Back to card", onClose: () => overlay.remove() }));
  root.append(overlay);
}
