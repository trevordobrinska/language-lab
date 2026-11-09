import { startOver } from "./core";
import { korean } from "./content/packs";
import { registerServiceWorker } from "./offline/registerServiceWorker";
import { deviceId } from "./storage/deviceId";
import { indexedDbHistoryLog } from "./storage/indexedDbHistoryLog";
import { loadSettings, syncTarget, updateSettings } from "./storage/settings";
import { backgroundSync } from "./sync/backgroundSync";
import { githubRemoteLog } from "./sync/githubRemoteLog";
import { describeSyncError } from "./sync/syncError";
import { syncHistoryLog } from "./sync/sync";
import { showReviewScreen } from "./ui/reviewScreen";
import { showHowReviewWorks } from "./ui/howReviewWorks";
import { showProgressScreen } from "./ui/progressScreen";
import { showSettingsScreen } from "./ui/settingsScreen";

const root = document.getElementById("app")!;
const log = indexedDbHistoryLog();
const device = deviceId();
let screen: "review" | "settings" | "progress" | "how-review-works" = "review";

// Sync runs in the background and never blocks Review. With no token set, it does nothing.
const syncer = backgroundSync({
  sync: async () => {
    const target = syncTarget(loadSettings());
    if (!target) return { ok: true };
    return syncHistoryLog({ local: log, remote: githubRemoteLog(target), deviceId: device });
  },
  now: () => new Date(),
  setTimer: (run, ms) => void setTimeout(run, ms),
  retryAfterMs: 5 * 60 * 1000,
  onSynced: (at) => {
    if (!syncTarget(loadSettings())) return;
    updateSettings({ lastSyncAt: at.toISOString(), lastSyncError: undefined });
    if (screen === "settings") showSettings();
  },
  onFailed: (error) => {
    console.warn("History Log sync failed; will retry", error);
    if (!syncTarget(loadSettings())) return;
    updateSettings({ lastSyncError: describeSyncError(error) });
    if (screen === "settings") showSettings();
  },
});
const requestSync = () => {
  if (navigator.onLine) void syncer.syncNow();
};
// Grades come quickly during a Review, so sync once things go quiet rather than after every card.
let afterGrades: ReturnType<typeof setTimeout> | undefined;
const syncSoon = () => {
  clearTimeout(afterGrades);
  afterGrades = setTimeout(requestSync, 30 * 1000);
};

const showReview = () => {
  screen = "review";
  void showReviewScreen({ root, pack: korean, log, deviceId: device, onGraded: syncSoon });
};
const showSettings = () => {
  screen = "settings";
  showSettingsScreen({ root, requestSync, onBack: showReview, openHowReviewWorks: showHowItWorks, startOver: startOverEverywhere });
};
/** Add a Reset to the History Log and sync it, so every device starts over. */
const startOverEverywhere = async () => {
  await log.add(startOver({ now: new Date(), deviceId: device, eventId: crypto.randomUUID() }));
  requestSync();
};
const showProgress = () => {
  screen = "progress";
  void showProgressScreen({ root, pack: korean, log, onBack: showReview });
};
const showHowItWorks = () => {
  screen = "how-review-works";
  showHowReviewWorks({ root, doneLabel: "Back to settings", onDone: showSettings });
};
/** First launch: explain Review once, then start it. */
const showFirstRun = () => {
  screen = "how-review-works";
  showHowReviewWorks({
    root,
    doneLabel: "Start Review",
    onDone: () => {
      updateSettings({ seenHowReviewWorks: true });
      showReview();
    },
  });
};

document.getElementById("open-settings")!.addEventListener("click", showSettings);
document.getElementById("open-progress")!.addEventListener("click", showProgress);
window.addEventListener("online", requestSync);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") requestSync();
});

if (loadSettings().seenHowReviewWorks) showReview();
else showFirstRun();
requestSync();
registerServiceWorker();
