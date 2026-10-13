import { useState } from 'react';
import type { DocumentRevision } from '@evidence/core';
import type { DocumentMessages } from './messages.js';
import type { HistoryEntry } from './session-history.js';
import { buildSessionExport, downloadSessionExport } from './session-export.js';
export function SessionExport({
  t,
  document,
  history,
  disabled,
}: {
  t: DocumentMessages;
  document: DocumentRevision;
  history: readonly HistoryEntry[];
  disabled: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="session-export">
      <button
        disabled={disabled}
        onClick={() => {
          setFailed(false);
          try {
            downloadSessionExport(buildSessionExport(document, history, t));
          } catch {
            setFailed(true);
          }
        }}
      >
        {t.exportSession}
      </button>
      <p className="help">{t.exportHelp}</p>
      {failed && <p role="alert">{t.exportFailed}</p>}
    </div>
  );
}
