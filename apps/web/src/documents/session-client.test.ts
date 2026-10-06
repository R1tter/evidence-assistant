import { afterEach, expect, it, vi } from 'vitest';
import { sessionClient } from './session-client.js';
afterEach(() => vi.unstubAllGlobals());
it('sends capability in a header with explicit revision and validates external answers', async () => {
  const transport = vi.fn(() =>
    Promise.resolve(Response.json({ answer: 'unvalidated' })),
  );
  vi.stubGlobal('fetch', transport);
  await expect(
    sessionClient.ask(
      'secret-token',
      2,
      'question',
      'demo',
      'es',
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  expect(transport).toHaveBeenCalledWith(
    '/api/document-session/ask',
    expect.objectContaining({
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'X-Document-Session': 'secret-token',
      },
      body: JSON.stringify({
        revision: 2,
        question: 'question',
        mode: 'demo',
        locale: 'es',
      }),
    }),
  );
});
it('does not expose server response content in errors and handles successful deletion', async () => {
  vi.stubGlobal('fetch', () =>
    Promise.resolve(new Response('private text', { status: 410 })),
  );
  await expect(sessionClient.remove('token')).rejects.toMatchObject({
    message: 'SESSION_EXPIRED',
  });
  vi.stubGlobal('fetch', () =>
    Promise.resolve(new Response(null, { status: 204 })),
  );
  await expect(sessionClient.remove('token')).resolves.toBeUndefined();
});
