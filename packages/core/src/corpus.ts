import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Chunk, Document } from './types.js';

export async function loadCorpus(directory: string): Promise<Document[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();
  return Promise.all(
    files.map(async (path) => {
      const content = await readFile(join(directory, path), 'utf8');
      const id = basename(path, '.md');
      const title = /^#\s+(.+)$/m.exec(content)?.[1]?.trim() ?? id;
      return { id, title, path, content };
    }),
  );
}

function sectionId(section: string): string {
  return (
    section
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '') || 'section'
  );
}

function chunkDocument(document: Document): Chunk[] {
  const chunks: Chunk[] = [];
  const occurrences = new Map<string, number>();
  let section = document.title;
  let lines: string[] = [];
  let fenced = false;
  const flush = () => {
    const text = lines.join('\n').trim();
    lines = [];
    if (!text) return;
    const slug = sectionId(section);
    const occurrence = (occurrences.get(slug) ?? 0) + 1;
    occurrences.set(slug, occurrence);
    chunks.push({
      id: `${document.id}:${slug}:${occurrence}`,
      documentId: document.id,
      title: document.title,
      section,
      text,
    });
  };
  for (const line of document.content.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = fenced ? null : /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading?.[1]) {
      flush();
      section = heading[1];
    } else {
      lines.push(line);
    }
  }
  flush();
  return chunks;
}

export function chunkDocuments(documents: Document[]): Chunk[] {
  return documents.flatMap(chunkDocument);
}
