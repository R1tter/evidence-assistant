import { useCallback, useEffect, useRef, useState } from 'react';
import type { DocumentRevision } from '@evidence/core';
import { sessionClient, SessionApiError } from './session-client.js';
import type { SessionClient, SessionAnswer } from './session-client.js';
import { readDocument } from './read.js';
import { loadExample } from './load-example.js';
import type {
  DocumentExample,
  ExampleKind,
  ExampleLocale,
} from './examples.js';
import type { ReadDocument } from './types.js';
import { recognitionImages } from './recognition-images.js';
export interface DocumentServices {
  client: SessionClient;
  read: typeof readDocument;
  example: typeof loadExample;
}
export const documentServices: DocumentServices = {
  client: sessionClient,
  read: readDocument,
  example: loadExample,
};
export interface LoadedDocument {
  local: ReadDocument;
  document: DocumentRevision;
  token: string;
  expiresAt: number;
  example: DocumentExample | undefined;
}
export type WorkStatus =
  'home' | 'upload' | 'reading' | 'ready' | 'asking' | 'recognizing' | 'saving';
export function useDocumentSession(services: DocumentServices) {
  const [status, setStatus] = useState<WorkStatus>('home');
  const [loaded, setLoaded] = useState<LoadedDocument>();
  const [answer, setAnswer] = useState<SessionAnswer>();
  const [error, setError] = useState<string>();
  const [config, setConfig] = useState({
    llmAvailable: false,
    recognitionAvailable: false,
  });
  const current = useRef<LoadedDocument | undefined>(undefined);
  const operation = useRef<AbortController | undefined>(undefined);
  const sequence = useRef(0);
  const invalidateOperation = useCallback(() => {
    operation.current?.abort();
    sequence.current++;
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void services.client
      .config(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setConfig(value);
      })
      .catch(() => undefined);
    return () => {
      controller.abort();
      invalidateOperation();
      current.current?.local.dispose();
      if (current.current)
        void services.client
          .remove(current.current.token)
          .catch(() => undefined);
    };
  }, [services, invalidateOperation]);
  const start = (next: WorkStatus) => {
    operation.current?.abort();
    const controller = new AbortController();
    operation.current = controller;
    const id = ++sequence.current;
    setStatus(next);
    setError(undefined);
    return { controller, id };
  };
  const run = async (
    next: WorkStatus,
    task: (signal: AbortSignal, id: number) => Promise<void>,
  ) => {
    const { controller, id } = start(next);
    try {
      await task(controller.signal, id);
      if (id === sequence.current) setStatus('ready');
    } catch (failure) {
      if (id !== sequence.current || controller.signal.aborted) return;
      setError(
        failure instanceof SessionApiError
          ? failure.code
          : failure instanceof Error && 'code' in failure
            ? String(failure.code)
            : 'REQUEST_FAILED',
      );
      setStatus(current.current ? 'ready' : 'upload');
    }
  };
  const clear = () => {
    operation.current?.abort();
    sequence.current++;
    const previous = current.current;
    current.current = undefined;
    previous?.local.dispose();
    if (previous)
      void services.client.remove(previous.token).catch(() => undefined);
    setLoaded(undefined);
    setAnswer(undefined);
    setError(undefined);
  };
  const install = async (
    local: ReadDocument,
    title: string,
    example: DocumentExample | undefined,
    signal: AbortSignal,
    id: number,
  ) => {
    if (signal.aborted || id !== sequence.current) {
      local.dispose();
      return;
    }
    let token: string | undefined;
    try {
      const created = await services.client.create(title, local.pages, signal);
      token = created.token;
      if (signal.aborted || id !== sequence.current) {
        void services.client.remove(token).catch(() => undefined);
        local.dispose();
        return;
      }
      const next = { local, ...created, example };
      current.current = next;
      setLoaded(next);
    } catch (failure) {
      local.dispose();
      if (token) void services.client.remove(token).catch(() => undefined);
      throw failure;
    }
  };
  const update = (document: DocumentRevision, expiresAt: number) => {
    const previous = current.current;
    if (!previous) return;
    const next = { ...previous, document, expiresAt };
    current.current = next;
    setLoaded(next);
    setAnswer(undefined);
  };
  return {
    status,
    loaded,
    answer,
    error,
    config,
    clearError: () => {
      if (error !== 'SESSION_EXPIRED') setError(undefined);
    },
    upload: () => {
      clear();
      setStatus('upload');
    },
    home: () => {
      clear();
      setStatus('home');
    },
    cancel: () => {
      operation.current?.abort();
      sequence.current++;
      setStatus(current.current ? 'ready' : 'upload');
    },
    example: (locale: ExampleLocale, kind: ExampleKind) => {
      clear();
      void run('reading', async (signal, id) => {
        const result = await services.example(locale, kind, signal);
        await install(
          result.document,
          result.example.title,
          result.example,
          signal,
          id,
        );
      });
    },
    read: (file: File) => {
      clear();
      void run('reading', async (signal, id) => {
        const local = await services.read(file, signal);
        await install(local, file.name.slice(0, 120), undefined, signal, id);
      });
    },
    ask: (question: string, mode: 'demo' | 'llm', locale: ExampleLocale) => {
      const document = current.current;
      if (!document) return;
      setAnswer(undefined);
      void run('asking', async (signal, id) => {
        const result = await services.client.ask(
          document.token,
          document.document.revision,
          question,
          mode,
          locale,
          signal,
        );
        if (
          id === sequence.current &&
          result.revision === current.current?.document.revision
        )
          setAnswer(result);
      });
    },
    edit: (page: number, text: string) => {
      const document = current.current;
      if (!document) return;
      void run('saving', async (signal, id) => {
        const saved = await services.client.edit(
          document.token,
          page,
          document.document.revision,
          text,
          signal,
        );
        if (id === sequence.current) update(saved.document, saved.expiresAt);
      });
    },
    recognize: (selected: number[]) => {
      const document = current.current;
      if (!document || !config.recognitionAvailable) return;
      void run('recognizing', async (signal, id) => {
        const pages = await recognitionImages(
          document.local.previews,
          selected,
          signal,
        );
        const saved = await services.client.recognize(
          document.token,
          document.document.revision,
          pages,
          signal,
        );
        if (id === sequence.current) update(saved.document, saved.expiresAt);
      });
    },
  };
}
export type DocumentController = ReturnType<typeof useDocumentSession>;
