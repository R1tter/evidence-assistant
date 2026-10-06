import { useState } from 'react';
import type { PageText } from '@evidence/core';
import type { DocumentMessages } from './messages.js';
export function RecognitionControls({
  t,
  pages,
  available,
  busy,
  recognize,
}: {
  t: DocumentMessages;
  pages: PageText[];
  available: boolean;
  busy: boolean;
  recognize(this: void, selected: number[]): void;
}) {
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState(
    pages.filter((page) => !page.text.trim()).map((page) => page.page),
  );
  return (
    <aside className="recognition-panel">
      <h3>{t.recognitionTitle}</h3>
      <p>{t.recognitionBody}</p>
      {available ? (
        <>
          <fieldset disabled={busy}>
            <legend>{t.documentTab}</legend>
            {pages.map((page) => (
              <label className="consent" key={page.page}>
                <input
                  type="checkbox"
                  checked={selected.includes(page.page)}
                  onChange={(event) =>
                    setSelected((previous) =>
                      event.target.checked
                        ? [...previous, page.page].sort((a, b) => a - b)
                        : previous.filter((value) => value !== page.page),
                    )
                  }
                />
                {t.documentTab} {page.page}
              </label>
            ))}
          </fieldset>
          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            {t.consent}
          </label>
          <button
            disabled={busy || !consent || selected.length === 0}
            onClick={() => {
              recognize(selected);
              setConsent(false);
            }}
          >
            {t.recognize}
          </button>
        </>
      ) : (
        <p>{t.recognitionUnavailable}</p>
      )}
    </aside>
  );
}
