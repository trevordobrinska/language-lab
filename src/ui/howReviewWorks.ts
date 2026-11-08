/**
 * The "How Review works" screen: shown once on first launch, and reopened
 * from settings. It explains the routine (recall first, then reveal, then
 * grade yourself honestly) and names each Method with its Evidence Tier and
 * citation (spec "Further Notes").
 */

export interface Method {
  readonly name: string;
  readonly tier: "strong" | "promising";
  /** What it means for the learner, in one sentence. */
  readonly why: string;
  readonly citation: string;
}

export const METHODS: readonly Method[] = [
  {
    name: "Retrieval practice",
    tier: "strong",
    why: "Pulling an answer out of memory before seeing it strengthens it far more than rereading, so always try to recall before you reveal.",
    citation: "Roediger & Karpicke 2006; Karpicke & Roediger 2008",
  },
  {
    name: "Spaced repetition (FSRS)",
    tier: "strong",
    why: "Cards come back just as you're about to forget them, aiming for 90% recall, so each review does the most work.",
    citation: "Cepeda et al. 2006; Ye, Su & Cao 2022 (FSRS)",
  },
  {
    name: "Interleaved review",
    tier: "strong",
    why: "Old and new cards are mixed in one queue rather than practised in blocks.",
    citation: "Kornell & Bjork 2008; Rohrer & Taylor 2007",
  },
  {
    name: "Grammar Notes, then practice",
    tier: "strong",
    why: "A short explicit rule, shown the first time a pattern appears, followed by sentences that use it.",
    citation: "Norris & Ortega 2000; Spada & Tomita 2010",
  },
  {
    name: "Recognition before production",
    tier: "promising",
    why: "You hear and understand a sentence (Listening Card) a few times before you're asked to say it (Speaking Card). How early to speak is still debated.",
    citation: "VanPatten & Cadierno 1993; the speak-early vs. silent-period debate",
  },
  {
    name: "Romanisation in week 1 only",
    tier: "promising",
    why: "Romanised spelling helps you start but can pull your pronunciation towards English, so it disappears after your first week.",
    citation: "Bassetti 2008",
  },
];

const STEPS: readonly string[] = [
  "Recall first. Listen to the sentence (or read the English) and say your answer aloud before anything else.",
  "Then reveal. Tap Show answer and check what you said against it.",
  "Grade yourself honestly. Good if you got it, Again if you didn't. Again isn't a failure: the card comes back in a few minutes, and the schedule only works if the grades are true.",
];

export interface HowReviewWorksDeps {
  readonly root: HTMLElement;
  /** The button at the bottom: "Start Review" on first launch, "Back to settings" when reopened. */
  readonly doneLabel: string;
  readonly onDone: () => void;
}

export function showHowReviewWorks({ root, doneLabel, onDone }: HowReviewWorksDeps): void {
  const steps = document.createElement("ol");
  steps.className = "steps";
  steps.append(...STEPS.map((step) => el("li", "", step)));

  const methods = el("section", "methods", "", [
    el("h2", "", "Why it works"),
    ...METHODS.map((method) =>
      el("div", "method", "", [
        el("h3", "", "", [document.createTextNode(`${method.name} `), el("span", `tier ${method.tier}`, `Evidence: ${method.tier}`)]),
        el("p", "", method.why),
        el("p", "citation", method.citation),
      ]),
    ),
    el("p", "hint", "Strong: well backed by research. Promising: used here, but the evidence is weaker."),
  ]);

  const done = el("button", "start", doneLabel) as HTMLButtonElement;
  done.addEventListener("click", onDone);

  root.replaceChildren(el("h1", "page-title", "How Review works"), steps, methods, done);
}

function el(tag: string, className: string, text: string, children: Node[] = []): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  node.append(...children);
  return node;
}
