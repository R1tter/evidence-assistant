import { randomBytes, randomUUID } from 'node:crypto';
import {
  createDocumentRevision,
  createRetriever,
  pageChunks,
} from '@evidence/core';
import type { DocumentRevision, Retriever } from '@evidence/core';
import { PublicError } from './errors.js';
export interface SessionOptions {
  now?: () => number;
  maxSessions?: number;
  maxBytes?: number;
}
interface SessionRecord {
  document: DocumentRevision;
  retriever: Retriever;
  bytes: number;
  expiresAt: number;
}
export function createDocumentSessions(options: SessionOptions = {}) {
  const sessions = new Map<string, SessionRecord>();
  const now = options.now ?? Date.now;
  const ttl = 30 * 60000;
  const maxSessions = options.maxSessions ?? 20;
  const maxBytes = options.maxBytes ?? 50 * 1024 * 1024;
  let usedBytes = 0;
  const remove = (token: string) => {
    const record = sessions.get(token);
    if (record) usedBytes -= record.bytes;
    sessions.delete(token);
  };
  const cleanup = () => {
    for (const [token, record] of sessions)
      if (record.expiresAt <= now()) remove(token);
  };
  const get = (token: string) => {
    cleanup();
    const record = sessions.get(token);
    if (!record) throw new PublicError('SESSION_EXPIRED');
    record.expiresAt = now() + ttl;
    return {
      document: record.document,
      retriever: record.retriever,
      expiresAt: record.expiresAt,
    };
  };
  const assertRevision = (token: string, revision: number) => {
    const record = get(token);
    if (record.document.revision !== revision)
      throw new PublicError('REVISION_CONFLICT');
    return record;
  };
  const makeRecord = (
    id: string,
    title: string,
    pages: unknown,
    revision: number,
  ): SessionRecord => {
    let document: DocumentRevision;
    try {
      document = createDocumentRevision(id, title, pages, revision);
    } catch {
      throw new PublicError('INVALID_REQUEST');
    }
    const chunks = pageChunks(document);
    const bytes =
      Buffer.byteLength(JSON.stringify(document)) +
      Buffer.byteLength(JSON.stringify(chunks));
    return {
      document,
      bytes,
      retriever: Object.freeze(createRetriever(chunks)),
      expiresAt: now() + ttl,
    };
  };
  const replace = (
    token: string,
    document: DocumentRevision,
    pages: unknown,
  ) => {
    const next = makeRecord(
      document.id,
      document.title,
      pages,
      document.revision + 1,
    );
    const previous = sessions.get(token)!;
    if (usedBytes - previous.bytes + next.bytes > maxBytes)
      throw new PublicError('SESSION_CAPACITY');
    usedBytes += next.bytes - previous.bytes;
    sessions.set(token, next);
    return get(token);
  };
  return {
    get,
    cleanup,
    assertRevision,
    create(title: string, pages: unknown) {
      cleanup();
      if (sessions.size >= maxSessions)
        throw new PublicError('SESSION_CAPACITY');
      const record = makeRecord(randomUUID(), title, pages, 1);
      if (usedBytes + record.bytes > maxBytes)
        throw new PublicError('SESSION_CAPACITY');
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, record);
      usedBytes += record.bytes;
      return { token, document: record.document, expiresAt: record.expiresAt };
    },
    update(token: string, page: number, revision: number, text: string) {
      const { document } = assertRevision(token, revision);
      if (!document.pages.some((item) => item.page === page))
        throw new PublicError('INVALID_REQUEST');
      return replace(
        token,
        document,
        document.pages.map((item) =>
          item.page === page
            ? { ...item, text, origin: 'reviewed', uncertainties: [] }
            : item,
        ),
      );
    },
    replacePages(token: string, revision: number, pages: unknown) {
      return replace(token, assertRevision(token, revision).document, pages);
    },
    delete(token: string) {
      get(token);
      remove(token);
    },
    clear() {
      sessions.clear();
      usedBytes = 0;
    },
  };
}
export type DocumentSessions = ReturnType<typeof createDocumentSessions>;
