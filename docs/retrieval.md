# Deterministic retrieval baseline

The four original English documents in `corpus/` are the production collection. Adversarial fixtures live outside it. Markdown headings split nonempty sections; IDs combine document ID, normalized heading and occurrence number. Adding an unrelated heading preserves existing IDs. Renaming a heading or reordering repeated headings changes the affected IDs. Fenced code is kept as source text.

The index includes title, section and text. Unicode NFKC normalization, lowercase letters and numeric tokens support deterministic term matching. A small English stopword list is documented directly in `retrieval.ts`; there is no stemming or synonym expansion.

BM25 uses k1=1.2 and b=0.75 with IDF `ln(1 + (N - df + 0.5)/(df + 0.5))`. The lexical score is normalized as `score/(1+score)`. Cosine similarity uses sparse term-frequency vectors over the vocabulary fixed at index creation. Query terms outside that vocabulary are ignored. Final score is `0.65 * lexical + 0.35 * cosine`. Scores below 0.15 are omitted; ties use ascending chunk ID and results are capped at five. Empty or unknown-vocabulary queries return no evidence. Nonfinite or nonpositive limits return no results; positive fractional limits are floored.

These are sparse term vectors, not neural semantic embeddings. Scores indicate ranking strength, not probability or truth. Exact word matching cannot reliably recover synonyms. The initial threshold is an explicit baseline, pending the fixed evaluation in Task 6.

API and MCP adapters must retain `createRetriever(chunks)` from startup. Its copied source records prevent caller mutations from changing the index. The `search` helper rebuilds an index for isolated callers/tests only. Source loading uses filesystem I/O only during startup.
