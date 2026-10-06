# Evidence Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a recruiter-friendly, independently developed document assistant with inspectable evidence, optional LLM generation, MCP tools, and reproducible quality checks.

**Architecture:** An npm TypeScript workspace contains a shared retrieval/validation library, a Fastify API, a React/Vite frontend, and an MCP stdio server. API and MCP consume the same immutable corpus and retrieval service. Demo answers are extractive; optional OpenAI Responses API generation is server-side only.

**Tech Stack:** Node.js 22+, TypeScript, npm workspaces, React, Vite, Fastify, Zod, Vitest, Testing Library, Playwright, official MCP TypeScript SDK, OpenAI SDK. Resolve compatible stable versions at installation and commit the lockfile; use one MCP SDK major consistently with its official documentation.

**Spec:** `docs/superpowers/specs/2026-10-06-evidence-assistant-design.md`

**Quality contract:** `docs/engineering-quality.md`

**UX brief:** `docs/ux-design.md`

## Global Constraints

- New local project directory: `evidence-assistant/` inside the current workspace; initialize an independent Git repository there. Copy the approved spec and this plan into it before implementation commits.
- No proprietary code, documents, data, architecture, or visual identity from Black Box or employers.
- English product interface; English README and Portuguese companion.
- Questions: 1–1,000 trimmed characters. Retrieve at most five fragments.
- Fixed original public corpus; no upload, authentication, conversation persistence, database, or live web retrieval.
- Demo and CI need no external credentials. Optional real-provider checks are reported separately.
- No secrets in frontend, commits, fixtures, logs, or examples. No deployment or paid requests during baseline verification.
- MCP tools are read-only. The web application calls HTTP directly and must not claim its requests traverse MCP.
- Structural and quote validation do not establish semantic truth. No invented test metrics.
- Copy the quality contract and UX brief into the independent project; root `AGENTS.md` references both. These requirements are acceptance gates, not optional suggestions.
- Apply strict TypeScript and automated package boundaries, zero-warning lint, formatting, core coverage gates, and design-state verification described in the quality contract.
- Use the installed `.agents/skills/ui-ux-pro-max/SKILL.md` for visual direction, interaction and UX review. Its verified recommendations are recorded in the UX brief. Copy the complete workspace skill into the new project's `.agents/skills/` so its data and scripts remain usable there; preserve repository provenance and license. Read the skill before applying it.

## Review Focus

- Empty, whitespace-only, and oversized questions: reject before search or provider use (Task 3).
- Zero-vocabulary queries and equal scores: return stable results without NaN and abstain when unsupported (Task 1).
- Fabricated citations and altered excerpts: reject even when provider JSON is syntactically valid (Task 2).
- Provider refusal, malformed output, and timeouts: safe errors without credential leakage (Task 3).
- Rapid submissions and keyboard-only source inspection: prevent stale answer replacement and support accessible navigation (Task 5).

## File map

- `packages/core/src/{types,corpus,retrieval,validation,answers}.ts`: public contracts, loading/chunking, retrieval, evidence checking, extractive answers.
- `corpus/*.md`, `eval/cases.json`, `scripts/evaluate.ts`: original source documents and reproducible evaluation.
- `apps/api/src/{app,server,provider}.ts`: HTTP boundary, startup/configuration, optional generation.
- `apps/mcp/src/{server,stdio}.ts`: tool registration and process transport.
- `apps/web/src/{App,api,styles}.tsx|ts|css`: accessible product UI, typed HTTP client, responsive layout.
- Adjacent `*.test.ts` / `*.test.tsx`: unit and integration checks; `tests/e2e/assistant.spec.ts`: browser flows.
- Root package/TypeScript/Vitest/Playwright configuration, `.github/workflows/ci.yml`, `.env.example`, `.gitignore`, README files and `docs/architecture.md`.
- Root `AGENTS.md`, ESLint/Prettier configuration and `scripts/check-boundaries.ts`: maintainability rules and automated dependency direction.
- `apps/web/.storybook/`, component `*.stories.tsx` and `docs/ux-preview.html`: component reference states and pre-implementation visual proposal.
- `scripts/benchmark.ts`: repeatable retrieval measurements; `apps/api/src/provider-queue.ts`: bounded concurrency, cancellation and deadlines.

### Task 1: Deterministic corpus retrieval

**Interfaces:** `Document {id,title,path,content}`, `Chunk {id,documentId,title,section,text}`, `Evidence {chunk:Chunk,score:number}`. Export `loadCorpus(directory:string): Promise<Document[]>`, `chunkDocuments(documents:Document[]):Chunk[]`, and `search(chunks:Chunk[], question:string, limit?:number):Evidence[]` from `@evidence/core`.

