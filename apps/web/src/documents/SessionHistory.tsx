import type { DocumentMessages } from './messages.js';
import type { HistoryEntry } from './session-history.js';
export function SessionHistory({
  t,
  history,
  revision,
}: {
  t: DocumentMessages;
  history: readonly HistoryEntry[];
  revision: number;
}) {
  return (
    <section className="panel session-history" aria-labelledby="history-title">
      <h2 id="history-title">{t.historyTitle}</h2>
      <p className="help">{t.historyHelp}</p>
      {!history.length && <p>{t.historyEmpty}</p>}
      {history.map((entry, index) => (
        <HistoryRecord
          key={index}
          t={t}
          entry={entry}
          currentRevision={revision}
          number={index + 1}
        />
      ))}
    </section>
  );
}
function HistoryRecord({
  t,
  entry,
  currentRevision,
  number,
}: {
  t: DocumentMessages;
  entry: HistoryEntry;
  currentRevision: number;
  number: number;
}) {
  const answer = entry.answer;
  const stale = answer.revision !== currentRevision;
  return (
    <details className="history-record">
      <summary>
        {number}. {entry.question}
      </summary>
      <p className="help">
        {t.revisionLabel} {answer.revision} ·{' '}
        {stale ? t.previousRevision : t.currentRevision}
      </p>
      {stale && <p className="history-stale">{t.historyStaleHelp}</p>}
      <span className="pill tag-teal">
        {answer.mode === 'demo' ? t.answerExtracted : t.modeAi}
      </span>
      {answer.abstained && <p>{t.noEvidenceTitle}</p>}
      <p className="history-answer">{answer.answer}</p>
      {answer.citations.map((citation, index) => {
        const page = answer.evidence.find(
          (item) => item.chunk.id === citation.chunkId,
        )?.chunk.provenance?.page;
        return (
          <blockquote key={index}>
            <strong>
              {t.pageLabel} {page ?? '?'}
            </strong>
            <p>{citation.quote}</p>
          </blockquote>
        );
      })}
      <p className="help">{t.checksBody}</p>
    </details>
  );
}
