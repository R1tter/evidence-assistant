# Evidence Assistant

An independently authored document assistant for inspecting retrieved evidence. The project is being implemented in verified stages from the approved [plan](docs/superpowers/plans/2026-10-06-evidence-assistant.md).

## Implemented: retrieval and extractive answers

Four original public documents, heading-based chunks, stable IDs, Unicode term matching, BM25 and sparse term-frequency cosine ranking. The immutable index can be reused without filesystem reads on each query. These vectors are not neural semantic embeddings; retrieval scores do not prove semantic correctness.

Demo answers quote complete source sentences and explicitly identify extraction. Strict answer validation checks structure, retrieved source IDs and exact quote substrings; semantic correctness remains unverified. See [answer contracts and limits](docs/answers.md).

The HTTP API, read-only MCP server and optional server-side OpenAI adapter are implemented. See [API setup and limits](docs/api.md) and [MCP host configuration](docs/mcp.md). Live provider calls have not been verified; baseline tests use mocked external HTTP responses. The product interface remains a subsequent plan stage.

## Local verification

Use Node.js 22.12 or newer (verified locally with 22.17.0) and npm. No external API credentials are needed.

```sh
npm ci
npm run verify
```

Start the local API after building:

```sh
npm run build
npm run start:api
```

`verify` checks formatting, zero-warning lint, dependency boundaries, TypeScript, all current tests with core coverage gates, and core/API/MCP builds. Tests build workspace runtime exports first, so a clean checkout does not depend on ignored build artifacts. The coverage floors are 90% lines and 85% branches. See [retrieval decisions](docs/retrieval.md), [engineering rules](docs/engineering-quality.md) and [UX brief](docs/ux-design.md).

After `npm run build`, the runtime exports are available as `@evidence/core` from this workspace:

```js
import { loadCorpus, chunkDocuments, createRetriever } from '@evidence/core';

const documents = await loadCorpus('corpus');
const retriever = createRetriever(chunkDocuments(documents));
console.log(retriever.search('How should a regression strategy select tests?'));
```

The corpus and application code are original. No employer code or documents are included. The separately licensed UI UX Pro Max skill is covered by [third-party notices](THIRD_PARTY_NOTICES.md).
