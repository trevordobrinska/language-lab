import { buildQueue, gradeCard, type Card, type ContentPack, type Grade } from "../core";
import { audioUrl } from "../content/packs";
import type { HistoryLogStore } from "../storage/historyLogStore";

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
    const queue = buildQueue({ pack, events: await log.all(), now: new Date() });
    if (queue.length === 0) showDone(root);
    else showCard(queue[0], queue.length);
  };

  const showCard = (card: Card, remaining: number) => {
    const url = card.front.audio ? audioUrl(pack, card.front.audio) : undefined;
    const play = () => {
      if (url) new Audio(url).play().catch(() => {}); // Autoplay can be blocked until the first tap.
    };

    root.replaceChildren(
      el("p", "remaining", `${remaining} to go`),
      el("div", "front", card.front.text),
      button("play", "▶ Play sound", play),
      button("reveal", "Show answer", () => {
        root.querySelector(".reveal")?.remove();
        root.append(
          el("div", "back", card.back.text),
          el("div", "grades", "", [
            button("grade again", "Again", () => grade(card, "again")),
            button("grade good", "Good", () => grade(card, "good")),
          ]),
        );
      }),
    );
    play();
  };

  const grade = async (card: Card, grade: Grade) => {
    root.querySelectorAll("button").forEach((b) => (b.disabled = true));
    await log.add(gradeCard(card, grade, { now: new Date(), deviceId, eventId: crypto.randomUUID() }));
    onGraded?.();
    await next();
  };

  await next();
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
