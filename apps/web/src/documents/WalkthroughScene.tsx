import type { DocumentMessages } from './messages.js';
import type { DocumentExample } from './examples.js';
export function WalkthroughScene({
  t,
  example,
}: {
  t: DocumentMessages;
  example: DocumentExample;
}) {
  const answer = `${example.text.split('\n')[1]?.split('. ')[0] ?? ''}.`;
  const start = example.text.indexOf(answer);
  return (
    <>
      <div className="demo-camera" data-camera aria-hidden="true">
        <div className="demo-window-bar">
          <img src="/brand/brand-highlight.svg" width="24" height="24" alt="" />
          <strong>Evidence Assistant</strong>
          <span className="pill tag-teal">{t.demoLabel}</span>
        </div>
        <div className="demo-workspace">
          <div className="demo-document-panel">
            <div className="demo-tabs">
              <span>{t.originalTab}</span>
              <span data-transcript-tab>{t.transcriptTab}</span>
            </div>
            <div className="demo-page-stack">
              <img
                data-original
                src={example.thumbnail}
                width="600"
                height="800"
                alt=""
              />
              <div className="demo-transcript transcript-sheet" data-transcript>
                <strong>{t.transcriptTab} · 1</strong>
                <p>
                  {example.text.slice(0, start)}
                  <span data-highlight>{answer}</span>
                  {example.text.slice(start + answer.length)}
                </p>
              </div>
            </div>
          </div>
          <div className="demo-question-panel">
            <strong>{t.questionsTab}</strong>
            <div className="demo-composer" data-question>
              <span data-typed data-testid="demo-typed-question" />
              <span className="demo-caret" />
            </div>
            <span className="demo-ask" data-ask>
              {t.ask}
            </span>
            <div className="demo-result" data-result data-testid="demo-answer">
              <span className="pill tag-teal">{t.answerExtracted}</span>
              <p>{answer}</p>
              <span className="answer-reference" data-reference>
                {t.heroReference}
              </span>
            </div>
          </div>
        </div>
        <svg className="demo-connector" data-connector>
          <path
            data-line
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 6"
          />
        </svg>
      </div>
      <svg
        className="demo-cursor"
        data-cursor
        aria-hidden="true"
        viewBox="0 0 24 28"
      >
        <path
          d="M2 2v22l6-6 5 8 4-2-5-8h9Z"
          fill="var(--action)"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <div className="demo-progress" aria-hidden="true">
        <div data-progress />
      </div>
      <p className="demo-readable">
        {example.title}. {example.questions[0]} {answer} {t.heroReference}
      </p>
    </>
  );
}
