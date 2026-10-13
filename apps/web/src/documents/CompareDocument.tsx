import { synchronizeScroll } from './scroll-link.js';
import { useRef, useState } from 'react';
import type { ReactNode, UIEvent } from 'react';
import type { DocumentMessages } from './messages.js';
import type { PagePreview } from './types.js';
export function CompareDocument({
  t,
  preview,
  children,
  pane,
  setPane,
}: {
  t: DocumentMessages;
  preview: PagePreview;
  children: ReactNode;
  pane: string;
  setPane(this: void, pane: string): void;
}) {
  const [linked, setLinked] = useState(false);
  const original = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const pending = useRef(new WeakMap<HTMLElement, number>());
  const scroll = (
    event: UIEvent<HTMLDivElement>,
    target: HTMLDivElement | null,
  ) => {
    if (linked) synchronizeScroll(event.currentTarget, target, pending.current);
  };
  return (
    <div className="comparison">
      <label className="comparison-link">
        <input
          type="checkbox"
          checked={linked}
          onChange={(event) => {
            pending.current = new WeakMap();
            setLinked(event.target.checked);
          }}
        />
        {t.linkScroll}
      </label>
      <p className="help">{t.linkScrollHelp}</p>
      <div className="comparison-switch" aria-label={t.view}>
        <button
          aria-pressed={pane === 'original'}
          onClick={() => setPane('original')}
        >
          {t.originalTab}
        </button>
        <button aria-pressed={pane === 'text'} onClick={() => setPane('text')}>
          {t.transcriptTab}
        </button>
      </div>
      <div className="comparison-panes" data-pane={pane}>
        {/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Named reading regions need keyboard focus for native arrow-key scrolling. */}
        <div
          className="comparison-scroll comparison-original"
          ref={original}
          role="region"
          tabIndex={0}
          aria-label={t.originalTab}
          onScroll={(event) => scroll(event, text.current)}
        >
          <img
            src={preview.url}
            width={preview.width}
            height={preview.height}
            alt={`${t.documentTab} ${preview.page}`}
          />
        </div>
        <div
          className="comparison-scroll comparison-text"
          ref={text}
          role="region"
          tabIndex={0}
          aria-label={t.transcriptTab}
          onScroll={(event) => scroll(event, original.current)}
        >
          {children}
        </div>
        {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
      </div>
    </div>
  );
}
