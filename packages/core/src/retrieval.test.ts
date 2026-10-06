import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  chunkDocuments,
  createRetriever,
  loadCorpus,
  search,
} from './index.js';

const documents = [
  {
    id: 'api',
    title: 'API contracts',
    path: 'api.md',
    content:
      '# API contracts\n\n## Validation\nReject invalid requests before processing.\n\n## Errors\nReturn stable error codes.',
  },
  {
    id: 'ci',
    title: 'CI gates',
    path: 'ci.md',
    content:
      '# CI gates\n\n## Validation\nReject invalid requests before processing.',
  },
];

describe('deterministic retrieval', () => {
  it('exposes corpus loading, chunking and indexed retrieval', () => {
    expect(loadCorpus).toBeTypeOf('function');
    expect(chunkDocuments).toBeTypeOf('function');
    expect(createRetriever).toBeTypeOf('function');
    expect(search).toBeTypeOf('function');
  });

  it('preserves fixed chunk IDs when an unrelated heading is inserted', () => {
    const chunks = chunkDocuments(documents);
    expect(chunks.map((chunk) => chunk.id)).toEqual([
      'api:validation:1',
      'api:errors:1',
      'ci:validation:1',
    ]);
    const changed = [
      {
        ...documents[0]!,
        content:
          '# API contracts\n\n## Intro\nOverview.\n\n## Validation\nReject invalid requests before processing.',
      },
    ];
    expect(chunkDocuments(changed)[1]?.id).toBe('api:validation:1');
  });

  it('ranks repeatably and resolves identical scores by ID', () => {
    const retriever = createRetriever(chunkDocuments(documents));
    const first = retriever.search('invalid requests');
    expect(first.map(({ chunk }) => chunk.id)).toEqual([
      'api:validation:1',
      'ci:validation:1',
    ]);
    expect(retriever.search('invalid requests')).toEqual(first);
    expect(
      first.every(
        ({ score }) => Number.isFinite(score) && score >= 0.15 && score <= 1,
      ),
    ).toBe(true);
  });

  it('caps results at five and honors smaller limits', () => {
    const chunks = chunkDocuments(
      Array.from({ length: 7 }, (_, i) => ({
        id: `doc${i}`,
        title: 'Tests',
        path: `${i}.md`,
        content: '# Tests\nRegression tests protect contracts.',
      })),
    );
    expect(
      search(chunks, 'regression tests protect contracts', 99),
    ).toHaveLength(5);
    expect(
      search(chunks, 'regression tests protect contracts', 1),
    ).toHaveLength(1);
    expect(search(chunks, 'regression tests protect contracts', 0)).toEqual([]);
  });

  it.each(['', '   ', '?!...', 'the and of', 'astronomy nebula'])(
    'returns no evidence for %j',
    (question) => {
      expect(search(chunkDocuments(documents), question)).toEqual([]);
    },
  );

  it('loads only original markdown corpus documents in deterministic order', async () => {
    const corpus = await loadCorpus('corpus');
    expect(corpus.map(({ id }) => id)).toEqual([
      'ai-evidence',
      'api-contracts',
      'ci-gates',
      'regression-strategy',
    ]);
    expect(
      search(chunkDocuments(corpus), 'regression strategy')[0]?.chunk
        .documentId,
    ).toBe('regression-strategy');
  });

  it('uses Unicode letters and case folding', () => {
    const chunks = chunkDocuments([
      {
        id: 'unicode',
        title: 'Unicode',
        path: 'unicode.md',
        content: '# Unicode\nValidação protege contratos.',
      },
    ]);
    expect(search(chunks, 'VALIDAÇÃO')[0]?.chunk.id).toBe('unicode:unicode:1');
  });

  it('keeps index independent of subsequent caller mutations', () => {
    const chunks = chunkDocuments(documents);
    const retriever = createRetriever(chunks);
    chunks[0]!.text = 'astronomy';
    chunks.length = 0;
    expect(retriever.search('invalid')[0]?.chunk.text).toBe(
      'Reject invalid requests before processing.',
    );
  });

  it('handles empty indexes and invalid limits without nonfinite scores', () => {
    expect(search([], 'contracts')).toEqual([]);
    const chunks = chunkDocuments(documents);
    expect(search(chunks, 'invalid requests', Number.NaN)).toEqual([]);
    expect(search(chunks, 'invalid requests', Infinity)).toEqual([]);
    expect(search(chunks, 'invalid requests', -1)).toEqual([]);
    expect(search(chunks, 'invalid requests', 1.9)).toHaveLength(1);
  });

  it('preserves fenced headings as text and disambiguates repeated headings', () => {
    const chunks = chunkDocuments([
      {
        id: 'notes',
        title: 'Notes',
        path: 'notes.md',
        content:
          'Preface.\n\n## Same\nFirst.\n```md\n## Embedded\n```\n## Same\nSecond.\n## !!!\nLast.',
      },
    ]);
    expect(chunks.map(({ id }) => id)).toEqual([
      'notes:notes:1',
      'notes:same:1',
      'notes:same:2',
      'notes:section:1',
    ]);
    expect(chunks[1]?.text).toContain('## Embedded');
    expect(
      chunkDocuments([
        {
          id: 'empty',
          title: 'Empty',
          path: 'empty.md',
          content: '# Empty\n\n## Nothing',
        },
      ]),
    ).toEqual([]);
  });

  it('falls back to filenames and excludes directories and non-markdown files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'evidence-corpus-'));
    try {
      await writeFile(join(root, 'plain.md'), 'No title, just contracts.');
      await writeFile(join(root, 'ignored.txt'), 'not a source');
      await mkdir(join(root, 'directory.md'));
      expect(await loadCorpus(root)).toEqual([
        {
          id: 'plain',
          title: 'plain',
          path: 'plain.md',
          content: 'No title, just contracts.',
        },
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
