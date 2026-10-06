# Evidence Assistant

Upload a document, ask a question and open the source passage. Try nine original examples in English, Brazilian Portuguese and Spanish, or use your own PDF, PNG or JPEG. The three-language workspace follows the approved [document plan](docs/superpowers/plans/2026-10-06-document-workspace.md).

The credential-free demo extracts exact sentences without generating or translating answers. Text PDFs work directly. Scans/images need manual transcription or a configured optional vision provider after consent. Examples disclose prepared text; the cursive illustration is not a human handwriting benchmark. Handwriting remains experimental.

## Implemented: retrieval and extractive answers

Four original public documents, heading-based chunks, stable IDs, Unicode term matching, BM25 and sparse term-frequency cosine ranking. The immutable index can be reused without filesystem reads on each query. These vectors are not neural semantic embeddings; retrieval scores do not prove semantic correctness.

Demo answers quote complete source sentences and explicitly identify extraction. Strict answer validation checks structure, retrieved source IDs and exact quote substrings; semantic correctness remains unverified. See [answer contracts and limits](docs/answers.md).

The document workspace, HTTP API, public-corpus MCP and optional server-side OpenAI adapters are implemented. See [API setup](docs/api.md) and [MCP configuration](docs/mcp.md). Live provider calls have not been verified; baseline tests simulate external HTTP responses. `/technical-demo.html` preserves the earlier public-corpus UI; private documents never reach MCP.

## Local verification

Use Node.js >=22.13.0 (verified with 22.17.0) and npm. No external API credentials are needed.

```sh
npm ci
npm run verify
```

Start the local API after building:

```sh
npm run build
npm run start:api
```

In a second terminal, run `npm run dev:web`, then open `http://127.0.0.1:5173`. Choose an example or **Use my document**. Inspect its transcription and ask in the original language in extractive mode. A citation opens its page/passage. Saving a correction creates a new revision and clears the old answer.

Limits: one document, five pages, 10 MiB file, 16 MP image, 40,000 text characters, 15-second local read. Original previews stay in the browser. Extracted/reviewed text goes to the API and remains in memory for 30 minutes without API activity. Switching documents requests deletion; abrupt browser closure or failed deletion relies on TTL. Restart loses sessions. No permanent storage or authentication.

Recognition requires `OPENAI_API_KEY` and an explicit `OPENAI_VISION_MODEL` in the API environment; `OPENAI_MODEL` additionally enables generated answers. `.env` is not loaded automatically. Selected page images are sent only after recognition consent. Generation sends the question/retrieved text. No paid/live model or handwriting-quality test was run. Local cancellation cannot guarantee remote cancellation or billing.

Full browser/evaluation verification:

```sh
npm run evaluate
npm run benchmark
npm run build:web
npx playwright install chromium
npm run build:storybook
npm run test:e2e
```

[Executed measurements and limitations](eval/documents/README.md). CI uses Windows for reviewed baselines; hosted CI and deployment are separate results.

The browser stores only the interface-language preference. Without one, the app selects a supported browser language or falls back to English. Revision drafts survive page and view changes during the session. If a save response is lost, the app recovers the existing server revision; questions remain disabled while that revision cannot be confirmed, and the draft is preserved.

`verify` checks formatting, zero-warning lint, dependency boundaries, TypeScript, all current tests with core coverage gates, and core/API/MCP builds. Tests build workspace runtime exports first, so a clean checkout does not depend on ignored build artifacts. The coverage floors are 90% lines and 85% branches. See [retrieval decisions](docs/retrieval.md), [engineering rules](docs/engineering-quality.md) and [UX brief](docs/ux-design.md).

After `npm run build`, the runtime exports are available as `@evidence/core` from this workspace:

```js
import { loadCorpus, chunkDocuments, createRetriever } from '@evidence/core';

const documents = await loadCorpus('corpus');
const retriever = createRetriever(chunkDocuments(documents));
console.log(retriever.search('How should a regression strategy select tests?'));
```

The corpus and application code are original. No employer code or documents are included. The separately licensed UI UX Pro Max skill is covered by [third-party notices](THIRD_PARTY_NOTICES.md).
