# No AI calls from the app at runtime

Hard constraint: no extra spending, and the user's Claude subscription covers Claude Code but not the paid API. So all learning content (lessons, sentences, Review cards, Commute Lesson scripts) is written ahead of time by Claude Code sessions and saved as files the app plays back. The only live AI is Conversation Practice during a Study Session on the PC, where the app calls the locally installed Claude Code under the subscription. The phone app makes no AI calls. There is no API key.

## Considered Options

- **Claude API**: best fit technically, but every token costs money.
- **Local LLM** (the RX 7800 XT's 16 GB fits about a 14B model): free, but noticeably worse than Claude at catching and explaining learner errors. The user would accept it only at equal quality, which it doesn't reach.

## Consequences

Conversation Practice only happens at the PC. Content changes need a Claude Code authoring session, not a button in the app.
