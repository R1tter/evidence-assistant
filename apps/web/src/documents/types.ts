import type { PageText } from '@evidence/core';
export type { PageText } from '@evidence/core';
export interface PagePreview {
  page: number;
  url: string;
  width: number;
  height: number;
}
export interface ReadDocument {
  pages: PageText[];
  previews: PagePreview[];
  requiresRecognition: boolean;
  dispose(this: void): void;
}
