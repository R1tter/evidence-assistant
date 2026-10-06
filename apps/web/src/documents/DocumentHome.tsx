import { documentExamples } from './examples.js';
import type { ExampleKind, ExampleLocale } from './examples.js';
import type { DocumentMessages } from './messages.js';
export function DocumentHome({
  locale,
  t,
  example,
  upload,
}: {
  locale: ExampleLocale;
  t: DocumentMessages;
  example(this: void, kind: ExampleKind): void;
  upload(this: void): void;
}) {
  const examples = documentExamples(locale);
  return (
    <div id="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroBody}</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => example('scan')}>
              {t.tryExample}
            </button>
            <button onClick={upload}>{t.useDocument}</button>
          </div>
          <p className="hero-meta">{t.heroMeta}</p>
        </div>
        <div className="hero-art" role="img" aria-label={t.heroArt}>
          <div className="art-label">{t.artLabel}</div>
          <img
            className="paper-art"
            src={examples[1]!.thumbnail}
            width="600"
            height="800"
            alt=""
          />
          <svg className="art-connector" viewBox="0 0 90 80" aria-hidden="true">
            <path
              d="M8 15c55-35 62 30 62 43m-9-10 9 11 9-11"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
          </svg>
          <div className="floating-answer">
            <span className="pill tag-teal">{t.demoLabel}</span>
            <p>
              {examples[1]!.text
                .split('\n')[1]
                ?.split('. ')
                .slice(0, 2)
                .join('. ')}
            </p>
            <div className="answer-reference">{t.heroReference}</div>
          </div>
        </div>
      </section>
      <section className="examples" aria-labelledby="examples-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">{t.examplesEyebrow}</p>
            <h2 id="examples-title">{t.examplesTitle}</h2>
          </div>
          <p>{t.examplesBody}</p>
        </div>
        <div className="example-grid">
          {examples.map((item, index) => (
            <article className="example-card" key={item.id}>
              <div className={`thumbnail ${['', 'teal', 'coral'][index]}`}>
                <img
                  src={item.thumbnail}
                  width="600"
                  height="800"
                  loading="lazy"
                  alt=""
                />
              </div>
              <div className="card-content">
                <span className="eyebrow">{t.exampleMeta}</span>
                <h3>{item.title}</h3>
                <p>{[t.manualBody, t.scanBody, t.noteBody][index]}</p>
                <button onClick={() => example(item.kind)}>
                  {item.questions[0]}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="how-section" aria-labelledby="how-title">
        <h2 id="how-title">{t.how}</h2>
        <div className="how">
          {[
            [t.step1, t.step1Body],
            [t.step2, t.step2Body],
            [t.step3, t.step3Body],
          ].map(([title, body], index) => (
            <article key={title}>
              <span className="number">{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
