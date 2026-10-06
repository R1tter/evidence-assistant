import { expect, it } from 'vitest';
import { transcriptionErrors, evidenceMetrics } from './evaluation-metrics.js';
it('counts character and word edits after NFKC, lowercase and whitespace normalization', () => {
  expect(transcriptionErrors('Café azul', 'CAFÉ   azul')).toEqual({
    characters: 9,
    words: 2,
    characterErrors: 0,
    wordErrors: 0,
  });
  expect(transcriptionErrors('train leaves', 'train leaf')).toEqual({
    characters: 12,
    words: 2,
    characterErrors: 3,
    wordErrors: 1,
  });
});
it('rejects missing/wrong-revision sources and distinguishes supported and unsupported abstention', () => {
  expect(
    evidenceMetrics([
      {
        supported: true,
        expectedId: 'doc:r2:p1:b1',
        retrievedIds: ['doc:r1:p1:b1'],
        abstained: true,
        quoteValid: false,
      },
      {
        supported: false,
        expectedId: '',
        retrievedIds: [],
        abstained: false,
        quoteValid: true,
      },
    ]),
  ).toEqual({
    recallAt5: 0,
    mrr: 0,
    supportedAnswerRate: 0,
    unsupportedAbstentionRate: 0,
    validCitationRate: 0,
  });
});
