import type { RefObject } from 'react';
import type { PageText } from '@evidence/core';
import type { DocumentMessages } from './messages.js';
import type { TextMatch } from './document-search.js';
import { SearchText } from './SearchText.js';
export function TranscriptSheet({
  t,
  page,
  matches,
  active,
}: {
  t: DocumentMessages;
  page: PageText;
  matches: TextMatch[];
  active: TextMatch | undefined;
}) {
  return (
    <section
      className="page-text transcript-sheet"
      aria-label={`${t.transcriptTab} · ${t.pageLabel} ${page.page}`}
    >
      <strong className="transcript-label">
        {t.transcriptTab} · {page.page}
      </strong>
      <div>
        <SearchText
          text={page.text || t.illegibleTitle}
          matches={matches.filter((match) => match.page === page.page)}
          active={active}
        />
      </div>
    </section>
  );
}
export function TranscriptNotice({
  t,
  page,
  provenance,
  passage,
  passageRef,
  returnToQuestion,
}: {
  t: DocumentMessages;
  page: PageText;
  provenance: string;
  passage: string | undefined;
  passageRef: RefObject<HTMLDivElement | null>;
  returnToQuestion(this: void): void;
}) {
  return (
    <>
      <h2>{t.transcriptTitle}</h2>
      <p>{t.transcriptNote}</p>
      {passage && (
        <div
          className="passage"
          ref={passageRef}
          data-testid="source-passage"
          tabIndex={-1}
        >
          <strong>{t.passageTitle.replace('1', String(page.page))}</strong>
          <p className="help">{provenance}</p>
          <p>{passage}</p>
          <button onClick={returnToQuestion}>{t.questionsTab}</button>
        </div>
      )}
      {page.uncertainties.length > 0 && (
        <ul>
          {page.uncertainties.map((notice, index) => (
            <li key={index}>{notice}</li>
          ))}
        </ul>
      )}
    </>
  );
}
