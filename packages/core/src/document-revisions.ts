import { z } from 'zod';
import type { Chunk } from './types.js';
export const pageTextSchema = z.strictObject({
  page: z.number().int().min(1).max(5),
  text: z.string().max(40000),
  origin: z.enum(['embedded', 'vision', 'reviewed']),
  uncertainties: z.array(z.string().min(1).max(200)).max(20),
});
export const pageTextsSchema = z
  .array(pageTextSchema)
  .min(1)
  .max(5)
  .refine(
    (pages) =>
      pages.every((page, i) => page.page === i + 1) &&
      pages.reduce((sum, page) => sum + page.text.length, 0) <= 40000,
  );
export const documentRevisionSchema = z.strictObject({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  title: z.string().trim().min(1).max(120),
  revision: z.number().int().min(1),
  pages: pageTextsSchema,
});
export type PageText = z.infer<typeof pageTextSchema>;
export type DocumentRevision = z.infer<typeof documentRevisionSchema>;
export function createDocumentRevision(
  id: string,
  title: string,
  pages: unknown,
  revision = 1,
): DocumentRevision {
  const parsed = documentRevisionSchema.parse({ id, title, pages, revision });
  for (const page of parsed.pages) {
    Object.freeze(page.uncertainties);
    Object.freeze(page);
  }
  Object.freeze(parsed.pages);
  return Object.freeze(parsed);
}
function blocks(text: string): string[] {
  if (!text.replaceAll('[illegible]', '').trim()) return [];
  const output: string[] = [];
  let rest = text.trim();
  while (rest) {
    const space = rest.lastIndexOf(' ', 1200);
    const end = rest.length <= 1200 ? rest.length : space > 0 ? space : 1200;
    output.push(rest.slice(0, end));
    rest = rest.slice(end).trimStart();
  }
  return output;
}
export function pageChunks(document: DocumentRevision): Chunk[] {
  return document.pages.flatMap((page) =>
    blocks(page.text).map((text, index) => ({
      id: `${document.id}:r${document.revision}:p${page.page}:b${index + 1}`,
      documentId: document.id,
      title: document.title,
      section: `Page ${page.page} · Block ${index + 1}`,
      text,
      provenance: Object.freeze({
        page: page.page,
        block: index + 1,
        revision: document.revision,
        origin: page.origin,
      }),
    })),
  );
}
