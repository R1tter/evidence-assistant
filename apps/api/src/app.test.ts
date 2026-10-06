import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { request as httpRequest } from 'node:http';
import { chunkDocuments, createDemoAnswer } from '@evidence/core';
import { buildApp } from './app.js';

const documents = [
  {
    id: 'api',
    title: 'API contracts',
    path: 'api.md',
    content:
      '# API contracts\n## Validation\nValidate requests before processing. Reject invalid contracts.',
  },
];
const chunks = chunkDocuments(documents);
const apps: FastifyInstance[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
function app(options: Parameters<typeof buildApp>[0] = { chunks, documents }) {
  const instance = buildApp(options);
  apps.push(instance);
  return instance;
}

describe('HTTP API', () => {
  it('propagates a real HTTP disconnect to the provider signal', async () => {
    let notifyStarted: (() => void) | undefined;
    let notifyCancelled: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    const cancelled = new Promise<void>((resolve) => {
      notifyCancelled = resolve;
    });
    const api = app({
      chunks,
      generate: (_question, _evidence, signal) => {
        notifyStarted?.();
        signal?.addEventListener('abort', () => notifyCancelled?.(), {
          once: true,
        });
        return new Promise(() => {});
      },
    });
    const address = await api.listen({ port: 0, host: '127.0.0.1' });
    const request = httpRequest(`${address}/api/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    request.on('error', () => {});
    request.end(JSON.stringify({ question: 'validate requests', mode: 'llm' }));
    await started;
    request.destroy();
    await cancelled;
    const demo = await api.inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'validate requests', mode: 'demo' },
    });
    expect(demo.statusCode).toBe(200);
  });

  it('returns HTTP 429 and retry information when provider capacity is exhausted', async () => {
    const api = app({
      chunks,
      deadlineMs: 100,
      generate: () => new Promise(() => {}),
    });
    const input = {
      method: 'POST' as const,
      url: '/api/ask',
      payload: { question: 'validate requests', mode: 'llm' },
    };
    const responses = await Promise.all(
      Array.from({ length: 11 }, () => api.inject(input)),
    );
    const overflow = responses.find((response) => response.statusCode === 429);
    expect(overflow?.headers['retry-after']).toBe('1');
    expect(overflow?.json()).toMatchObject({
      error: { code: 'PROVIDER_BUSY' },
    });
    expect(
      responses.filter((response) => response.statusCode === 504),
    ).toHaveLength(10);
  });
  it('answers demo and exposes only public configuration and documents', async () => {
    const api = app();
    const response = await api.inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'validate requests', mode: 'demo' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      mode: 'demo',
      abstained: false,
      validation: { semantic: 'not_verified' },
    });
    expect((await api.inject('/api/config')).json()).toEqual({
      llmAvailable: false,
      recognitionAvailable: false,
    });
    expect((await api.inject('/api/documents')).json()).toEqual([
      { id: 'api', title: 'API contracts', path: 'api.md' },
    ]);
    expect((await api.inject('/api/documents/api')).json()).toEqual(
      documents[0],
    );
    expect((await api.inject('/api/documents/unknown')).statusCode).toBe(404);
  });

  it.each(['', '   ', 'a'.repeat(1001)])(
    'rejects invalid questions before provider invocation: %#',
    async (question) => {
      let calls = 0;
      const api = app({
        chunks,
        generate: () => {
          calls++;
          return Promise.resolve({});
        },
      });
      const response = await api.inject({
        method: 'POST',
        url: '/api/ask',
        payload: { question, mode: 'llm' },
      });
      expect(response.statusCode).toBe(400);
      expect(calls).toBe(0);
    },
  );

  it('rejects invalid modes, malformed JSON and oversized bodies', async () => {
    const api = app();
    expect(
      (
        await api.inject({
          method: 'POST',
          url: '/api/ask',
          payload: { question: 'contracts', mode: 'invalid' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await api.inject({
          method: 'POST',
          url: '/api/ask',
          headers: { 'content-type': 'application/json' },
          payload: '{',
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await api.inject({
          method: 'POST',
          url: '/api/ask',
          payload: { question: 'a'.repeat(17000), mode: 'demo' },
        })
      ).statusCode,
    ).toBe(413);
  });

  it('abstains on unsupported queries without calling an available provider', async () => {
    let calls = 0;
    const api = app({
      chunks,
      generate: () => {
        calls++;
        return Promise.resolve({});
      },
    });
    const response = await api.inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'astronomy nebula', mode: 'llm' },
    });
    expect(response.json()).toMatchObject({
      mode: 'llm',
      abstained: true,
      citations: [],
    });
    expect(calls).toBe(0);
  });

  it('reports disabled AI, safe upstream errors and invalid output', async () => {
    const logs: unknown[] = [];
    const disabled = await app().inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'validate requests', mode: 'llm' },
    });
    expect(disabled.statusCode).toBe(503);
    const api = app({
      chunks,
      log: (entry) => logs.push(entry),
      generate: () => {
        return Promise.reject(new Error('fake-secret'));
      },
    });
    const response = await api.inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'validate requests', mode: 'llm' },
    });
    expect(response.statusCode).toBe(502);
    expect(response.body).not.toContain('fake-secret');
    expect(JSON.stringify(logs)).not.toContain('fake-secret');
    expect(logs).toHaveLength(1);
    const invalid = app({
      chunks,
      generate: () =>
        Promise.resolve({
          mode: 'llm',
          answer: 'Invented.',
          citations: [{ chunkId: 'invented', quote: 'Invented.' }],
          abstained: false,
        }),
    });
    expect(
      (
        await invalid.inject({
          method: 'POST',
          url: '/api/ask',
          payload: { question: 'validate requests', mode: 'llm' },
        })
      ).statusCode,
    ).toBe(502);
  });

  it('returns validated generated answers with a server-owned mode', async () => {
    const api = app({
      chunks,
      generate: (_question, evidence) => {
        const { answer, citations, abstained } = createDemoAnswer(evidence);
        return Promise.resolve({ mode: 'demo', answer, citations, abstained });
      },
    });
    expect(
      (
        await api.inject({
          method: 'POST',
          url: '/api/ask',
          payload: { question: 'validate requests', mode: 'llm' },
        })
      ).json(),
    ).toMatchObject({ mode: 'llm', abstained: false });
  });

  it('times out requests and logs only safe request metadata', async () => {
    const logs: unknown[] = [];
    const api = app({
      chunks,
      deadlineMs: 10,
      log: (entry) => logs.push(entry),
      generate: async () => new Promise(() => {}),
    });
    const response = await api.inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'validate requests fake-prompt', mode: 'llm' },
    });
    expect(response.statusCode).toBe(504);
    const errorBody: unknown = response.json();
    expect(errorBody).toMatchObject({ error: { code: 'PROVIDER_TIMEOUT' } });
    expect(response.headers['content-type']).toContain('application/json');
    expect(logs).toHaveLength(1);
    expect(JSON.stringify(logs)).not.toContain('fake-prompt');
    expect(logs[0]).toMatchObject({
      mode: 'llm',
      status: 504,
    });
  });
});
