import { DEFAULT_REVIEW_SETTINGS } from "../core";
import { loadSettings, syncTarget, updateSettings, type Settings } from "../storage/settings";
import { button, el } from "./dom";

export interface SettingsScreenDeps {
  readonly root: HTMLElement;
  /** Ask for a background sync now (settings just changed, or the learner tapped Sync). */
  readonly requestSync: () => void;
  readonly onBack: () => void;
  /** Reopen the first-run "How Review works" screen. */
  readonly openHowReviewWorks: () => void;
  /** Add a Reset to the History Log (the learner has already confirmed). */
  readonly startOver: () => Promise<void>;
}

/**
 * One block of the settings screen. To add settings (e.g. ticket 08's daily
 * caps), write a section and add it to `SECTIONS`; `save` stores the fields
 * you pass and keeps the rest.
 */
export type SettingsSection = (context: SectionContext) => HTMLElement;

export interface SectionContext {
  readonly settings: Settings;
  readonly save: (changes: Partial<Settings>) => void;
  readonly requestSync: () => void;
  readonly openHowReviewWorks: () => void;
  readonly startOver: () => Promise<void>;
}

const SECTIONS: readonly SettingsSection[] = [dailyCapsSection, syncSection, howReviewWorksSection, startOverSection];

function startOverSection({ startOver }: SectionContext): HTMLElement {
  const status = el("p", "hint", "");
  const confirmAndStartOver = async () => {
    const sure = window.confirm(
      "Start over from nothing? Every card becomes new again and your progress goes back to zero, on every device once it syncs. Your past reviews stay in the History Log but stop counting.",
    );
    if (!sure) return;
    await startOver();
    status.textContent = "Done. Your next Review starts from the beginning.";
  };
  return el("section", "settings-section", "", [
    el("h2", "", "Start over"),
    el("p", "hint", "Set every card back to new and your progress to zero, on all your devices. Can't be undone."),
    button("save", "Start over", () => void confirmAndStartOver()),
    status,
  ]);
}

function howReviewWorksSection({ openHowReviewWorks }: SectionContext): HTMLElement {
  return el("section", "settings-section", "", [
    el("h2", "", "How Review works"),
    el("p", "hint", "The routine (recall, reveal, grade honestly) and the research behind each Method."),
    button("save", "How Review works", openHowReviewWorks),
  ]);
}

function dailyCapsSection({ settings, save }: SectionContext): HTMLElement {
  const newItems = numberInput(settings.newItemsPerDay ?? DEFAULT_REVIEW_SETTINGS.newItemsPerDay);
  const reviews = numberInput(settings.reviewsPerDay ?? DEFAULT_REVIEW_SETTINGS.reviewsPerDay);
  const status = el("p", "caps-status", "");

  const saveCaps = () => {
    const newItemsPerDay = Number(newItems.value);
    const reviewsPerDay = Number(reviews.value);
    if (![newItemsPerDay, reviewsPerDay].every((n) => Number.isInteger(n) && n >= 0)) {
      status.textContent = "Use whole numbers, 0 or more.";
      return;
    }
    save({ newItemsPerDay, reviewsPerDay });
    status.textContent = "Saved. Your next Review uses these.";
  };

  return el("section", "settings-section", "", [
    el("h2", "", "Daily caps"),
    el(
      "p",
      "hint",
      "The most new items and reviews in one day. Reviews over the cap wait for the next day, with the cards you're closest to forgetting first.",
    ),
    labelled("New items per day", newItems),
    labelled("Reviews per day", reviews),
    button("save", "Save caps", saveCaps),
    status,
  ]);
}

function numberInput(value: number): HTMLInputElement {
  const node = input("number", "", String(value));
  node.min = "0";
  node.step = "1";
  node.inputMode = "numeric";
  return node;
}

/** The settings screen. Re-render it (call again) to refresh the last sync time. */
export function showSettingsScreen({ root, requestSync, onBack, openHowReviewWorks, startOver }: SettingsScreenDeps): void {
  const context: SectionContext = {
    settings: loadSettings(),
    save: (changes) => void updateSettings(changes),
    requestSync,
    openHowReviewWorks,
    startOver,
  };
  root.replaceChildren(
    el("h1", "settings-title", "Settings"),
    ...SECTIONS.map((section) => section(context)),
    button("back", "Back to Review", onBack),
  );
}

function syncSection({ settings, save, requestSync }: SectionContext): HTMLElement {
  const token = input("password", "GitHub token", settings.githubToken);
  const owner = input("text", "Data repo owner", settings.dataRepoOwner);
  const repo = input("text", "Data repo name", settings.dataRepoName);
  const status = el("p", "sync-status", syncStatus(settings));

  const saveAndSync = () => {
    save({ githubToken: token.value.trim(), dataRepoOwner: owner.value.trim(), dataRepoName: repo.value.trim() });
    status.textContent = syncStatus(loadSettings());
    requestSync();
  };

  return el("section", "settings-section", "", [
    el("h2", "", "Sync"),
    el(
      "p",
      "hint",
      "Backs up your History Log to your private GitHub data repo. Use a fine-grained token limited to that one repo, with Contents read and write. Review works without it.",
    ),
    labelled("GitHub token", token),
    labelled("Data repo owner", owner),
    labelled("Data repo name", repo),
    button("save", "Save and sync now", saveAndSync),
    status,
  ]);
}

function syncStatus(settings: Settings): string {
  if (!syncTarget(settings)) return "Sync is off until a token and data repo are set.";
  const last = settings.lastSyncAt ? `Last synced ${new Date(settings.lastSyncAt).toLocaleString()}.` : "Not synced yet.";
  return settings.lastSyncError ? `${last} Latest attempt failed: ${settings.lastSyncError}` : last;
}

function input(type: string, placeholder: string, value = ""): HTMLInputElement {
  const node = document.createElement("input");
  node.type = type;
  node.placeholder = placeholder;
  node.value = value;
  node.autocomplete = "off";
  node.spellcheck = false;
  // iOS would otherwise capitalise and "correct" tokens and repo names.
  node.autocapitalize = "off";
  node.setAttribute("autocorrect", "off");
  return node;
}

function labelled(text: string, control: HTMLElement): HTMLElement {
  const node = document.createElement("label");
  node.append(text, control);
  return node;
}
