# 05: Offline install

**What to build:** The learner can add Language Lab to the iPhone home screen, open it like an app, and run a full Review in airplane mode. A service worker caches the app, the content pack and all audio. When a new version is published, it's picked up the next time the app opens. Every stored name (local storage, service-worker caches) starts with `language-lab`, because the domain is shared with the Arcade games.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A web app manifest and icons let the app be added to the home screen and open in standalone mode
- [ ] Once loaded, a Review works with the network turned off, including audio
- [ ] Publishing a new build is picked up on the next open, with no manual reinstall
- [ ] Every storage and cache name starts with `language-lab`
- [ ] The app works when served from a sub-path (the Language Lab path on the GitHub Pages domain)
