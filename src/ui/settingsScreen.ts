import { loadSettings, syncTarget, updateSettings, type Settings } from "../storage/settings";

export interface SettingsScreenDeps {
  readonly root: HTMLElement;
  /** Ask for a background sync now (settings just changed, or the learner tapped Sync). */
  readonly requestSync: () => void;
  readonly onBack: () => void;
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
}

const SECTIONS: readonly SettingsSection[] = [syncSection];

/** The settings screen. Re-render it (call again) to refresh the last sync time. */
export function showSettingsScreen({ root, requestSync, onBack }: SettingsScreenDeps): void {
  const context: SectionContext = {
    settings: loadSettings(),
    save: (changes) => void updateSettings(changes),
    requestSync,
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
  if (!settings.lastSyncAt) return "Not synced yet.";
  return `Last synced ${new Date(settings.lastSyncAt).toLocaleString()}.`;
}

function input(type: string, placeholder: string, value = ""): HTMLInputElement {
  const node = document.createElement("input");
  node.type = type;
  node.placeholder = placeholder;
  node.value = value;
  node.autocomplete = "off";
  node.spellcheck = false;
  return node;
}

function labelled(text: string, control: HTMLElement): HTMLElement {
  const node = document.createElement("label");
  node.append(text, control);
  return node;
}

function el(tag: string, className: string, text: string, children: Node[] = []): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  node.append(...children);
  return node;
}

function button(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const node = el("button", className, text) as HTMLButtonElement;
  node.addEventListener("click", onClick);
  return node;
}
