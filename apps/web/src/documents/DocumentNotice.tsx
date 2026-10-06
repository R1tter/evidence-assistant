import { useEffect, useRef } from 'react';
import type { DocumentController } from './useDocumentSession.js';
import type { DocumentMessages } from './messages.js';
import type { ExampleLocale } from './examples.js';
import { errorCopy } from './error-copy.js';
export function DocumentNotice({
  controller,
  t,
  locale,
  upload,
}: {
  controller: DocumentController;
  t: DocumentMessages;
  locale: ExampleLocale;
  upload(this: void): void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (controller.error) ref.current?.focus();
  }, [controller.error]);
  const expired = controller.error === 'SESSION_EXPIRED';
  const titles = {
    syncing: t.syncingTitle,
    reading: t.readingTitle,
    recognizing: t.ocrTitle,
    asking: t.ask,
    saving: t.saveText,
    home: '',
    upload: '',
    ready: '',
  };
  const bodies = {
    syncing: t.syncingBody,
    reading: t.readingBody,
    recognizing: t.ocrBody,
    asking: t.modeHelp,
    saving: t.revisionHelp,
    home: '',
    upload: '',
    ready: '',
  };
  return (
    <>
      {controller.error && (
        <div
          ref={ref}
          role="alert"
          tabIndex={-1}
          className="notice status-box warning"
        >
          <h2>{expired ? t.expiredTitle : t.errorTitle}</h2>
          <p>{expired ? t.expiredBody : errorCopy(locale, controller.error)}</p>
          <button onClick={upload}>{t.reopen}</button>
          {controller.loaded && !expired && (
            <button onClick={controller.refresh}>{t.retrySync}</button>
          )}
          {!expired && controller.error !== 'SESSION_UNCERTAIN' && (
            <button onClick={controller.clearError}>{t.cancel}</button>
          )}
        </div>
      )}
      {titles[controller.status] && (
        <div className="notice status-box" role="status">
          <h2>{titles[controller.status]}</h2>
          <p>{bodies[controller.status]}</p>
          {['reading', 'recognizing', 'asking'].includes(controller.status) && (
            <button onClick={controller.cancel}>{t.cancel}</button>
          )}
        </div>
      )}
    </>
  );
}
