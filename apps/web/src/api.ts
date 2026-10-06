import type { Answer } from '@evidence/core';
import { z } from 'zod';

const chunk = z.object({
  id: z.string(),
  documentId: z.string(),
  title: z.string(),
  section: z.string(),
  text: z.string(),
});
const answerSchema = z.object({
  mode: z.enum(['demo', 'llm']),
  answer: z.string(),
  abstained: z.boolean(),
  citations: z.array(z.object({ chunkId: z.string(), quote: z.string() })),
  evidence: z.array(z.object({ chunk, score: z.number().finite() })),
  validation: z.object({
    structure: z.boolean(),
    references: z.boolean(),
    quotes: z.boolean(),
    semantic: z.literal('not_verified'),
  }),
});
const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});
export interface AssistantClient {
  config(signal?: AbortSignal): Promise<{ llmAvailable: boolean }>;
  ask(
    input: { question: string; mode: 'demo' | 'llm' },
    signal?: AbortSignal,
  ): Promise<Answer>;
  document(
    id: string,
    signal?: AbortSignal,
  ): Promise<z.infer<typeof sourceSchema>>;
}
async function request(path: string, options: RequestInit): Promise<unknown> {
  const response = await fetch(path, options);
  if (!response.ok) throw new Error('Request failed');
  return response.json() as Promise<unknown>;
}
export const httpClient: AssistantClient = {
  config: async (signal) =>
    z
      .object({ llmAvailable: z.boolean() })
      .parse(await request('/api/config', signal ? { signal } : {})),
  ask: async (input, signal) =>
    answerSchema.parse(
      await request('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        ...(signal ? { signal } : {}),
      }),
    ),
  document: async (id, signal) =>
    sourceSchema.parse(
      await request(
        `/api/documents/${encodeURIComponent(id)}`,
        signal ? { signal } : {},
      ),
    ),
};
