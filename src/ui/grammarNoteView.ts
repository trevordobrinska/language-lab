import type { CardGrammarNote } from "../core";

export interface GrammarNoteViewOptions {
  /** Small heading above the pattern, e.g. "New grammar". */
  readonly heading: string;
  /** Label of the button that leaves the note, e.g. "Got it". */
  readonly closeLabel: string;
  readonly onClose: () => void;
}

/** The Grammar Note view: the pattern, its meaning, the explanation and an example. */
export function grammarNoteView(note: CardGrammarNote, { heading, closeLabel, onClose }: GrammarNoteViewOptions): HTMLElement {
  const view = document.createElement("section");
  view.className = "grammar-note";
  const close = document.createElement("button");
  close.className = "close-note";
  close.textContent = closeLabel;
  close.addEventListener("click", onClose);
  view.append(
    text("p", "note-heading", heading),
    text("p", "note-pattern", note.pattern),
    text("p", "note-meaning", note.meaning),
    text("p", "note-text", note.text),
    ...(note.example ? [text("p", "note-example", note.example)] : []),
    close,
  );
  return view;
}

/**
 * Opens a card's Grammar Note on top of the card, leaving the card as it was
 * (revealed or not) underneath; "Back to card" closes it.
 */
export function openGrammarNote(root: HTMLElement, note: CardGrammarNote): void {
  const overlay = document.createElement("div");
  overlay.className = "grammar-note-overlay";
  overlay.append(grammarNoteView(note, { heading: "Grammar Note", closeLabel: "Back to card", onClose: () => overlay.remove() }));
  root.append(overlay);
}

function text(tag: string, className: string, content: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = content;
  return node;
}