- [x] Create workspace configuration and write `retrieval.test.ts`: assert identical repeated rankings, fixed chunk identifiers, limit <=5, scores finite, unrelated query empty, and ID ordering for tied scores.
- [x] Configure the quality gates and `AGENTS.md`: strict compiler settings, lint rules, formatting and dependency-boundary checks. Verify a fixture containing a prohibited core-to-app import is rejected before removing the fixture.
- [x] Run `npm test -- retrieval`; confirm the test fails because the required exports are absent.
- [x] Implement heading-based chunks, Unicode-aware lowercased tokenization, documented stopwords, BM25 lexical score normalized by `score/(1+score)` and cosine similarity over a corpus-fixed term-frequency vocabulary. Final score = `0.65 * lexical + 0.35 * cosine`; accept scores >=0.15; ties sort by chunk ID. Return no match for empty or unknown vocabulary. Describe these as sparse term vectors, not neural semantic embeddings.
- [x] Expose `Retriever { search(question:string, limit?:number):Evidence[] }` and a factory `createRetriever(chunks:Chunk[]):Retriever` that builds immutable index data once. Preserve the public `search` helper for tests; application adapters use the long-lived instance. API and MCP must not rebuild the index per request.
- [x] Author four short English documents on regression strategy, CI gates, API contracts and AI evidence validation. Add an adversarial fixture outside the production corpus. Test heading changes and punctuation-only queries.
- [x] Run retrieval tests and TypeScript checking; commit the independently verified retrieval deliverable.

### Task 2: Extractive answers and evidence validation

**Interfaces:** `Citation {chunkId,quote}`; `Answer {mode:'demo'|'llm',answer:string,citations:Citation[],evidence:Evidence[],validation:{structure:boolean,references:boolean,quotes:boolean,semantic:'not_verified'},abstained:boolean}`. Export `validateAnswer(value:unknown,evidence:Evidence[]):Answer` and `createDemoAnswer(evidence:Evidence[]):Answer`.

- [ ] Write `validation.test.ts` asserting rejection of unknown chunk IDs, fabricated quotes, absent citations on non-abstained answers, oversized output (>4,000 characters), and malformed types. Assert empty evidence yields `abstained:true` with no citations.
- [ ] Run tests; confirm expected failures.
- [ ] Implement Zod schema and exact substring checks against retrieved chunks. Demo quotes whole selected sentences, references their IDs and explicitly labels the response as extractive. Abstenção copy: `The collection does not contain enough evidence to answer this question.`
- [ ] Test that adversarial corpus text remains quoted data in demo mode; do not claim this proves LLM injection resistance.
- [ ] Run core tests and type checking; commit.

### Task 3: API and optional provider

**Interfaces:** `buildApp({chunks,generate?}):FastifyInstance`; `generate(question:string,evidence:Evidence[]):Promise<unknown>`. `POST /api/ask` accepts `{question,mode:'demo'|'llm'}` and returns Answer. `GET /api/documents` lists public metadata; `GET /api/documents/:id` returns one public document; `GET /api/config` returns only `{llmAvailable:boolean}`.

- [ ] Write Fastify injection tests for valid demo, whitespace, 1,001-character question, invalid mode, unsupported question, invalid citation from stub, disabled LLM mode, and timeout. Assert failed input never calls `generate` and error bodies contain no stub secret.
- [ ] Run tests and confirm failures.
- [ ] Implement input limits, 16KB body limit, safe error envelopes, and corpus-only document lookup by ID (never user-supplied filesystem paths). Missing LLM configuration returns HTTP 503; upstream invalid output or refusal returns 502; timeout returns 504.
- [ ] Implement optional OpenAI Responses adapter with strict structured output, `OPENAI_API_KEY`, mandatory `OPENAI_MODEL` when enabled, 20-second timeout, max 800 output tokens and zero automatic retries. Use separate instructions and JSON-encoded untrusted evidence. Test request construction, adversarial-text separation, refusal and malformed responses using mocks; no paid calls. State prompt-injection resistance is not guaranteed.
- [ ] Implement `AnswerGenerator.generate(question,evidence,signal?:AbortSignal)` behind the injected `generate` adapter. Write queue tests first: two requests run, eight wait, eleventh is rejected with 429; timeout includes queue time; abort removes queued work and releases running capacity. Propagate disconnect cancellation and emit only request ID, mode, status and duration in logs. Verify fixture prompts and fake secrets never appear in captured logs.
- [ ] Run API/core tests and types; commit.

### Task 4: MCP protocol integration

**Interfaces:** `createMcpServer(chunks:Chunk[])` registers `search_documents({query:string,limit?:number})` and `get_document({id:string})`. Stdio entry loads the same corpus as HTTP; stdout is protocol-only.

- [ ] Write `mcp.test.ts` using an official SDK client and a spawned stdio process. Assert `listTools` exposes two tools; search IDs and scores equal core search; document lookup returns source content; unknown ID and invalid limits are errors.
- [ ] Run tests; confirm server entry is initially missing.
- [ ] Implement tool schemas (query 1–1,000 chars, limit integer 1–5), structured results and read-only document ID lookup. Handle shutdown and send diagnostics only to stderr.
- [ ] Run protocol tests on Windows-compatible process invocation; commit.

