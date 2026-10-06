import { useEffect, useState } from 'react';
import type { Evidence, Answer } from '@evidence/core';
import type { AssistantClient } from './api.js';
import type { Messages } from './locales.js';
import type { RequestState } from './useAssistant.js';

export function ModeSelector({
  mode,
  available,
  onChange,
  t,
}: {
  mode: 'demo' | 'llm';
  available: boolean;
  onChange: (mode: 'demo' | 'llm') => void;
  t: Messages;
}) {
  return (
    <fieldset>
      <legend>{t.mode}</legend>
      <label>
        <input
          type="radio"
          name="mode"
          checked={mode === 'demo'}
          onChange={() => onChange('demo')}
        />
        {t.demo}
      </label>
      <label>
        <input
          type="radio"
          name="mode"
          checked={mode === 'llm'}
          disabled={!available}
          onChange={() => onChange('llm')}
        />
        {t.ai}
      </label>
      <p className="helper">{available ? t.modeHelp : t.unavailable}</p>
    </fieldset>
  );
}
export function SourceDisclosure({
  id,
  client,
  t,
}: {
  id: string;
  client: AssistantClient;
  t: Messages;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    client
      .document(id, controller.signal)
      .then((document) => {
        if (!controller.signal.aborted) {
          setContent(document.content);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [open, id, client]);
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{t.read}</summary>
      {failed ? (
        <p role="status">{t.sourceError}</p>
      ) : content !== null ? (
        <pre lang="en">{content}</pre>
      ) : (
        <p role="status">{t.loading}</p>
      )}
    </details>
  );
}
export function EvidenceCard({
  evidence,
  index,
  client,
  t,
}: {
  evidence: Evidence;
  index: number;
  client: AssistantClient;
  t: Messages;
}) {
  return (
    <article className="source" id={`source-${index + 1}`} tabIndex={-1}>
      <h3 lang="en">
        {index + 1}. {evidence.chunk.title}
      </h3>
      <p className="helper">
        <span lang="en">{evidence.chunk.section}</span> · {t.relevance}{' '}
        {evidence.score.toFixed(2)}
      </p>
      <p className="helper">{t.original}</p>
      <blockquote lang="en">{evidence.chunk.text}</blockquote>
      <SourceDisclosure id={evidence.chunk.documentId} client={client} t={t} />
    </article>
  );
}
function AnswerContent({ answer, t }: { answer: Answer; t: Messages }) {
  if (answer.abstained)
    return (
      <>
        <p>{t.abstention}</p>
        <p>{t.suggestion}</p>
      </>
    );
  return (
    <>
      <p className="answer-text" lang="en">
        {answer.answer}
      </p>
      <nav aria-label={t.sources}>
        {answer.citations.map((citation, index) => {
          const source = answer.evidence.findIndex(
            (e) => e.chunk.id === citation.chunkId,
          );
          return (
            <a
              key={citation.chunkId}
              href={`#source-${source + 1}`}
              onClick={() =>
                document.getElementById(`source-${source + 1}`)?.focus()
              }
            >
              [{index + 1}]
            </a>
          );
        })}
      </nav>
      <details>
        <summary>{t.checks}</summary>
        <p>{t.limits}</p>
      </details>
    </>
  );
}
export function AnswerPanel({
  state,
  t,
  retry,
}: {
  state: RequestState;
  t: Messages;
  retry: () => void;
}) {
  return (
    <section className="panel answer" aria-labelledby="answer-title">
      <h2 id="answer-title">{t.answer}</h2>
      <div role="status" aria-live="polite">
        {state.status === 'loading'
          ? t.loading
          : state.status === 'idle'
            ? t.initial
            : ''}
      </div>
      {state.status === 'success' && (
        <AnswerContent answer={state.answer} t={t} />
      )}
      {state.status === 'error' && (
        <>
          <p role="alert">{t.error}</p>
          <button onClick={retry}>{t.retry}</button>
        </>
      )}
    </section>
  );
}
