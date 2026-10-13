import type { SessionAnswer } from './session-client.js';
export interface HistoryEntry {
  question: string;
  answer: SessionAnswer;
}
