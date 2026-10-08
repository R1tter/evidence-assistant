import './walkthrough.css';
import { useWalkthroughMotion } from './useWalkthroughMotion.js';
import { WalkthroughScene } from './WalkthroughScene.js';
import type { DocumentMessages } from './messages.js';
import type { DocumentExample } from './examples.js';
function playbackLabel(
  t: DocumentMessages,
  started: boolean,
  playing: boolean,
  complete: boolean,
) {
  if (playing) return t.pauseDemo;
  if (!started) return t.playDemo;
  return complete ? t.replayDemo : t.resumeDemo;
}
export function DocumentWalkthrough({
  t,
  example,
}: {
  t: DocumentMessages;
  example: DocumentExample;
}) {
  const { scene, step, playing, started, complete, selectStep, toggle } =
    useWalkthroughMotion(example.questions[0]!);
  const steps = [
    [t.step1, t.step1Body],
    [t.step2, t.step2Body],
    [t.step3, t.step3Body],
  ];
  return (
    <>
      <div className="how">
        {steps.map(([title, body], index) => (
          <article key={title}>
            <button
              className="walkthrough-step"
              aria-pressed={step === index}
              onClick={() => selectStep(index)}
            >
              <span className="number" aria-hidden="true">
                {index + 1}
              </span>
              <span>{title}</span>
            </button>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <div className="walkthrough">
        <div className="walkthrough-heading">
          <p>{t.walkthrough}</p>
          <button onClick={toggle}>
            {playbackLabel(t, started, playing, complete)}
          </button>
        </div>
        <div
          ref={scene}
          className="demo-film"
          data-testid="walkthrough-preview"
        >
          <WalkthroughScene t={t} example={example} />
        </div>
      </div>
    </>
  );
}
