import type { Evidence } from './types.js';
import { validateAnswer } from './validation.js';
import type { Answer, Citation } from './validation.js';

const prefix = 'Extractive answer from the collection:';
const abstention =
  'The collection does not contain enough evidence to answer this question.';
const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

function firstSentence(text: string): string {
  const segments = sentenceSegmenter.segment(text);
  return segments[Symbol.iterator]().next().value?.segment.trim() ?? '';
}

export function createDemoAnswer(evidence: Evidence[]): Answer {
  const citations: Citation[] = [];
  const paragraphs: string[] = [];
  let length = prefix.length;
  for (const { chunk } of evidence.slice(0, 5)) {
    const quote = firstSentence(chunk.text);
    const paragraph = `${quote} [${citations.length + 1}]`;
    if (!quote || length + paragraph.length + 2 > 4000) continue;
    citations.push({ chunkId: chunk.id, quote });
    paragraphs.push(paragraph);
    length += paragraph.length + 2;
  }
  return validateAnswer(
    {
      mode: 'demo',
      answer:
        paragraphs.length > 0
          ? `${prefix}\n\n${paragraphs.join('\n\n')}`
          : abstention,
      citations,
      abstained: citations.length === 0,
    },
    evidence,
  );
}
