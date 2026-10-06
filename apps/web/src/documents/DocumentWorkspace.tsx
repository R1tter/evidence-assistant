import { useEffect, useRef, useState } from 'react';
import type { ExampleLocale } from './examples.js';
import type { DocumentMessages } from './messages.js';
import { DocumentViewer } from './DocumentViewer.js';
import type { DocumentView } from './DocumentViewer.js';
import { DocumentQuestions } from './DocumentQuestions.js';
import { RecognitionControls } from './RecognitionControls.js';
import type {
  DocumentController,
  LoadedDocument,
} from './useDocumentSession.js';
function pageProvenance(
  loaded: LoadedDocument,
  page: number,
  t: DocumentMessages,
) {
  if (loaded.example && loaded.document.revision === 1) return t.demoLabel;
  const origin = loaded.document.pages.find(
    (item) => item.page === page,
  )!.origin;
  return {
    embedded: t.originEmbedded,
    vision: t.originVision,
    reviewed: t.originReviewed,
  }[origin];
}
function questionsUnavailable(
  controller: DocumentController,
  loaded: LoadedDocument,
) {
  return (
    ['SESSION_EXPIRED', 'SESSION_UNCERTAIN'].includes(controller.error ?? '') ||
    loaded.document.pages.every(
      (page) => !page.text.trim() || page.text === '[illegible]',
    )
  );
}
export function DocumentWorkspace({
  controller,
  loaded,
  locale,
  t,
  upload,
}: {
  controller: DocumentController;
  loaded: LoadedDocument;
  locale: ExampleLocale;
  t: DocumentMessages;
  upload(this: void): void;
}) {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<'demo' | 'llm'>('demo');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<DocumentView>('original');
  const [mobile, setMobile] = useState<'document' | 'text' | 'questions'>(
    'questions',
  );
  const [passage, setPassage] = useState<string>();
  const [sourceFocused, setSourceFocused] = useState(false);
  const passageRef = useRef<HTMLDivElement>(null);
  const citationRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (sourceFocused) {
      passageRef.current?.focus();
      passageRef.current?.scrollIntoView?.({
        block: 'nearest',
        behavior: 'auto',
      });
    }
  }, [sourceFocused, passage, view, page]);
  const source = (id: string, quote: string, button: HTMLButtonElement) => {
    const evidence = controller.answer?.evidence.find(
      (item) => item.chunk.id === id,
    );
    const number = evidence?.chunk.provenance?.page;
    if (!number) return;
    citationRef.current = button;
    setPage(number);
    setView('text');
    setMobile('text');
    setPassage(quote);
    setSourceFocused(true);
  };
  const returnToQuestion = () => {
    setMobile('questions');
    setSourceFocused(false);
    requestAnimationFrame(() => citationRef.current?.focus());
  };
  const busy =
    !['home', 'upload', 'ready'].includes(controller.status) ||
    controller.error === 'SESSION_UNCERTAIN';
  const provenance = pageProvenance(loaded, page, t);
  return (
    <div id="workspace">
      <section className="workspace-heading">
        <p className="eyebrow">{t.workspaceEyebrow}</p>
        <div className="section-head">
          <h1>{loaded.document.title}</h1>
          <button onClick={upload}>{t.changeDocument}</button>
        </div>
        <p>
          <span className="pill tag-teal">
            {loaded.example && loaded.document.revision === 1
              ? t.demoLabel
              : `${t.transcriptTab} · ${loaded.document.revision}`}
          </span>{' '}
          · {loaded.document.pages.length} {t.documentTab.toLowerCase()} ·{' '}
          {loaded.example?.locale ?? t.originalTab}
        </p>
        <div className="mobile-switch" aria-label={t.view}>
          {(['document', 'text', 'questions'] as const).map((item, index) => (
            <button
              key={item}
              aria-pressed={mobile === item}
              onClick={() => {
                setMobile(item);
                setSourceFocused(false);
                if (item !== 'questions')
                  setView(item === 'text' ? 'text' : 'original');
              }}
            >
              {[t.documentTab, t.textTab, t.questionsTab][index]}
            </button>
          ))}
        </div>
      </section>
      <div className="workspace-grid" data-mobile={mobile}>
        <DocumentViewer
          provenance={provenance}
          t={t}
          pages={loaded.document.pages}
          previews={loaded.local.previews}
          number={page}
          view={view}
          busy={busy}
          passage={controller.answer ? passage : undefined}
          passageRef={passageRef}
          onPage={(number) => {
            setPage(number);
            setPassage(undefined);
            setSourceFocused(false);
          }}
          onView={setView}
          save={(text) => controller.edit(page, text)}
          returnToQuestion={returnToQuestion}
        />
        <div className="question-column">
          <DocumentQuestions
            t={t}
            question={question}
            mode={mode}
            available={controller.config.llmAvailable}
            busy={busy}
            disabled={questionsUnavailable(controller, loaded)}
            answer={controller.answer}
            suggestions={loaded.example?.questions ?? []}
            setQuestion={setQuestion}
            setMode={setMode}
            ask={() => {
              setSourceFocused(false);
              controller.ask(question, mode, locale);
            }}
            source={source}
          />
          <RecognitionControls
            key={loaded.document.id}
            t={t}
            pages={loaded.document.pages}
            available={
              controller.config.recognitionAvailable &&
              controller.error !== 'SESSION_EXPIRED'
            }
            busy={busy}
            recognize={controller.recognize}
          />
        </div>
      </div>
    </div>
  );
}
