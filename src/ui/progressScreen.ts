import { progress, type ContentPack, type Tally } from "../core";
import type { HistoryLogStore } from "../storage/historyLogStore";
import { loadSettings, reviewSettings } from "../storage/settings";
import { el } from "./dom";

export interface ProgressScreenDeps {
  readonly root: HTMLElement;
  readonly pack: ContentPack;
  readonly log: HistoryLogStore;
  readonly onBack: () => void;
}

/**
 * Where the learner stands, in learning terms only: Items and Sentences
 * learned, cards due, and Mission 1's vocabulary. No points, badges or streaks.
 */
export async function showProgressScreen({ root, pack, log, onBack }: ProgressScreenDeps): Promise<void> {
  const now = new Date();
  const result = progress({ pack, events: await log.all(), now, settings: reviewSettings(loadSettings(), now) });

  const back = el("button", "back", "Back to Review") as HTMLButtonElement;
  back.addEventListener("click", onBack);

  root.replaceChildren(
    el("h1", "page-title", "Progress"),
    ...(result.mission
      ? [row(`${result.mission.name}: vocabulary learned`, outOf(result.mission), result.mission)]
      : []),
    row("Items learned", outOf(result.items), result.items),
    row("Sentences learned", outOf(result.sentences), result.sentences),
    row("Cards in today's Review", String(result.todaysReview)),
    row(
      "Cards due",
      String(result.cardsDue),
      undefined,
      result.cardsDue > result.todaysReview ? "The rest wait for later days, closest to being forgotten first." : undefined,
    ),
    el(
      "p",
      "hint",
      "Learned means you graded it Good last time you saw it. A card you mark Again stops counting until you pass it again.",
    ),
    back,
  );
}

const outOf = ({ learned, total }: Tally) => `${learned} of ${total}`;

function row(label: string, value: string, tally?: Tally, note?: string): HTMLElement {
  const children: Node[] = [el("div", "stat-label", label), el("div", "stat-value", value)];
  if (tally && tally.total > 0) {
    const bar = document.createElement("progress");
    bar.max = tally.total;
    bar.value = tally.learned;
    children.push(bar);
  }
  if (note) children.push(el("p", "hint", note));
  return el("section", "stat", "", children);
}
