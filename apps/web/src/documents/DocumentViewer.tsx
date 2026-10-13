import { CompareDocument } from './CompareDocument.js';
import { DocumentSearch } from './DocumentSearch.js';
import { TranscriptSheet, TranscriptNotice } from './DocumentTranscript.js';
import { OriginalDocument } from './OriginalDocument.js';
import { useDocumentSearch } from './useDocumentSearch.js';
import { useState } from 'react';
import type { RefObject } from 'react';
import type { PageText } from '@evidence/core';
import type { PagePreview } from './types.js';
import type { DocumentMessages } from './messages.js';
export type DocumentView = 'original' | 'text' | 'edit' | 'compare';
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
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const preview = previews.find((item) => item.page === number)!;
  const [comparePane, setComparePane] = useState('text');
  const search = useDocumentSearch(pages, onPage, view, onView, () =>
    setComparePane('text'),
  );
  return (
    <section className="document-panel" aria-label={t.documentAndText}>
      <div className="document-toolbar">
        {(['original', 'text', 'edit', 'compare'] as const).map(
          (item, index) => (
            <button
              key={item}
              aria-pressed={view === item}
              onClick={() => onView(item)}
            >
              {
                [t.originalTab, t.transcriptTab, t.editText, t.compareTab][
                  index
                ]
              }
            </button>
          ),
        )}
      </div>
      <DocumentSearch t={t} {...search} count={search.matches.length} />
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
      {(view === 'original' || view === 'compare') && (
        <OriginalDocument
          t={t}
          preview={preview}
          showImage={view === 'original'}
        />
      )}
      {view === 'compare' && (
        <CompareDocument
          t={t}
          preview={preview}
          pane={comparePane}
          setPane={setComparePane}
        >
          <TranscriptNotice
            t={t}
            page={page}
            provenance={provenance}
            passage={passage}
            passageRef={passageRef}
            returnToQuestion={returnToQuestion}
          />
          <TranscriptSheet
            t={t}
            page={page}
            matches={search.matches}
            active={search.active}
          />
        </CompareDocument>
      )}
      {view !== 'original' && view !== 'compare' && (
        <div className="transcript">
          <TranscriptNotice
            t={t}
            page={page}
            provenance={provenance}
            passage={passage}
            passageRef={passageRef}
            returnToQuestion={returnToQuestion}
          />
          {view === 'text' && (
            <TranscriptSheet
              t={t}
              page={page}
              matches={search.matches}
              active={search.active}
            />
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
        </div>
      )}
    </section>
  );
}