### Task 5: Accessible product interface

**Interfaces:** `ask(input:{question:string,mode:'demo'|'llm'},signal?:AbortSignal):Promise<Answer>`; App uses this client plus `/api/config` and document endpoints.

- [ ] Before product UI implementation, apply UI UX Pro Max and produce `docs/ux-preview.html` showing desktop/mobile layouts and all UX-brief states; review the reading hierarchy, source-disclosure flow and mode explanation against the brief. Incorporate Marcelo's feedback before treating the visual design as approved. Use the React stack guidance after the planned React dependencies exist; do not silently select another stack.

- [ ] Write component tests for mode labels, submit/working state, abstention, safe errors and disabled LLM mode. Assert latest request wins when earlier request resolves last.
- [ ] Run component tests and confirm failures.
- [ ] Implement restrained responsive layout: project purpose, three suggested questions, labeled input, mode control, answer, evidence cards with scores, quote/reference checks, and keyboard-accessible source disclosure. Render provider/document text as text, never injected HTML. Announce status with a live region; maintain visible focus.
- [ ] Replace monolithic App rendering with the UX-brief components and one request-coordination hook. Define semantic design tokens and cancellation behavior; keep derived values out of stored state. Create Storybook stories for each specified state, including long text and unavailable AI mode.
- [ ] Add Playwright tests for demo question, unrelated question, simulated HTTP error, source inspection using keyboard and narrow viewport. Set explicit local ports and Vite `/api` proxy.
- [ ] Run component and browser tests; visually inspect desktop/mobile before committing. Test once against the actual API in demo mode, not only mocked HTTP.
- [ ] Run axe checks on application states and stories. Add curated Playwright screenshots at 390px and 1440px; manually verify keyboard navigation, focus restoration, 320px reflow, 200% zoom and reduced motion. Review initial screenshot baselines before accepting them; do not claim WCAG compliance solely from axe results.

### Task 6: Evaluation, CI and portfolio documentation

**Interfaces:** `npm run evaluate` produces Recall@5 and MRR for answerable cases plus abstention accuracy for unsupported cases, with per-case outcomes. Exit nonzero when a required source is absent from top five or an unsupported case does not abstain.

- [ ] Write evaluation tests for a deliberately bad ranking and incorrect abstenção; confirm failures.
- [ ] Add at least eight fixed answerable questions and four unsupported questions. Include synonyms, multi-topic questions and an adversarial fixture case; hold back two paraphrases from threshold tuning. Record corpus/version and exact metric definitions; distinguish demo retrieval evaluation from live LLM evaluation.
- [ ] Implement evaluator and CI: `npm ci`, typecheck, unit/integration/protocol tests, evaluation, build and Playwright. Upload browser failure artifacts. No external API credentials in CI.
- [ ] Extend CI with zero-warning lint, format checking, automated package boundaries, core coverage floors (90% lines, 85% branches), Storybook build and accessibility/visual checks. Baseline updates require a reviewed diff.
- [ ] Implement retrieval benchmark over 1,000 generated original documents, report indexing time, memory, p50/p95 query duration and environment. Add ADRs for sparse retrieval, shared transport-independent core and optional provider; document the external-index/distributed-quota scale-up path without building unused infrastructure.
- [ ] Write reproducible setup, MCP-client configuration, optional LLM configuration, architecture, limits, test commands, project provenance and planned improvements in README and Portuguese companion. Use no badge that implies an unexecuted CI result. Include environment examples with empty secrets and choose MIT for original project code/content.
- [ ] Run the complete verification sequence from the committed lockfile. Report actual checks and any external-provider limitations, commit, and prepare the public repository for publication to Marcelo's GitHub. Publishing docs/code contains only this independent project; deployment remains a separate step.

## Verified references for implementation

- Official MCP SDK: https://ts.sdk.modelcontextprotocol.io/ and https://ts.sdk.modelcontextprotocol.io/v2/ — confirm released package major before using corresponding imports.
- OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses

## Execution handoff

Recommended: native execution in this session, with a fresh review at the end. The six deliverables share contracts and form one small application; implementing sequentially reduces coordination overhead. Subagent-driven execution is an alternative if Marcelo prefers independent review after every task.

Plan self-review: all nine acceptance criteria map to Tasks 1–6. Five review-focus conditions have explicit owning tests. The LLM provider choice is resolved, sparse-retrieval limitations are explicit, and paid/live-provider verification is separate from deterministic baseline checks.

Quality/UX revision review: code rules and dependency boundaries map to Task 1, provider capacity/cancellation to Task 3, visual proposal and component references to Task 5, and enforcement/measurements to Task 6. New project instructions carry these constraints into future changes.
