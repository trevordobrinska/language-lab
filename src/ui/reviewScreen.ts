import { buildQueue, gradeCard, type Card, type ContentPack, type Grade } from "../core";
import { audioUrl } from "../content/packs";
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
    else showCard(queue[0], queue.length);
  };

  const player = (path: string | undefined) => {
    const url = path ? audioUrl(pack, path) : undefined;
    return () => {
      if (url) new Audio(url).play().catch(() => {}); // Autoplay can be blocked until the first tap.
    };
  };

  const showCard = (card: Card, remaining: number) => {
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
  if (card.kind === "letter") return [el("div", "back", card.back.text)];
  const { text, meaning, newItem } = card.back;
  return [
    el("div", "back sentence", "", highlighted(text, newItem?.text)),
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
