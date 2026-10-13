import { useRef, useState } from 'react';
import { ExpandedDocument } from './ExpandedDocument.js';
import type { DocumentMessages } from './messages.js';
import type { PagePreview } from './types.js';
export function OriginalDocument({
  t,
  preview,
  showImage,
}: {
  t: DocumentMessages;
  preview: PagePreview;
  showImage: boolean;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="original-page">
      <button
        ref={button}
        className="enlarge-document"
        onClick={() => setExpanded(true)}
      >
        {t.enlarge}
      </button>
      {showImage && (
        <img
          src={preview.url}
          width={preview.width}
          height={preview.height}
          alt={`${t.documentTab} ${preview.page}`}
        />
      )}
      {expanded && (
        <ExpandedDocument
          key={preview.page}
          t={t}
          preview={preview}
          close={() => {
            setExpanded(false);
            button.current?.focus();
          }}
        />
      )}
    </div>
  );
}
