import type { Chunk, Evidence, Retriever } from './types.js';

// Deliberately small English stopword list; no stemming or synonym expansion.
const stopwords = new Set(
  'a an and are as at be by for from how in is it of on or that the this to was what when which with'.split(
    ' ',
  ),
);
type Frequencies = ReadonlyMap<string, number>;
interface IndexedChunk {
  chunk: Chunk;
  terms: Frequencies;
  length: number;
  norm: number;
}

function frequencies(text: string): Map<string, number> {
  const result = new Map<string, number>();
  const tokens =
    text
      .normalize('NFKC')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? [];
  for (const token of tokens) {
    if (!stopwords.has(token)) result.set(token, (result.get(token) ?? 0) + 1);
  }
  return result;
}

function norm(terms: Frequencies): number {
  return Math.sqrt(
    [...terms.values()].reduce((sum, count) => sum + count * count, 0),
  );
}

function indexChunk(chunk: Chunk): IndexedChunk {
  const terms = frequencies(`${chunk.title} ${chunk.section} ${chunk.text}`);
  return {
    chunk: Object.freeze({ ...chunk }),
    terms,
    length: [...terms.values()].reduce((sum, count) => sum + count, 0),
    norm: norm(terms),
  };
}

function documentFrequencies(index: IndexedChunk[]): Frequencies {
  const counts = new Map<string, number>();
  for (const entry of index) {
    for (const term of entry.terms.keys())
      counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return counts;
}

function scoreChunk(
  entry: IndexedChunk,
  query: Frequencies,
  queryNorm: number,
  inverseFrequency: Frequencies,
  averageLength: number,
): number {
  let lexical = 0;
  let dot = 0;
  for (const [term, queryCount] of query) {
    const count = entry.terms.get(term) ?? 0;
    dot += count * queryCount;
    const lengthPenalty = 1.2 * (0.25 + (0.75 * entry.length) / averageLength);
    lexical +=
      ((inverseFrequency.get(term) ?? 0) * count * 2.2) /
      (count + lengthPenalty);
  }
  const cosine = entry.norm === 0 ? 0 : dot / (entry.norm * queryNorm);
  return (0.65 * lexical) / (1 + lexical) + 0.35 * cosine;
}

function compareEvidence(left: Evidence, right: Evidence): number {
  if (left.score !== right.score) return right.score - left.score;
  return left.chunk.id < right.chunk.id
    ? -1
    : Number(left.chunk.id > right.chunk.id);
}

export function createRetriever(chunks: Chunk[]): Retriever {
  const index = chunks.map(indexChunk);
  const counts = documentFrequencies(index);
  const inverseFrequency = new Map(
    [...counts].map(([term, count]) => [
      term,
      Math.log(1 + (index.length - count + 0.5) / (count + 0.5)),
    ]),
  );
  const averageLength =
    index.reduce((sum, entry) => sum + entry.length, 0) / index.length || 1;
  return Object.freeze({
    search(question: string, limit = 5): Evidence[] {
      if (!Number.isFinite(limit) || limit <= 0) return [];
      const query = frequencies(question);
      for (const term of query.keys()) {
        if (!counts.has(term)) query.delete(term);
      }
      const queryNorm = norm(query);
      if (queryNorm === 0) return [];
      return index
        .map((entry) => ({
          chunk: entry.chunk,
          score: scoreChunk(
            entry,
            query,
            queryNorm,
            inverseFrequency,
            averageLength,
          ),
        }))
        .filter(({ score }) => score >= 0.15)
        .sort(compareEvidence)
        .slice(0, Math.min(5, Math.floor(limit)));
    },
  });
}

// Convenience helper; transport adapters retain a single startup-built instance.
export function search(
  chunks: Chunk[],
  question: string,
  limit = 5,
): Evidence[] {
  return createRetriever(chunks).search(question, limit);
}
