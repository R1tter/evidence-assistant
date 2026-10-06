import { expect, it } from 'vitest';
import { createExtractiveDocumentAnswer } from './document-answers.js';
const evidence = [
  {
    chunk: {
      id: 'doc:r1:p1:b1',
      documentId: 'doc',
      title: 'Workshop',
      section: 'Page 1',
      text: 'The workshop starts at 14:00. Bring an apron and a bottle of water.',
    },
    score: 0.8,
  },
];
it('selects the matching source sentence rather than the first unrelated one', () => {
  const answer = createExtractiveDocumentAnswer(
    'Should I bring an apron?',
    evidence,
  );
  expect(answer.answer).toBe('Bring an apron and a bottle of water.');
  expect(answer.citations[0]?.quote).toBe(answer.answer);
  expect(answer.validation.semantic).toBe('not_verified');
});
it('preserves PDF line breaks within complete source sentences and skips a repeated heading', () => {
  const source = {
    ...evidence[0]!,
    chunk: {
      ...evidence[0]!.chunk,
      title: 'Workshop',
      text: 'Workshop\nThe workshop starts at 14:00. Place the pot near\na window with indirect light.',
    },
  };
  expect(
    createExtractiveDocumentAnswer('Where should I place the pot?', [source])
      .answer,
  ).toBe('Place the pot near\na window with indirect light.');
  expect(createExtractiveDocumentAnswer('workshop', [source]).answer).toBe(
    'The workshop starts at 14:00.',
  );
});
it('abstains on no lexical sentence match and bounds quotes without rewriting source text', () => {
  expect(
    createExtractiveDocumentAnswer('Who founded the company?', evidence)
      .abstained,
  ).toBe(true);
  expect(
    createExtractiveDocumentAnswer('apron', [
      {
        ...evidence[0]!,
        chunk: { ...evidence[0]!.chunk, text: 'apron '.repeat(1000) },
      },
    ]).abstained,
  ).toBe(true);
});
