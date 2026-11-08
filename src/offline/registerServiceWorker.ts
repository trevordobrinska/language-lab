import { SERVICE_WORKER_FILE } from "./cachePlan";

/**
 * Registers the service worker in production builds. When a newly published
 * build takes over (it activates as soon as it has cached everything), the
 * page reloads once so the new version shows on this open. The History Log is
 * in IndexedDB, so the reload loses nothing but an ungraded reveal. On iOS a
 * home-screen app is often resumed rather than relaunched, so coming back to
 * the app also checks for an update.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const container = navigator.serviceWorker;
  const isUpdate = container.controller !== null; // first install: nothing to reload
  let reloading = false;
  container.addEventListener("controllerchange", () => {
    if (!isUpdate || reloading) return;
    reloading = true;
    location.reload();
  });
  container
    .register(`./${SERVICE_WORKER_FILE}`, { updateViaCache: "none" })
    .then((registration) => {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {}); // offline: try next time
      });
    })
    .catch((error) => console.warn("Service worker not registered; the app won't work offline.", error));
}
