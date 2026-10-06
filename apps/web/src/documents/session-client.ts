import {
  assistantConfigSchema,
  createdSessionSchema,
  sessionSchema,
  sessionAnswerSchema,
} from '@evidence/core/contracts';
import type { PageText } from '@evidence/core';
import type { z } from 'zod';
import type { ExampleLocale } from './examples.js';
export type Session = z.infer<typeof sessionSchema>;
export type SessionAnswer = z.infer<typeof sessionAnswerSchema>;
export interface RecognitionPage {
  page: number;
  mime: 'image/png' | 'image/jpeg';
  data: string;
}
export interface SessionClient {
  config(
    this: void,
    signal?: AbortSignal,
  ): Promise<z.infer<typeof assistantConfigSchema>>;
  create(
    this: void,
    title: string,
    pages: PageText[],
    signal: AbortSignal,
  ): Promise<z.infer<typeof createdSessionSchema>>;
  remove(this: void, token: string): Promise<void>;
  edit(
    this: void,
    token: string,
    page: number,
    revision: number,
    text: string,
    signal: AbortSignal,
  ): Promise<Session>;
  ask(
    this: void,
    token: string,
    revision: number,
    question: string,
    mode: 'demo' | 'llm',
    locale: ExampleLocale,
    signal: AbortSignal,
  ): Promise<SessionAnswer>;
  recognize(
    this: void,
    token: string,
    revision: number,
    pages: RecognitionPage[],
    signal: AbortSignal,
  ): Promise<Session>;
}
export class SessionApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
async function request(
  path: string,
  method: string,
  token?: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(path, {
    method,
    credentials: 'omit',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'X-Document-Session': token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    const codes: Record<number, string> = {
      400: 'INVALID_REQUEST',
      409: 'REVISION_CONFLICT',
      410: 'SESSION_EXPIRED',
      413: 'BODY_TOO_LARGE',
      429: 'PROVIDER_BUSY',
      503: 'AI_UNAVAILABLE',
      504: 'PROVIDER_TIMEOUT',
    };
    throw new SessionApiError(codes[response.status] ?? 'REQUEST_FAILED');
  }
  return response.status === 204
    ? undefined
    : (response.json() as Promise<unknown>);
}
export const sessionClient: SessionClient = {
  config: async (signal) =>
    assistantConfigSchema.parse(
      await request('/api/config', 'GET', undefined, undefined, signal),
    ),
  create: async (title, pages, signal) =>
    createdSessionSchema.parse(
      await request(
        '/api/document-sessions',
        'POST',
        undefined,
        { title, pages },
        signal,
      ),
    ),
  remove: async (token) => {
    await request('/api/document-session', 'DELETE', token);
  },
  edit: async (token, page, revision, text, signal) =>
    sessionSchema.parse(
      await request(
        `/api/document-session/pages/${page}`,
        'PATCH',
        token,
        { revision, text },
        signal,
      ),
    ),
  ask: async (token, revision, question, mode, locale, signal) =>
    sessionAnswerSchema.parse(
      await request(
        '/api/document-session/ask',
        'POST',
        token,
        { revision, question, mode, locale },
        signal,
      ),
    ),
  recognize: async (token, revision, pages, signal) =>
    sessionSchema.parse(
      await request(
        '/api/document-session/recognize',
        'POST',
        token,
        { revision, consent: true, pages },
        signal,
      ),
    ),
};
