import { useState } from 'react';
import type { RefObject } from 'react';
import type { PageText } from '@evidence/core';
import type { PagePreview } from './types.js';
import type { DocumentMessages } from './messages.js';
export type DocumentView = 'original' | 'text' | 'edit';
export function TranscriptEditor({
  page,
  t,
  busy,
  save,
}: {
  page: PageText;
  t: DocumentMessages;
  busy: boolean;
  save(this: void, text: string): void;
}) {
  const [draft, setDraft] = useState(page.text);
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
        <button disabled={busy} onClick={() => setDraft(page.text)}>
          {t.undoText}
        </button>
      </div>
      <p id="revision-help">{t.revisionHelp}</p>
    </div>
  );
}
export function DocumentViewer({
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
      {view === 'original' && (
        <div className="original-page">
          <img
            src={preview.url}
            width={preview.width}
            height={preview.height}
            alt={`${t.documentTab} ${number}`}
          />
        </div>
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
              <p>{passage}</p>
              <button onClick={returnToQuestion}>{t.questionsTab}</button>
            </div>
          )}
          {view === 'text' && (
            <div className="page-text">{page.text || t.illegibleTitle}</div>
          )}
          {view === 'edit' && (
            <TranscriptEditor
              key={`${number}:${page.text}`}
              page={page}
              t={t}
              busy={busy}
              save={save}
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
