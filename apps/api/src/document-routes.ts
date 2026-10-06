import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  createExtractiveDocumentAnswer,
  validateAnswer,
  pageTextsSchema,
} from '@evidence/core';
import type { AnswerGenerator } from './contracts.js';
import type { DocumentSessions } from './document-session.js';
import type { ProviderQueue } from './provider-queue.js';
import { PublicError } from './errors.js';
const createSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  pages: pageTextsSchema,
});
const editSchema = z.strictObject({
  revision: z.number().int().min(1),
  text: z.string().max(40000),
});
const askSchema = z.strictObject({
  revision: z.number().int().min(1),
  question: z.string().trim().min(1).max(1000),
  mode: z.enum(['demo', 'llm']),
  locale: z.enum(['en', 'pt-BR', 'es']),
});
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new PublicError('INVALID_REQUEST');
  return result.data;
}
function token(request: FastifyRequest): string {
  const value = request.headers['x-document-session'];
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value))
    throw new PublicError('SESSION_EXPIRED');
  return value;
}
interface RouteOptions {
  sessions: DocumentSessions;
  queue: ProviderQueue;
  generate: AnswerGenerator['generate'] | undefined;
  signal(
    request: FastifyRequest,
    mode: 'demo' | 'llm',
  ): AbortSignal | undefined;
}
export function registerDocumentRoutes(
  app: FastifyInstance,
  options: RouteOptions,
) {
  const { sessions } = options;
  app.post(
    '/api/document-sessions',
    { bodyLimit: 384 * 1024 },
    (request, reply) => {
      const input = parse(createSchema, request.body);
      return reply.code(201).send(sessions.create(input.title, input.pages));
    },
  );
  app.get('/api/document-session', (request) => {
    const { document, expiresAt } = sessions.get(token(request));
    return { document, expiresAt };
  });
  app.delete('/api/document-session', (request, reply) => {
    sessions.delete(token(request));
    return reply.code(204).send();
  });
  app.patch<{ Params: { page: string } }>(
    '/api/document-session/pages/:page',
    { bodyLimit: 256 * 1024 },
    (request) => {
      const input = parse(editSchema, request.body);
      const { document, expiresAt } = sessions.update(
        token(request),
        Number(request.params.page),
        input.revision,
        input.text,
      );
      return { document, expiresAt };
    },
  );
  app.post('/api/document-session/ask', async (request) => {
    const input = parse(askSchema, request.body);
    const requestSignal = options.signal(request, input.mode);
    const capability = token(request);
    const session = sessions.assertRevision(capability, input.revision);
    if (input.mode === 'llm' && !options.generate)
      throw new PublicError('AI_UNAVAILABLE');
    const evidence = session.retriever.search(input.question);
    if (input.mode === 'demo' || evidence.length === 0)
      return {
        ...createExtractiveDocumentAnswer(input.question, evidence),
        mode: input.mode,
        revision: input.revision,
      };
    try {
      const locale = {
        en: 'English',
        'pt-BR': 'Brazilian Portuguese',
        es: 'Spanish',
      }[input.locale];
      const question = `Answer in ${locale}, preserving original quotations.\nQuestion: ${input.question}`;
      const output = await options.queue.run((signal) => {
        sessions.assertRevision(capability, input.revision);
        return options.generate!(question, evidence, signal);
      }, requestSignal);
      sessions.assertRevision(capability, input.revision);
      return {
        ...validateAnswer(output, evidence),
        mode: 'llm',
        revision: input.revision,
      };
    } catch (error) {
      if (error instanceof PublicError) throw error;
      throw new PublicError('PROVIDER_INVALID');
    }
  });
}
