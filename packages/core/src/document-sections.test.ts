import { expect, it } from 'vitest';
import { createDocumentRevision } from './document-revisions.js';
import {
  extractDocumentSection,
  SectionTooLargeError,
} from './document-sections.js';
it('returns the complete conclusion across blocks and pages without the next section', () => {
  const first =
    'CONCLUSÃO:\nPrimeiro achado.\n' + 'Descrição complementar. '.repeat(60);
  const document = createDocumentRevision('doc', 'Relatório fictício', [
    {
      page: 1,
      text: 'RESULTADOS\nDados anteriores.\n' + first,
      origin: 'embedded',
      uncertainties: [],
    },
    {
      page: 2,
      text: 'Último achado.\nRECOMENDAÇÕES\nNão incluir.',
      origin: 'embedded',
      uncertainties: [],
    },
  ]);
  const result = extractDocumentSection(
    'Quero a conclusão completa',
    document,
  )!;
  expect(result.answer).toBe(first + '\nÚltimo achado.');
  expect(result.citations.length).toBeGreaterThan(1);
  expect(
    result.citations.every((citation) =>
      result.evidence.some(
        ({ chunk }) =>
          chunk.id === citation.chunkId && chunk.text.includes(citation.quote),
      ),
    ),
  ).toBe(true);
});
it('does not mistake a conclusion mentioned in prose for a section heading', () => {
  const document = createDocumentRevision('doc', 'Fiction', [
    {
      page: 1,
      text: 'The conclusion is discussed elsewhere.',
      origin: 'embedded',
      uncertainties: [],
    },
  ]);
  expect(
    extractDocumentSection('Give me the conclusion', document),
  ).toBeUndefined();
});
it('preserves unpunctuated lines and recognizes localized headings', () => {
  for (const label of ['Conclusion', 'Conclusión', 'Conclusão']) {
    const document = createDocumentRevision('doc', 'Fiction', [
      {
        page: 1,
        text: `${label}: First finding\nSecond finding\nRecommendations\nOther text`,
        origin: 'reviewed',
        uncertainties: [],
      },
    ]);
    const result = extractDocumentSection(label, document)!;
    expect(result.answer).toBe(`${label}: First finding\nSecond finding`);
    expect(
      extractDocumentSection('unrelated question', document),
    ).toBeUndefined();
  }
});
it('handles blank lines before headings and keeps all conclusion paragraphs', () => {
  const text =
    'Resultados\nInformações fictícias.\n\nCONCLUSÕES\nPrimeiro parágrafo.\n\nSegundo parágrafo.\n\nRecomendações\nOutra seção.';
  const document = createDocumentRevision('doc', 'Fiction', [
    { page: 1, text, origin: 'embedded', uncertainties: [] },
  ]);
  expect(extractDocumentSection('Quero as conclusões', document)?.answer).toBe(
    'CONCLUSÕES\nPrimeiro parágrafo.\n\nSegundo parágrafo.',
  );
});
it('keeps inline single-line conclusions intact and refuses oversized complete sections', () => {
  const make = (text: string) =>
    createDocumentRevision('doc', 'Fiction', [
      { page: 1, text, origin: 'embedded', uncertainties: [] },
    ]);
  expect(
    extractDocumentSection(
      'conclusion',
      make('Conclusion: First finding. Second finding.'),
    )?.answer,
  ).toBe('Conclusion: First finding. Second finding.');
  expect(() =>
    extractDocumentSection(
      'conclusion',
      make('Conclusion:\n' + 'finding '.repeat(600)),
    ),
  ).toThrow(SectionTooLargeError);
  const document = createDocumentRevision(
    'doc',
    'Fiction',
    Array.from({ length: 5 }, (_, index) => ({
      page: index + 1,
      text:
        index === 0
          ? 'Conclusion:\n' + 'finding '.repeat(170)
          : 'Additional finding.',
      origin: 'embedded',
      uncertainties: [],
    })),
  );
  expect(() => extractDocumentSection('conclusion', document)).toThrow(
    SectionTooLargeError,
  );
});
