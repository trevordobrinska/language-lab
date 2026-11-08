import { buildQueue, gradeCard, type Card, type ContentPack, type Grade } from "../core";
import { audioUrl } from "../content/packs";
import { grammarNoteView, openGrammarNote } from "./grammarNoteView";
import type { HistoryLogStore } from "../storage/historyLogStore";
import { loadSettings, reviewSettings } from "../storage/settings";

export interface ReviewScreenDeps {
  readonly root: HTMLElement;
  readonly pack: ContentPack;
  readonly log: HistoryLogStore;
  readonly deviceId: string;
  /** Called after each grade is saved (e.g. to schedule a background sync). */
  readonly onGraded?: () => void;
}

/**
 * Today's Review: the card front (text + sound), the reveal, and the large
 * Again / Good buttons. Each grade is saved to the History Log before the
 * next card shows, and the queue is rebuilt from the log each time.
 */
export async function showReviewScreen({ root, pack, log, deviceId, onGraded }: ReviewScreenDeps): Promise<void> {
  const next = async () => {
    const now = new Date();
    // Settings are read each time, so changed caps apply to the very next queue.
    const queue = buildQueue({ pack, events: await log.all(), now, settings: reviewSettings(loadSettings(), now) });
    if (queue.length === 0) showDone(root);
    else if (queue[0].notDueUntil && queue[0].notDueUntil > now) showWaiting(root, queue[0].notDueUntil, next);
    else showCard(queue[0], queue.length);
  };

  const player = (path: string | undefined) => {
    const url = path ? audioUrl(pack, path) : undefined;
    return () => {
      if (url) new Audio(url).play().catch(() => {}); // Autoplay can be blocked until the first tap.
    };
  };

  /** A pattern's first appearance shows its Grammar Note before the card. */
  const showCard = (card: Card, remaining: number) => {
    const note = card.noteBeforeCard;
    if (!note) return showCardItself(card, remaining);
    root.replaceChildren(
      el("p", "remaining", `${remaining} to go`),
      grammarNoteView(note, { heading: "New grammar", closeLabel: "Got it", onClose: () => showCardItself(card, remaining) }),
    );
  };

  const showCardItself = (card: Card, remaining: number) => {
    const playFront = player(card.front.audio);
    const playBack = player(card.back.audio);

    root.replaceChildren(
      el("p", "remaining", `${remaining} to go`),
      ...front(card),
      ...(card.front.audio ? [button("play", card.kind === "letter" ? "▶ Play sound" : "▶ Play again", playFront)] : []),
      button("reveal", "Show answer", () => {
        root.querySelector(".reveal")?.remove();
        root.append(
          ...back(card),
          ...(card.back.audio ? [button("play", "▶ Native audio", playBack)] : []),
          // Reopen buttons sit in the reveal so they don't give the answer away on the front.
          ...(card.grammarNotes ?? []).map((note) => button("open-note", `Grammar Note: ${note.pattern}`, () => openGrammarNote(root, note))),
          el("div", "grades", "", [
            button("grade again", "Again", () => grade(card, "again")),
            button("grade good", "Good", () => grade(card, "good")),
          ]),
        );
        playBack();
      }),
    );
    playFront();
  };

  const grade = async (card: Card, grade: Grade) => {
    root.querySelectorAll("button").forEach((b) => (b.disabled = true));
    await log.add(gradeCard(card, grade, { now: new Date(), deviceId, eventId: crypto.randomUUID() }));
    onGraded?.();
    await next();
  };

  await next();
}

/** Before the reveal: a letter; a Listening Card's prompt (its audio plays); a Speaking Card's English. */
function front(card: Card): HTMLElement[] {
  switch (card.kind) {
    case "letter":
      return [el("div", "front", card.front.text ?? "")];
    case "listening":
      return [el("div", "front sentence", "🎧"), el("p", "prompt", "Listen, then recall the meaning aloud.")];
    case "speaking":
      return [el("div", "front sentence", card.front.text ?? ""), el("p", "prompt", "Say it in Korean, aloud.")];
  }
}

/** The reveal: the answer; for Sentences, the Target Language with the new Item highlighted, and the English. */
function back(card: Card): HTMLElement[] {
  // Romanisation is only on the card during the learner's first week; the core decides.
  const { text, meaning, newItem, romanisation } = card.back;
  const romanised = romanisation ? [el("p", "romanisation", romanisation)] : [];
  if (card.kind === "letter") return [el("div", "back", text), ...romanised];
  return [
    el("div", "back sentence", "", highlighted(text, newItem?.text)),
    ...romanised,
    ...(meaning ? [el("div", "meaning", meaning)] : []),
    ...(newItem ? [el("div", "new-item", "", [el("mark", "", newItem.text), document.createTextNode(` = ${newItem.meaning}`)])] : []),
  ];
}

/** `text` with the first occurrence of `part` wrapped in a <mark>. */
function highlighted(text: string, part: string | undefined): Node[] {
  const at = part ? text.indexOf(part) : -1;
  if (!part || at < 0) return [document.createTextNode(text)];
  return [
    document.createTextNode(text.slice(0, at)),
    el("mark", "", part),
    document.createTextNode(text.slice(at + part.length)),
  ];
}

/**
 * Only cards in their 10-minute step are left: a calm pause until the next
 * one is due, then the Review carries on by itself. If the learner leaves
 * the screen meanwhile, the pause just ends quietly.
 */
function showWaiting(root: HTMLElement, until: Date, carryOn: () => Promise<void>) {
  const countdown = el("p", "waiting-time", "");
  const view = el("div", "waiting", "", [countdown, el("p", "hint", "A card you're relearning comes back then. Nothing else is due.")]);
  root.replaceChildren(view);
  const tick = () => {
    if (!view.isConnected) return;
    const ms = until.getTime() - Date.now();
    if (ms <= 0) return void carryOn();
    const minutes = Math.ceil(ms / 60_000);
    countdown.textContent = `Next card in ${minutes} min`;
    setTimeout(tick, Math.min(ms, 15_000));
  };
  tick();
}

function showDone(root: HTMLElement) {
  root.replaceChildren(el("div", "done", "That's today's Review done."));
}

function el(tag: string, className: string, text: string, children: Node[] = []): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  node.append(...children);
  return node;
}

function button(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const node = el("button", className, text) as HTMLButtonElement;
  node.addEventListener("click", onClick);
  return node;
}
