# Commute Lessons ship as a podcast feed, not in the app

The learner drives an hour each way and uses an iPhone. iOS home-screen web apps stop audio when another app (like navigation) comes to the front, or when the screen locks (WebKit bug 291892, still open late 2025). So Commute Lessons are MP3 episodes the PC builds overnight from the History Log. They're published as an RSS feed on GitHub Pages and followed in Apple Podcasts via "Follow a Show by URL". That gives CarPlay, steering-wheel and Siri controls, offline downloads and resume.

## Consequences

Free GitHub Pages needs a public repo, so the feed is unlisted rather than private. That's acceptable because it holds only generated lesson audio, never the learner's voice. Pages caps sites at about 1 GB, so old episodes get pruned. Commute Lessons can't react to input in the moment; they adapt day by day instead.
