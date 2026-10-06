import type { DocumentMessages } from './messages.js';
import type { SessionAnswer } from './session-client.js';
export function DocumentQuestions({
  t,
  question,
  mode,
  available,
  busy,
  disabled,
  answer,
  suggestions,
  setQuestion,
  setMode,
  ask,
  source,
}: {
  t: DocumentMessages;
  question: string;
  mode: 'demo' | 'llm';
  available: boolean;
  busy: boolean;
  disabled: boolean;
  answer: SessionAnswer | undefined;
  suggestions: string[];
  setQuestion(this: void, value: string): void;
  setMode(this: void, value: 'demo' | 'llm'): void;
  ask(this: void): void;
  source(
    this: void,
    id: string,
    quote: string,
    button: HTMLButtonElement,
  ): void;
}) {
  return (
    <section
      className="panel question-panel"
      aria-labelledby="question-heading"
    >
      <h2 id="question-heading">{t.questionTitle}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
      >
        <label htmlFor="document-question">{t.yourQuestion}</label>
        <textarea
          id="document-question"
          value={question}
          maxLength={1000}
          aria-describedby="question-help"
          onChange={(event) => setQuestion(event.target.value)}
        />
        <p id="question-help" className="help">
          {t.questionHelp}
        </p>
        <div className="suggested">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => setQuestion(item)}>
              {item}
            </button>
          ))}
        </div>
        <label htmlFor="document-mode">{t.answerMode}</label>
        <select
          id="document-mode"
          value={mode}
          onChange={(event) =>
            setMode(event.target.value === 'llm' ? 'llm' : 'demo')
          }
        >
          <option value="demo">{t.modeDemo}</option>
          <option value="llm" disabled={!available}>
            {t.modeAi}
          </option>
        </select>
        <p className="help">{t.modeHelp}</p>
        <button
          className="primary"
          disabled={busy || disabled || !question.trim()}
        >
          {t.ask}
        </button>
      </form>
      {answer && (
        <div
          className="answer-card result"
          data-testid="document-answer"
          aria-live="polite"
        >
          <span className="pill tag-teal">
            {answer.mode === 'demo' ? t.answerExtracted : t.modeAi}
          </span>
          <h3>{answer.abstained ? t.noEvidenceTitle : t.answerTitle}</h3>
          <p>{answer.abstained ? t.noEvidenceBody : answer.answer}</p>
          {answer.citations.map((citation) => {
            const page = answer.evidence.find(
              (item) => item.chunk.id === citation.chunkId,
            )?.chunk.provenance?.page;
            return (
              <button
                className="source-link"
                key={citation.chunkId}
                onClick={(event) =>
                  source(citation.chunkId, citation.quote, event.currentTarget)
                }
              >
                {t.citation.replace('1', String(page ?? '?'))}
              </button>
            );
          })}
          <details className="checks">
            <summary>{t.checksTitle}</summary>
            <p>{t.checksBody}</p>
          </details>
        </div>
      )}
    </section>
  );
}
