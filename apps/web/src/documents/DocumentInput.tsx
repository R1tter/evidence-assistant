import { useRef, useState } from 'react';
import type { DocumentMessages } from './messages.js';
export function DocumentInput({
  t,
  busy,
  read,
  home,
}: {
  t: DocumentMessages;
  busy: boolean;
  read(this: void, file: File): void;
  home(this: void): void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const select = (files: FileList | null) => {
    if (files?.length === 1) setFile(files[0]);
  };
  return (
    <section className="upload-view view-heading">
      <button onClick={home} disabled={busy}>
        {t.back}
      </button>
      <h1>{t.uploadTitle}</h1>
      <p>{t.uploadBody}</p>
      <div className="upload-grid">
        <div className="panel">
          <div
            className="drop-area"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              select(event.dataTransfer.files);
            }}
          >
            <h2>{t.dropTitle}</h2>
            <p id="file-limits">{t.fileLimits}</p>
            <input
              ref={input}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              aria-label={t.selectFile}
              aria-describedby="file-limits"
              hidden
              onChange={(event) => select(event.target.files)}
            />
            <button disabled={busy} onClick={() => input.current?.click()}>
              {t.selectFile}
            </button>
          </div>
          {file && <p className="file-card">{file.name}</p>}
          <div className="upload-actions">
            <button
              className="primary"
              disabled={!file || busy}
              onClick={() => {
                if (file) read(file);
              }}
            >
              {t.readFile}
            </button>
            <button onClick={home} disabled={busy}>
              {t.cancel}
            </button>
          </div>
        </div>
        <aside className="panel">
          <p className="eyebrow">{t.beforeUpload}</p>
          <h2>{t.privacyTitle}</h2>
          <p>{t.privacyBody}</p>
          <p>{t.recognitionBody}</p>
          <p>{t.recognitionUnavailable}</p>
        </aside>
      </div>
    </section>
  );
}
