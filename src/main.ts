import { korean } from "./content/packs";
import { registerServiceWorker } from "./offline/registerServiceWorker";
import { deviceId } from "./storage/deviceId";
import { indexedDbHistoryLog } from "./storage/indexedDbHistoryLog";
import { showReviewScreen } from "./ui/reviewScreen";

void showReviewScreen({
  root: document.getElementById("app")!,
  pack: korean,
  log: indexedDbHistoryLog(),
  deviceId: deviceId(),
});

registerServiceWorker();
