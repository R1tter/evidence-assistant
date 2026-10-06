import type { Evidence } from '@evidence/core';
export interface AnswerGenerator {
  generate(
    this: void,
    question: string,
    evidence: Evidence[],
    signal?: AbortSignal,
  ): Promise<unknown>;
}
export interface RequestLog {
  requestId: string;
  mode: 'demo' | 'llm' | 'recognition' | 'unknown';
  status: number;
  durationMs: number;
}
