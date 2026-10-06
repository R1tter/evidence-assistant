import { z } from 'zod';
import { answerContentSchema } from './validation.js';
export {
  pageTextSchema,
  pageTextsSchema,
  documentRevisionSchema,
} from './document-revisions.js';
import { documentRevisionSchema } from './document-revisions.js';
const provenance = z.strictObject({
  page: z.number().int().min(1).max(5),
  block: z.number().int().min(1),
  revision: z.number().int().min(1),
  origin: z.enum(['embedded', 'vision', 'reviewed']),
});
export const answerResultSchema = answerContentSchema.extend({
  evidence: z
    .array(
      z.object({
        chunk: z.object({
          id: z.string(),
          documentId: z.string(),
          title: z.string(),
          section: z.string(),
          text: z.string(),
          provenance: provenance.optional(),
        }),
        score: z.number().finite(),
      }),
    )
    .max(5),
  validation: z.strictObject({
    structure: z.boolean(),
    references: z.boolean(),
    quotes: z.boolean(),
    semantic: z.literal('not_verified'),
  }),
});
export const sessionSchema = z.strictObject({
  document: documentRevisionSchema,
  expiresAt: z.number().finite().nonnegative(),
});
export const createdSessionSchema = sessionSchema.extend({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});
export const sessionAnswerSchema = answerResultSchema.extend({
  revision: z.number().int().min(1),
});
export const assistantConfigSchema = z.object({
  llmAvailable: z.boolean(),
  recognitionAvailable: z.boolean().default(false),
});
