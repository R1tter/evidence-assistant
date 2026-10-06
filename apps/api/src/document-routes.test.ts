import { expect, it } from 'vitest';
import { buildApp } from './app.js';
import { createDemoAnswer } from '@evidence/core';
import type { RequestLog } from './contracts.js';
const pages = [
  {
    page: 1,
    text: 'The workshop starts at 14:00. Bring an apron.',
    origin: 'embedded',
    uncertainties: [],
  },
];
it('returns complete multi-paragraph conclusions through the private demo route and reports size limits', async () => {
  const app = buildApp({ chunks: [] });
  try {
    for (const content of [
      'CONCLUSÃO:\nPrimeiro achado.\n\nSegundo achado.\nRECOMENDAÇÕES\nOutro texto.',
      'CONCLUSÃO:\n' + 'Achado fictício. '.repeat(300),
    ]) {
      const created = await app.inject({
        method: 'POST',
        url: '/api/document-sessions',
        payload: {
          title: 'Exemplo fictício',
          pages: [{ ...pages[0], text: content }],
        },
      });
      const { token } = created.json<{ token: string }>();
      const result = await app.inject({
        method: 'POST',
        url: '/api/document-session/ask',
        headers: { 'x-document-session': token },
        payload: {
          question: 'Quero a conclusão completa',
          revision: 1,
          mode: 'demo',
          locale: 'pt-BR',
        },
      });
      if (content.length > 4000) {
        expect(result.statusCode).toBe(422);
        expect(result.body).toContain('SECTION_TOO_LARGE');
      } else {
        expect(result.statusCode).toBe(200);
        expect(result.json<{ answer: string }>().answer).toBe(
          'CONCLUSÃO:\nPrimeiro achado.\n\nSegundo achado.',
        );
      }
    }
  } finally {
    await app.close();
  }
});
it('answers the current private document and rejects absent or foreign capability tokens', async () => {
  const app = buildApp({ chunks: [] });
  try {
    const created = await app.inject({
      method: 'POST',
      url: '/api/document-sessions',
      payload: { title: 'Workshop', pages },
    });
    expect(created.statusCode).toBe(201);
    const body = created.json<{
      token: string;
      document: { id: string; revision: number };
    }>();
    const headers = { 'x-document-session': body.token };
    const answer = await app.inject({
      method: 'POST',
      url: '/api/document-session/ask',
      headers,
      payload: {
        revision: 1,
        question: 'What time does the workshop start?',
        mode: 'demo',
        locale: 'en',
      },
    });
    expect(answer.statusCode).toBe(200);
    expect(answer.json<{ answer: string }>().answer).toContain('14:00');
    for (const token of ['', 'invalid', 'x'.repeat(43)]) {
      expect(
        (
          await app.inject({
            url: '/api/document-session',
            headers: { 'x-document-session': token },
          })
        ).statusCode,
      ).toBe(410);
    }
    const saved = await app.inject({
      method: 'PATCH',
      url: '/api/document-session/pages/1',
      headers,
      payload: { revision: 1, text: 'The workshop starts at 16:00.' },
    });
    expect(saved.statusCode).toBe(200);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/document-session/ask',
          headers,
          payload: {
            revision: 1,
            question: 'Workshop?',
            mode: 'demo',
            locale: 'en',
          },
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: '/api/document-session',
          headers,
        })
      ).statusCode,
    ).toBe(204);
    expect(
      (await app.inject({ url: '/api/document-session', headers })).statusCode,
    ).toBe(410);
  } finally {
    await app.close();
  }
});
it('accepts bounded document text beyond the old question body limit without exposing it in logs or the public collection', async () => {
  const logs: RequestLog[] = [];
  const app = buildApp({
    chunks: [],
    log: (entry) => logs.push(entry),
    sessionOptions: { maxSessions: 1 },
  });
  try {
    const text = 'PrivateMarker '.repeat(1500);
    const created = await app.inject({
      method: 'POST',
      url: '/api/document-sessions',
      payload: { title: 'Private title', pages: [{ ...pages[0], text }] },
    });
    expect(created.statusCode).toBe(201);
    const body = created.json<{ token: string; document: { id: string } }>();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/document-sessions',
          payload: { title: 'Second', pages },
        })
      ).statusCode,
    ).toBe(429);
    expect(
      (await app.inject({ url: `/api/documents/${body.document.id}` }))
        .statusCode,
    ).toBe(404);
    expect((await app.inject({ url: '/api/documents' })).json()).toEqual([]);
    expect(JSON.stringify(logs)).not.toContain('PrivateMarker');
    expect(JSON.stringify(logs)).not.toContain(body.token);
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/document-sessions',
      payload: {
        title: 'PrivateMarker',
        pages: [{ ...pages[0], text: 'x'.repeat(40001) }],
      },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.body).not.toContain('PrivateMarker');
  } finally {
    await app.close();
  }
});
it('rejects generation that finishes after an intervening revision change', async () => {
  let release: (() => void) | undefined;
  let notify: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    notify = resolve;
  });
  const app = buildApp({
    chunks: [],
    generate: async (_question, evidence) => {
      notify?.();
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
      payload: { title: 'Workshop', pages },
    });
    const headers = {
      'x-document-session': created.json<{ token: string }>().token,
    };
    const asking = app.inject({
      method: 'POST',
      url: '/api/document-session/ask',
      headers,
      payload: {
        question: 'workshop starts 14:00',
        mode: 'llm',
        locale: 'en',
        revision: 1,
      },
    });
    await started;
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: '/api/document-session/pages/1',
          headers,
          payload: { text: 'The workshop starts at 16:00.', revision: 1 },
        })
      ).statusCode,
    ).toBe(200);
    release?.();
    expect((await asking).statusCode).toBe(409);
  } finally {
    release?.();
    await app.close();
  }
});
