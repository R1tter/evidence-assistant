import { expect, it } from 'vitest';
import { searchPages } from './document-search.js';
it('finds literal case-insensitive occurrences across pages with original offsets', () => {
  expect(
    searchPages(
      [
        { page: 1, text: 'Oficina oficina' },
        { page: 2, text: 'x [a] [A]' },
      ],
      'oficina',
    ),
  ).toEqual([
    { page: 1, start: 0, end: 7 },
    { page: 1, start: 8, end: 15 },
  ]);
  expect(searchPages([{ page: 2, text: 'x [a] [A]' }], '[a]')).toEqual([
    { page: 2, start: 2, end: 5 },
    { page: 2, start: 6, end: 9 },
  ]);
});
it('leaves empty and unsupported queries without invented matches', () => {
  expect(searchPages([{ page: 1, text: 'ação' }], '   ')).toEqual([]);
  expect(searchPages([{ page: 1, text: 'ação' }], 'acao')).toEqual([]);
});
