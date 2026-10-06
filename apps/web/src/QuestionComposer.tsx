import type { Messages } from './locales.js';
import type { RequestState } from './useAssistant.js';
import { ModeSelector } from './components.js';
const questions = [
  'How are evidence citations checked?',
  'What should CI quality gates check?',
  'How should a regression strategy select tests?',
];
export function QuestionComposer({
  question,
  setQuestion,
  mode,
  setMode,
  available,
  state,
  t,
  send,
  cancel,
}: {
  question: string;
  setQuestion: (value: string) => void;
  mode: 'demo' | 'llm';
  setMode: (value: 'demo' | 'llm') => void;
  available: boolean;
  state: RequestState;
  t: Messages;
  send: () => void;
  cancel: () => void;
}) {
  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label htmlFor="question">{t.question}</label>
      <textarea
        id="question"
        value={question}
        maxLength={1000}
        aria-describedby="question-help"
        onChange={(event) => setQuestion(event.target.value)}
      />
      <p className="helper" id="question-help">
        {t.help}
      </p>
      <div className="suggestions">
        {questions.map((value, index) => (
          <button
            type="button"
            key={value}
            onClick={() => {
              setQuestion(value);
              document.getElementById('question')?.focus();
            }}
          >
            {t.examples[index]}
          </button>
        ))}
      </div>
      <ModeSelector
        mode={mode}
        available={available}
        onChange={setMode}
        t={t}
      />
      <div className="actions">
        <button
          className="primary"
          disabled={state.status === 'loading' || !question.trim()}
        >
          {t.ask}
        </button>
        {state.status === 'loading' && (
          <button type="button" onClick={cancel}>
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
