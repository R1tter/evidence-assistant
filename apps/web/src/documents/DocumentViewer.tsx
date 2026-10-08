import { ExpandedDocument } from './ExpandedDocument.js';
import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { PageText } from '@evidence/core';
import type { PagePreview } from './types.js';
import type { DocumentMessages } from './messages.js';
export type DocumentView = 'original' | 'text' | 'edit';
export function TranscriptEditor({
  t,
  busy,
  save,
  draft,
  setDraft,
  reset,
}: {
  t: DocumentMessages;
  busy: boolean;
  save(this: void, text: string): void;
  draft: string;
  setDraft(this: void, text: string): void;
  reset(this: void): void;
}) {
  return (
    <div className="transcript">
      <label htmlFor="page-edit">{t.editLabel}</label>
      <textarea
        id="page-edit"
        value={draft}
        maxLength={40000}
        aria-describedby="revision-help"
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="actions">
        <button className="primary" disabled={busy} onClick={() => save(draft)}>
          {t.saveText}
        </button>
        <button disabled={busy} onClick={reset}>
          {t.undoText}
        </button>
      </div>
      <p id="revision-help">{t.revisionHelp}</p>
    </div>
  );
}
export function DocumentViewer({
  provenance,
  t,
  pages,
  previews,
  number,
  view,
  busy,
  passage,
  passageRef,
  onPage,
  onView,
  save,
  returnToQuestion,
}: {
  provenance: string;
  t: DocumentMessages;
  pages: PageText[];
  previews: PagePreview[];
  number: number;
  view: DocumentView;
  busy: boolean;
  passage: string | undefined;
  passageRef: RefObject<HTMLDivElement | null>;
  onPage(this: void, page: number): void;
  onView(this: void, view: DocumentView): void;
  save(this: void, text: string): void;
  returnToQuestion(this: void): void;
}) {
  const page = pages.find((item) => item.page === number)!;
  const enlargeButton = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const preview = previews.find((item) => item.page === number)!;
  return (
    <section className="document-panel" aria-label={t.documentAndText}>
      <div className="document-toolbar">
        {(['original', 'text', 'edit'] as const).map((item, index) => (
          <button
            key={item}
            aria-pressed={view === item}
            onClick={() => onView(item)}
          >
            {[t.originalTab, t.transcriptTab, t.editText][index]}
          </button>
        ))}
      </div>
      <div className="page-meta">
        <label>
          {t.documentTab}{' '}
          <select
            value={number}
            aria-label={t.documentTab}
            onChange={(event) => onPage(Number(event.target.value))}
          >
            {pages.map((page) => (
              <option key={page.page} value={page.page}>
                {page.page} / {pages.length}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="page-provenance pill tag-teal">{provenance}</p>
      {view === 'original' && (
        <div className="original-page">
          <button
            ref={enlargeButton}
            className="enlarge-document"
            onClick={() => setExpanded(true)}
          >
            {t.enlarge}
          </button>
          <img
            src={preview.url}
            width={preview.width}
            height={preview.height}
            alt={`${t.documentTab} ${number}`}
          />
        </div>
      )}
      {expanded && (
        <ExpandedDocument
          key={number}
          t={t}
          preview={preview}
          close={() => {
            setExpanded(false);
            enlargeButton.current?.focus();
          }}
        />
      )}
      {view !== 'original' && (
        <div className="transcript">
          <h2>{t.transcriptTitle}</h2>
          <p>{t.transcriptNote}</p>
          {passage && (
            <div
              className="passage"
              ref={passageRef}
              data-testid="source-passage"
              tabIndex={-1}
            >
              <strong>{t.passageTitle.replace('1', String(number))}</strong>
              <p className="help">{provenance}</p>
              <p>{passage}</p>
              <button onClick={returnToQuestion}>{t.questionsTab}</button>
            </div>
          )}
          {view === 'text' && (
            <section
              className="page-text transcript-sheet"
              aria-label={`${t.transcriptTab} · ${t.pageLabel} ${number}`}
            >
              <strong className="transcript-label">
                {t.transcriptTab} · {number}
              </strong>
              <div>{page.text || t.illegibleTitle}</div>
            </section>
          )}
          {view === 'edit' && (
            <TranscriptEditor
              t={t}
              busy={busy}
              save={save}
              draft={drafts[number] ?? page.text}
              setDraft={(text) =>
                setDrafts((previous) => ({ ...previous, [number]: text }))
              }
              reset={() =>
                setDrafts((previous) => ({ ...previous, [number]: page.text }))
              }
            />
          )}
          {page.uncertainties.length > 0 && (
            <ul>
              {page.uncertainties.map((notice, index) => (
                <li key={index}>{notice}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
