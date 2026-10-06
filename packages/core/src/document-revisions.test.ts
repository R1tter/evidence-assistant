import { expect, it } from 'vitest';
import { createDocumentRevision, pageChunks } from './document-revisions.js';
const pages = [
  {
    page: 1,
    text: 'The workshop starts at 14:00. Bring an apron.',
    origin: 'embedded' as const,
    uncertainties: [],
  },
  {
    page: 2,
    text: '',
    origin: 'embedded' as const,
    uncertainties: ['No readable text.'],
  },
];
it('preserves immutable page and revision provenance without chunks for blank pages', () => {
  const revision = createDocumentRevision('doc-1', 'Workshop', pages, 2);
  pages[0]!.text = 'changed';
  const chunks = pageChunks(revision);
  expect(chunks).toHaveLength(1);
  expect(chunks[0]).toMatchObject({
    id: 'doc-1:r2:p1:b1',
    documentId: 'doc-1',
    text: 'The workshop starts at 14:00. Bring an apron.',
    provenance: { page: 1, block: 1, revision: 2, origin: 'embedded' },
  });
  expect(Object.isFrozen(revision.pages[0])).toBe(true);
  expect(Object.isFrozen(revision.pages[0]!.uncertainties)).toBe(true);
});
it('rejects duplicate, unordered, oversized pages and invalid origins', () => {
  const base = { page: 1, text: 'text', origin: 'embedded', uncertainties: [] };
  for (const invalid of [
    [base, base],
    [{ ...base, page: 2 }],
    [{ ...base, text: 'x'.repeat(40001) }],
    [{ ...base, origin: 'invented' }],
    Array.from({ length: 6 }, (_, i) => ({ ...base, page: i + 1 })),
  ]) {
    expect(() =>
      createDocumentRevision('doc-1', 'Workshop', invalid, 1),
    ).toThrow();
  }
});
it('splits long text into bounded blocks without losing its contents', () => {
  const text = 'An original sentence. '.repeat(200).trim();
  const revision = createDocumentRevision(
    'doc-2',
    'Long page',
    [{ page: 1, text, origin: 'reviewed', uncertainties: [] }],
    1,
  );
  const chunks = pageChunks(revision);
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks.every((chunk) => chunk.text.length <= 1200)).toBe(true);
  expect(chunks.map((chunk) => chunk.text).join(' ')).toBe(text);
});
it('keeps continuous text in full-sized blocks rather than tiny repeated chunks', () => {
  const revision = createDocumentRevision('doc-3', 'Continuous', [
    { page: 1, text: 'x'.repeat(2400), origin: 'embedded', uncertainties: [] },
  ]);
  const chunks = pageChunks(revision);
  expect(chunks.map((chunk) => chunk.text.length)).toEqual([1200, 1200]);
});
it('does not index a solely illegible transcription marker as evidence', () => {
  const revision = createDocumentRevision('doc-4', 'Illegible', [
    {
      page: 1,
      text: '[illegible]',
      origin: 'vision',
      uncertainties: ['Unreadable page.'],
    },
  ]);
  expect(pageChunks(revision)).toEqual([]);
});
