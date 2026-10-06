# Executed document evaluation

6 October 2026, Node 22.17.0 on Windows. Commands: `npm run evaluate`, `npm run benchmark`, `npm run test:e2e`. Gold relevance labels: `gold.json`. Original example assets/transcripts: `examples/`. This is a small deterministic regression dataset, not a general quality benchmark.

| Measurement                               | Executed result                            | Meaning                                                                                       |
| ----------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Supported private-document questions      | 27/27 answers contain the labeled fragment | Three questions per example, three languages                                                  |
| Unsupported questions                     | 27/27 abstentions                          | Three unrelated queries against nine individual documents                                     |
| Exact citation/current revision           | 27/27                                      | Transcription substring and revision references; not semantic correctness                     |
| Private-session Recall@5 / MRR            | 1 / 1                                      | Each short example has one chunk, so ranking is trivial                                       |
| Nine-document ranking Recall@5 / MRR      | 1 / 0.9382716049                           | 27 queries over nine original chunks; separate from the single-document product               |
| Embedded PDF extraction CER / WER         | 0 / 0, three local PDFs                    | Actual browser PDF worker output against original text                                        |
| Prepared transcript consistency CER / WER | 0 / 0, six image examples                  | Supplied strings; no OCR performed                                                            |
| Recognition fixtures CER / WER            | 12/101 = 11.88% / 2/22 = 9.09%             | Three artificial output strings, including wrong digit and illegibility; not provider quality |
| Live OCR / handwriting                    | 0 cases; no score                          | No live credentials or genuine handwritten benchmark                                          |

CER/WER use Levenshtein insertion/deletion/substitution distance with NFKC, lowercase and collapsed whitespace. CER counts Unicode code points; WER splits normalized text on spaces. Corpus rates divide total errors by total reference characters/words. The illegibility marker counts as an error. Browser measurements are attached to the localized reader test; CLI reports prepared consistency, fixture errors and retrieval/answer metrics separately. The cursive note is a typeset illustration.

Tests also cover wrong revisions, absent sources, atomic edits, expiry, deletion, capability isolation, cancellation, malformed input and optional providers. They do not establish prompt-injection immunity or complete accessibility conformance. Ten document story states passed axe in three locales; curated screenshots and source focus/return are checked separately.

## Observed performance

Original synthetic fixtures: 1,000 one-page documents/1,000 chunks, index built once, 50 warm-up queries, 500 timed queries. AMD Ryzen 7 5800X3D (16 logical CPUs), 34,282,192,896 bytes system memory, Windows 10.0.26200, Node v22.17.0.

One executed run: index 9.797 ms, query p50 0.1053 ms/p95 0.2065 ms. Observed heap delta 2,544,416 bytes, RSS delta 5,758,976 bytes. No forced GC; allocations and machine load affect results. These are not exact index-only memory or a production capacity/SLA. The command prints fresh machine-specific measurements without timing assertions.

## CI

The Windows workflow installs the lockfile, checks formatting/lint/boundaries/types, runs core coverage plus API/MCP/component regressions, evaluation and benchmark, builds web/Storybook, and runs Chromium/axe/screenshots without secrets. Screenshots were reviewed locally on Windows. Committing this workflow does not prove a hosted GitHub run passed; report remote results separately.
