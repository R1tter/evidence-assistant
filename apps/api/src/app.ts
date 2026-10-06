import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  createRetriever,
  createDemoAnswer,
  validateAnswer,
} from '@evidence/core';
import type { Chunk, Document } from '@evidence/core';
import type { AnswerGenerator, RequestLog } from './contracts.js';
import { PublicError } from './errors.js';
import { createProviderQueue } from './provider-queue.js';
import { createDocumentSessions } from './document-session.js';
import type { SessionOptions } from './document-session.js';
import { registerDocumentRoutes } from './document-routes.js';

const inputSchema = z.strictObject({
  question: z.string().trim().min(1).max(1000),
  mode: z.enum(['demo', 'llm']),
});
interface AppOptions {
  sessionOptions?: SessionOptions;
  chunks: Chunk[];
  documents?: Document[];
  generate?: AnswerGenerator['generate'];
  deadlineMs?: number;
  log?: (entry: RequestLog) => void;
}
interface RequestState {
  started: number;
  mode: RequestLog['mode'];
  controller: AbortController;
  cleanup(): void;
}

function publicError(error: unknown): PublicError {
  if (error instanceof PublicError) return error;
  const status =
    error instanceof Error && 'statusCode' in error
      ? error.statusCode
      : undefined;
  if (status === 413) return new PublicError('BODY_TOO_LARGE');
  if (status === 400 || status === 415)
    return new PublicError('INVALID_REQUEST');
  return new PublicError('INTERNAL_ERROR');
}

export function buildApp(options: AppOptions) {
  const app = Fastify({
    bodyLimit: 16384,
    logger: false,
    genReqId: () => randomUUID(),
  });
  const retriever = createRetriever(options.chunks);
  const documents = (options.documents ?? []).map((document) =>
    Object.freeze({ ...document }),
  );
  const queue = createProviderQueue(options.deadlineMs);
  const states = new WeakMap<FastifyRequest, RequestState>();
  const sessions = createDocumentSessions(options.sessionOptions);
  const sessionCleanup = setInterval(() => sessions.cleanup(), 60000);
  sessionCleanup.unref();
  app.addHook('onClose', (_instance, done) => {
    clearInterval(sessionCleanup);
    sessions.clear();
    done();
  });
  registerDocumentRoutes(app, {
    sessions,
    queue,
    generate: options.generate,
    signal: (request) => states.get(request)?.controller.signal,
  });
  app.addHook('onRequest', (request, reply, done) => {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    const close = () => {
      if (!reply.raw.writableFinished) cancel();
    };
    request.raw.once('aborted', cancel);
    reply.raw.once('close', close);
    states.set(request, {
      started: performance.now(),
      mode: 'unknown',
      controller,
      cleanup: () => {
        request.raw.removeListener('aborted', cancel);
        reply.raw.removeListener('close', close);
      },
    });
    done();
  });
  app.addHook('onResponse', (request, reply, done) => {
    const state = states.get(request);
    if (state) {
      state.cleanup();
      options.log?.({
        requestId: request.id,
        mode: state.mode,
        status: reply.statusCode,
        durationMs: performance.now() - state.started,
      });
    }
    done();
  });
  app.setErrorHandler((error, request, reply) => {
    const failure = publicError(error);
    if (failure.status === 429) reply.header('Retry-After', '1');
    void reply.code(failure.status).send({
      error: {
        code: failure.code,
        message: failure.message,
        requestId: request.id,
      },
    });
  });
  app.setNotFoundHandler(() => {
    throw new PublicError('NOT_FOUND');
  });
  app.get('/api/config', () => ({
    llmAvailable: options.generate !== undefined,
  }));
  app.get('/api/documents', () =>
    documents.map(({ id, title, path }) => ({ id, title, path })),
  );
  app.get<{ Params: { id: string } }>('/api/documents/:id', (request) => {
    const document = documents.find(({ id }) => id === request.params.id);
    if (!document) throw new PublicError('NOT_FOUND');
    return document;
  });
  app.post('/api/ask', async (request) => {
    const parsed = inputSchema.safeParse(request.body);
    if (!parsed.success) throw new PublicError('INVALID_REQUEST');
    const { question, mode } = parsed.data;
    const state = states.get(request);
    if (state) state.mode = mode;
    if (mode === 'llm' && !options.generate)
      throw new PublicError('AI_UNAVAILABLE');
    const evidence = retriever.search(question);
    if (mode === 'demo' || evidence.length === 0)
      return { ...createDemoAnswer(evidence), mode };
    const generate = options.generate!;
    try {
      const value = await queue.run(
        (signal) => generate(question, evidence, signal),
        state?.controller.signal,
      );
      return { ...validateAnswer(value, evidence), mode: 'llm' as const };
    } catch (error) {
      if (error instanceof PublicError) throw error;
      throw new PublicError('PROVIDER_INVALID');
    }
  });
  return app;
}
