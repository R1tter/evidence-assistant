# Evidence Assistant — engineering quality contract

## Simplicity and maintainability

- Prefer explicit data flow, descriptive domain names and small cohesive functions. Extract a module when it has a separate responsibility, not simply to reduce line count.
- Avoid speculative generic frameworks, service locators, inheritance hierarchies, boolean-heavy APIs and hidden mutable singleton state.
- Keep retrieval, answer validation and provider communication separate. Route handlers orchestrate; they do not implement retrieval algorithms.
- Use composition and dependency injection at actual external boundaries. Keep one canonical schema per public contract.
- React components render; hooks coordinate interaction. Do not store values that can be derived from existing state. Separate async request management from presentation.
- Comments explain decisions or constraints, not restate code. Record consequential trade-offs in short architecture decision records.

## Automated rules

TypeScript: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Unknown external data remains `unknown` until validated.

ESLint: TypeScript recommended type-aware rules, no explicit `any`, no floating or misused promises, no unused imports, React hooks rules and JSX accessibility rules. Cyclomatic complexity <=10; maximum nesting depth 3. Allow a narrowly documented local exception when extraction would harm readability; review it explicitly.

Enforce package dependency direction: core imports no app or provider SDK; API/MCP import core through its public exports; web shares serializable contracts and never imports server runtime. No app-to-app imports or deep imports of private package modules. Automate these restrictions with lint rules and a dependency-boundary check.

Prettier check, ESLint with zero warnings, type checking and build run in CI. Avoid arbitrary file/function line limits; review files exceeding 300 lines for mixed responsibilities, with justified cohesive exceptions.

## Tests and review

- Test business behavior, rejection paths, protocol boundaries and UI states. Avoid tests that mirror private implementation or mock the subject being tested.
- Core retrieval and validation: line coverage floor 90%, branch floor 85%. Treat thresholds as regression gates, not claims of correctness. Set initial baselines from executed tests.
- Include protocol and actual demo API browser tests. Mock only external provider calls for deterministic CI.
- Maintain Storybook stories for interactive components, answer states and source inspection. Run automated accessibility checks and a curated visual regression suite; review baseline updates.
- Each delivery includes a review of naming, dependencies, error paths, async cleanup, accessibility and maintainability. No unresolved critical correctness or security defect at publication.

## Evolution and performance

- Define `Retriever.search(question, limit)` and `AnswerGenerator.generate(question, evidence)` contracts; sparse retrieval and OpenAI are replaceable adapters, not conditionals spread across the app.
- Build the corpus index once on startup. Keep request state local and corpus/index immutable. Do not read source files or rebuild vectors on every request.
- Bound provider requests to two in flight per process and at most eight queued; overflow returns HTTP 429 with retry information. Queue wait counts toward the 20-second total deadline; aborted requests release resources. These are local process controls, not distributed quotas.
- Pass cancellation through HTTP and provider boundaries. Use stable public error codes and request IDs. Log status, duration and mode; omit prompts, documents, responses and credentials.
- Add a repeatable retrieval benchmark using a generated 1,000-document corpus, reporting index time, memory and query p50/p95 with Node version and hardware. Do not enforce an unexplained absolute latency threshold on shared CI.
- Document a scale-up path: external index behind Retriever, distributed quotas and provider worker pool, cache versioning and load-test requirements. Do not add that infrastructure to the first version.

## Definition of done

Feature acceptance passes; lint, formatting, types, tests, evaluation and build pass; UX states and accessibility are reviewed; documentation matches actual behavior; limitations and measured results are explicit. Dependencies are pinned by a committed lockfile; no secrets or proprietary material are included.
