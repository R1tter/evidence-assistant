import { expect, it } from 'vitest';
import { documentExamples } from '../apps/web/src/documents/examples.js';
import {
  createDocumentRevision,
  pageChunks,
  createRetriever,
  createExtractiveDocumentAnswer,
} from '@evidence/core';
for (const locale of ['en', 'pt-BR', 'es'] as const) {
  for (const example of documentExamples(locale)) {
    const revision = createDocumentRevision(
      example.id,
      example.title,
      [{ page: 1, text: example.text, origin: 'reviewed', uncertainties: [] }],
      1,
    );
    const retriever = createRetriever(pageChunks(revision));
    const targets = example.kind === 'scan' ? [0, 2, 3] : [0, 1, 2];
    const sentences = [
      ...new Intl.Segmenter(locale, { granularity: 'sentence' }).segment(
        example.text.split('\n')[1]!,
      ),
    ].map((item) => item.segment.trim());
    example.questions.forEach((question, index) => {
      it(`${example.id}: suggested question ${index + 1} returns the relevant exact sentence`, () => {
        const answer = createExtractiveDocumentAnswer(
          question,
          retriever.search(question),
        );
        expect(answer.abstained).toBe(false);
        expect(answer.answer).toContain(sentences[targets[index]!]!);
        expect(answer.validation.quotes).toBe(true);
      });
    });
  }
}
