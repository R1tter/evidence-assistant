import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { pageTextSchema } from '@evidence/core';
import type { DocumentSessions } from './document-session.js';
import type { ProviderQueue } from './provider-queue.js';
import {
  validateRecognitionInput,
  validateRecognitionOutput,
} from './recognition.js';
import type { Recognizer } from './recognition.js';
import { PublicError } from './errors.js';
interface RecognitionRoutes {
  sessions: DocumentSessions;
  queue: ProviderQueue;
  recognize: Recognizer['recognize'] | undefined;
  signal(request: FastifyRequest): AbortSignal | undefined;
  deadlineMs?: number;
}
const outputSchema = z
  .array(pageTextSchema.extend({ origin: z.literal('vision') }))
  .min(1)
  .max(5);
export function registerRecognitionRoutes(
  app: FastifyInstance,
  options: RecognitionRoutes,
) {
  app.post(
    '/api/document-session/recognize',
    { bodyLimit: 14 * 1024 * 1024 },
    async (request) => {
      const capability = request.headers['x-document-session'];
      if (typeof capability !== 'string')
        throw new PublicError('SESSION_EXPIRED');
      const input = validateRecognitionInput(request.body);
      const session = options.sessions.assertRevision(
        capability,
        input.revision,
      );
      const selected = input.pages.map((page) => page.page);
      if (
        selected.some(
          (page) => !session.document.pages.some((item) => item.page === page),
        )
      )
        throw new PublicError('INVALID_REQUEST');
      if (!options.recognize) throw new PublicError('AI_UNAVAILABLE');
      try {
        const value: unknown = await options.queue.run(
          (signal) => {
            options.sessions.assertRevision(capability, input.revision);
            return options.recognize!(input.pages, signal);
          },
          options.signal(request),
          options.deadlineMs ?? 60000,
        );
        const parsed = outputSchema.safeParse(value);
        if (!parsed.success) throw new PublicError('PROVIDER_INVALID');
        const recognized = validateRecognitionOutput(
          {
            pages: parsed.data.map((page) => ({
              page: page.page,
              text: page.text,
              uncertainties: page.uncertainties,
            })),
          },
          selected,
        );
        const current = options.sessions.assertRevision(
          capability,
          input.revision,
        );
        const pages = current.document.pages.map(
          (page) => recognized.find((item) => item.page === page.page) ?? page,
        );
        if (pages.reduce((sum, page) => sum + page.text.length, 0) > 40000)
          throw new PublicError('PROVIDER_INVALID');
        const { document, expiresAt } = options.sessions.replacePages(
          capability,
          input.revision,
          pages,
        );
        return { document, expiresAt };
      } catch (error) {
        if (error instanceof PublicError) throw error;
        throw new PublicError('PROVIDER_INVALID');
      }
    },
  );
}
