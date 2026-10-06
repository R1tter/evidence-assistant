# ADR 0005 — temporary document capabilities and browser-safe contracts

Accepted, 6 October 2026.

Original PDFs/images are parsed and previewed locally. The API receives bounded extracted/reviewed text; selected raster pages reach the configured recognition provider only after explicit consent. The frontend keeps tokens in memory and sends them in a header. It uses the public browser-safe core/contracts entry to validate unknown responses. The filesystem-capable core main entry remains prohibited in browser runtime imports.

One API process owns up to 20 capability sessions and a 50 MiB serialized document/chunk budget. Tokens contain 32 random bytes. Sessions expire after 30 minutes without API activity, are lazily/timer cleaned and can be explicitly deleted. There is no database, browser persistence, cross-session lookup or MCP private-session access. Closing a browser abruptly may leave server text until TTL; restart loses sessions. The byte budget is not a strict process-heap limit. Distributed storage, authentication and hosting are outside this local milestone.

Every edit or recognized transcription creates an immutable revision and a fresh index. Requests name their revision; queued and completed provider work rechecks it. Citation IDs include document/revision/page/block. A citation opens its page and exact transcription passage, then returns focus to the clicked source button. There are no invented image coordinates.

Extractive document mode selects a sentence by lexical overlap. It preserves the source language and PDF line breaks; it does not implement semantic or cross-language search. Generated answers use a separate optional provider mode. Exact quote checks concern the current transcription, not OCR accuracy, factual truth or semantic correctness.
