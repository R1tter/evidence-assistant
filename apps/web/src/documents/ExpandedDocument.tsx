import { useEffect, useRef, useState } from 'react';
import type { DocumentMessages } from './messages.js';
import type { PagePreview } from './types.js';

export function ExpandedDocument({
  t,
  preview,
  close,
}: {
  t: DocumentMessages;
  preview: PagePreview;
  close(this: void): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const [fitWidth, setFitWidth] = useState(0);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    closeButton.current?.focus();
    return () => element.close();
  }, []);
  useEffect(() => {
    const area = scrollArea.current!;
    const fit = () =>
      setFitWidth(
        Math.max(
          1,
          Math.min(
            area.clientWidth - 32,
            ((area.clientHeight - 32) * preview.width) / preview.height,
          ),
        ),
      );
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    fit();
    return () => observer.disconnect();
  }, [preview.width, preview.height]);
  const dismiss = () => {
    dialog.current?.close();
    close();
  };
  return (
    <dialog
      ref={dialog}
      className="expanded-document"
      aria-labelledby="expanded-title"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <div className="expanded-toolbar">
        <h2 id="expanded-title">
          {t.documentTab} · {preview.page}
        </h2>
        <div className="actions">
          <button
            aria-label={t.zoomOut}
            disabled={zoom <= 1}
            onClick={() => setZoom(Math.max(1, zoom - 0.5))}
          >
            −
          </button>
          <output aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button
            aria-label={t.zoomIn}
            disabled={zoom >= 3}
            onClick={() => setZoom(Math.min(3, zoom + 0.5))}
          >
            +
          </button>
          <button onClick={() => setZoom(1)}>{t.fitPage}</button>
          <button ref={closeButton} onClick={dismiss}>
            {t.closeViewer}
          </button>
        </div>
      </div>
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- A named overflow region needs keyboard focus so arrow keys can scroll the zoomed page. */}
      <div
        ref={scrollArea}
        className="expanded-scroll"
        role="region"
        tabIndex={0}
        aria-label={`${t.documentTab} ${preview.page}`}
      >
        <div
          className="expanded-image"
          style={{ width: fitWidth ? `${fitWidth * zoom}px` : '100%' }}
        >
          <img
            src={preview.url}
            width={preview.width}
            height={preview.height}
            alt={`${t.documentTab} ${preview.page}`}
          />
        </div>
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
    </dialog>
  );
}
