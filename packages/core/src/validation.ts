import { z } from 'zod';
import type { Evidence } from './types.js';

export const citationSchema = z.strictObject({
  chunkId: z.string().min(1),
  quote: z
    .string()
    .min(1)
    .max(4000)
    .refine((value) => value.trim().length > 0),
});

// Provider output supplies only content; evidence and checks belong to the core.
export const answerContentSchema = z.strictObject({
  mode: z.enum(['demo', 'llm']),
  answer: z
    .string()
    .min(1)
    .max(4000)
    .refine((value) => value.trim().length > 0),
  citations: z.array(citationSchema).max(5),
  abstained: z.boolean(),
});

export type Citation = z.infer<typeof citationSchema>;
export interface Answer extends z.infer<typeof answerContentSchema> {
  evidence: Evidence[];
  validation: {
    structure: boolean;
    references: boolean;
    quotes: boolean;
    semantic: 'not_verified';
  };
}

function validCitations(citations: Citation[], evidence: Evidence[]): boolean {
  return citations.every(({ chunkId, quote }) => {
    const source = evidence.find(({ chunk }) => chunk.id === chunkId);
    return source !== undefined && source.chunk.text.includes(quote);
  });
}

export function validateAnswer(value: unknown, evidence: Evidence[]): Answer {
  const result = answerContentSchema.safeParse(value);
  if (!result.success) throw new Error('Invalid answer');
  const content = result.data;
  const countValid = content.abstained
    ? content.citations.length === 0
    : content.citations.length > 0;
  if (!countValid || !validCitations(content.citations, evidence))
    throw new Error('Invalid answer');
  return {
    ...content,
    evidence,
    validation: {
      structure: true,
      references: true,
      quotes: true,
      semantic: 'not_verified',
    },
  };
}
