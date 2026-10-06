import type { Evidence } from './types.js';
import { createDemoAnswer } from './answers.js';
import { validateAnswer } from './validation.js';
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const stopwords = new Set(
  'a an and are as at be by for from how in is it of on or that the this to was what when which with should i do does often o os as um uma de da do das dos e que qual quais como onde quando devo preciso el la los las un una en es y qué cuál cuáles cómo dónde cuándo debo necesito'.split(
    ' ',
  ),
);
function terms(text: string) {
  return (
    text
      .normalize('NFKC')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  ).filter((term) => !stopwords.has(term));
}
function sentences(text: string, title: string): string[] {
  const source = text.startsWith(`${title}\n`)
    ? text.slice(title.length + 1)
    : text;
  // Substitute one character for one character only for segmentation; quotes
  // are sliced from the untouched source, including its PDF line breaks.
  return [...segmenter.segment(source.replace(/[\r\n]/g, ' '))].map(
    ({ index, segment }) => source.slice(index, index + segment.length).trim(),
  );
}
export function createExtractiveDocumentAnswer(
  question: string,
  evidence: Evidence[],
) {
  const query = new Set(terms(question));
  let best: { score: number; quote: string; chunkId: string } | undefined;
  for (const { chunk } of evidence.slice(0, 5)) {
    for (const quote of sentences(chunk.text, chunk.title)) {
      if (!quote || quote.length > 4000 || quote === '[illegible]') continue;
      const tokens = terms(quote);
      const score =
        new Set(tokens.filter((term) => query.has(term))).size /
        Math.sqrt(Math.max(tokens.length, 1));
      if (score > 0 && (!best || score > best.score))
        best = { score, quote, chunkId: chunk.id };
    }
  }
  if (!best) return createDemoAnswer([]);
  return validateAnswer(
    {
      mode: 'demo',
      answer: best.quote,
      citations: [{ chunkId: best.chunkId, quote: best.quote }],
      abstained: false,
    },
    evidence,
  );
}
