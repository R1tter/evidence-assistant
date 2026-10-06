import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildApp } from './app.js';
import type { PageText } from '@evidence/core';
import { createDemoAnswer } from '@evidence/core';
import type { RequestLog } from './contracts.js';
const data = readFileSync(
  new URL('../../../examples/en/note.png', import.meta.url),
).toString('base64');
it('recognition timeout aborts the provider and logs only operational metadata', async () => {
  let aborted = false;
  const logs: RequestLog[] = [];
  const app = buildApp({
    chunks: [],
    recognitionDeadlineMs: 15,
    log: (entry) => logs.push(entry),
    recognize: (_pages, signal) => {
      signal?.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise<PageText[]>(() => undefined);
    },
  });
  try {
    const created = await app.inject({
      method: 'POST',
      url: '/api/document-sessions',
      payload: {
        title: 'Private note',
        pages: [{ page: 1, text: '', origin: 'embedded', uncertainties: [] }],
      },
    });
    const token = created.json<{ token: string }>().token;
    const result = await app.inject({
      method: 'POST',
      url: '/api/document-session/recognize',
      headers: { 'x-document-session': token },
      payload: {
        revision: 1,
        consent: true,
        pages: [{ page: 1, mime: 'image/png', data }],
      },
    });
    expect(result.statusCode).toBe(504);
    expect(aborted).toBe(true);
    expect(
      logs.some(
        (entry) => entry.mode === 'recognition' && entry.status === 504,
      ),
    ).toBe(true);
    expect(JSON.stringify(logs)).not.toContain(token);
    expect(JSON.stringify(logs)).not.toContain(data);
  } finally {
    await app.close();
  }
});
it('shares generation capacity and skips queued recognition after a revision change', async () => {
  let release: (() => void) | undefined;
  let started = 0;
  let notify: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const active = new Promise<void>((resolve) => {
    notify = resolve;
  });
  const recognize = vi.fn(() =>
    Promise.resolve<PageText[]>([
      {
        page: 1,
        text: 'New transcription.',
        origin: 'vision',
        uncertainties: [],
      },
    ]),
  );
  const app = buildApp({
    chunks: [],
    recognize,
    generate: async (_question, evidence) => {
      started++;
      if (started === 2) notify?.();
      await pending;
      const answer = createDemoAnswer(evidence);
      return {
        mode: 'llm',
        answer: answer.answer,
        citations: answer.citations,
        abstained: answer.abstained,
      };
    },
  });
  try {
    const created = await app.inject({
      method: 'POST',
      url: '/api/document-sessions',
      payload: {
        title: 'Workshop',
        pages: [
          {
            page: 1,
            text: 'The workshop starts at 14:00.',
            origin: 'embedded',
            uncertainties: [],
          },
        ],
      },
    });
    const headers = {
      'x-document-session': created.json<{ token: string }>().token,
    };
    const generation = Array.from({ length: 2 }, () =>
      app.inject({
        method: 'POST',
        url: '/api/document-session/ask',
        headers,
        payload: {
          question: 'workshop starts 14:00',
          mode: 'llm',
          locale: 'en',
          revision: 1,
        },
      }),
    );
    await active;
    const queued = app.inject({
      method: 'POST',
      url: '/api/document-session/recognize',
      headers,
      payload: {
        revision: 1,
        consent: true,
        pages: [{ page: 1, mime: 'image/png', data }],
      },
    });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(recognize).not.toHaveBeenCalled();
    await app.inject({
      method: 'PATCH',
      url: '/api/document-session/pages/1',
      headers,
      payload: { revision: 1, text: 'Edited while queued.' },
    });
    release?.();
    await Promise.all(generation);
    expect((await queued).statusCode).toBe(409);
    expect(recognize).not.toHaveBeenCalled();
  } finally {
    release?.();
    await app.close();
  }
});
it('requires consent, replaces selected pages with a new revision and keeps recognition optional', async () => {
  const recognize = vi.fn(() =>
    Promise.resolve<PageText[]>([
      {
        page: 1,
        text: 'Meet Ana at 09:00. [illegible]',
        origin: 'vision',
        uncertainties: ['Unreadable word.'],
      },
    ]),
  );
  const app = buildApp({ chunks: [], recognize });
  try {
    const created = await app.inject({
      method: 'POST',
      url: '/api/document-sessions',
      payload: {
        title: 'Note',
        pages: [{ page: 1, text: '', origin: 'embedded', uncertainties: [] }],
      },
    });
    const headers = {
      'x-document-session': created.json<{ token: string }>().token,
    };
    const payload = {
      revision: 1,
      consent: true,
      pages: [{ page: 1, mime: 'image/png', data }],
    };
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/document-session/recognize',
          headers,
          payload: { ...payload, consent: false },
        })
      ).statusCode,
    ).toBe(400);
    expect(recognize).not.toHaveBeenCalled();
    const recognized = await app.inject({
      method: 'POST',
      url: '/api/document-session/recognize',
      headers,
      payload,
    });
    expect(recognized.statusCode).toBe(200);
    expect(recognized.json()).toMatchObject({
      document: {
        revision: 2,
        pages: [
          { page: 1, origin: 'vision', text: 'Meet Ana at 09:00. [illegible]' },
        ],
      },
    });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/document-session/recognize',
          headers,
          payload,
        })
      ).statusCode,
    ).toBe(409);
    expect(recognize).toHaveBeenCalledTimes(1);
    expect((await app.inject({ url: '/api/config' })).json()).toMatchObject({
      recognitionAvailable: true,
    });
  } finally {
    await app.close();
  }
  const unavailable = buildApp({ chunks: [] });
  try {
    expect(
      (await unavailable.inject({ url: '/api/config' })).json(),
    ).toMatchObject({ recognitionAvailable: false });
  } finally {
    await unavailable.close();
  }
});
