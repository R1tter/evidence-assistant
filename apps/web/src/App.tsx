import { QuestionComposer } from './QuestionComposer.js';
import { useEffect, useState } from 'react';
import { httpClient, type AssistantClient } from './api.js';
import { messages, type Locale } from './locales.js';
import { useAssistant } from './useAssistant.js';
import { AnswerPanel, EvidenceCard } from './components.js';
export function App({ client = httpClient }: { client?: AssistantClient }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<'demo' | 'llm'>('demo');
  const { state, available, submit, cancel } = useAssistant(client);
  const t = messages[locale];
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const send = () => {
    if (question.trim()) void submit(question, mode);
  };
  return (
    <>
      <a className="skip" href="#question">
        {t.skip}
      </a>
      <header>
        <strong>Evidence Assistant</strong>
        <span>{t.purpose}</span>
        <label>
          {t.language}
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            <option value="en">English</option>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="es">Español</option>
          </select>
        </label>
      </header>
      <main>
        <section className="intro">
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </section>
        <QuestionComposer
          question={question}
          setQuestion={setQuestion}
          mode={mode}
          setMode={setMode}
          available={available}
          state={state}
          t={t}
          send={send}
          cancel={cancel}
        />
        <div className="workspace">
          <AnswerPanel state={state} t={t} retry={send} />
          <aside className="panel">
            <h2>{t.sources}</h2>
            {state.status === 'success' &&
              state.answer.evidence.map((evidence, index) => (
                <EvidenceCard
                  key={evidence.chunk.id}
                  evidence={evidence}
                  index={index}
                  client={client}
                  t={t}
                />
              ))}
          </aside>
        </div>
      </main>
      <footer>{t.footer}</footer>
    </>
  );
}
