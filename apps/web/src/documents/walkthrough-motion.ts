import { gsap } from 'gsap';

function cursorPosition(scene: HTMLElement, selector: string) {
  const source = scene.getBoundingClientRect();
  const target = scene.querySelector(selector)!.getBoundingClientRect();
  return {
    x: target.left - source.left + target.width * 0.65,
    y: target.top - source.top + target.height * 0.6,
  };
}

function connectorPath(scene: HTMLElement) {
  const camera = scene.querySelector('[data-camera]')!.getBoundingClientRect();
  const reference = scene
    .querySelector('[data-reference]')!
    .getBoundingClientRect();
  const panel = scene
    .querySelector('[data-transcript]')!
    .getBoundingClientRect();
  const passage = scene
    .querySelector('[data-highlight]')!
    .getBoundingClientRect();
  const startX = reference.left - camera.left - 8;
  const startY = reference.top - camera.top + reference.height / 2;
  const endX = panel.right - camera.left + 6;
  const endY = passage.top - camera.top + 8;
  const gutter = (startX + endX) / 2;
  return `M${startX} ${startY}C${gutter} ${startY} ${gutter} ${endY} ${endX} ${endY}`;
}

export function createWalkthroughTimeline(
  scene: HTMLElement,
  question: string,
  phase: (step: number) => void,
  complete: () => void,
) {
  const typed = scene.querySelector<HTMLElement>('[data-typed]')!;
  const typing = { characters: 0 };
  let lastPhase = -1;
  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: 'power2.inOut' },
    onComplete: complete,
    onUpdate: () => {
      typed.textContent = question.slice(0, Math.round(typing.characters));
      const step = timeline.time() < 3 ? 0 : timeline.time() < 6 ? 1 : 2;
      if (step !== lastPhase) {
        lastPhase = step;
        phase(step);
      }
    },
  });
  const cursor = (selector: string, at: number) => {
    timeline.to(
      '[data-cursor]',
      {
        x: () => cursorPosition(scene, selector).x,
        y: () => cursorPosition(scene, selector).y,
        duration: 0.9,
      },
      at,
    );
    timeline.to(
      '[data-cursor]',
      { scale: 0.8, duration: 0.12, repeat: 1, yoyo: true },
      at + 0.9,
    );
  };
  timeline.set(
    '[data-transcript], [data-result], [data-connector], [data-cursor]',
    { autoAlpha: 0 },
  );
  timeline.set('[data-original]', { autoAlpha: 1, x: 0, rotate: 0 });
  timeline.set('[data-highlight]', { backgroundSize: '0% 100%' });
  timeline.set('[data-progress]', { scaleX: 0, transformOrigin: 'left' });
  timeline.set(typing, {
    characters: 0,
    onUpdate: () => {
      typed.textContent = '';
    },
  });
  timeline.fromTo(
    '[data-original]',
    { y: 24, rotate: -3 },
    { y: 0, rotate: 0, duration: 1.2 },
    0,
  );
  timeline.to('[data-cursor]', { autoAlpha: 1, duration: 0.3 }, 1.5);
  cursor('[data-transcript-tab]', 1.8);
  timeline.to('[data-original]', { autoAlpha: 0, x: -16, duration: 0.65 }, 3);
  timeline.fromTo(
    '[data-transcript]',
    { autoAlpha: 0, x: 16 },
    { autoAlpha: 1, x: 0, duration: 0.65 },
    3,
  );
  timeline.fromTo(
    '[data-transcript] p',
    { y: 10, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, stagger: 0.15, duration: 0.55 },
    3.4,
  );
  cursor('[data-question]', 5.3);
  timeline.to(
    typing,
    {
      characters: question.length,
      duration: 2.4,
      ease: 'none',
      onUpdate: () => {
        typed.textContent = question.slice(0, Math.round(typing.characters));
      },
    },
    6.3,
  );
  cursor('[data-ask]', 8.8);
  timeline.to(
    '[data-ask]',
    { scale: 0.97, duration: 0.15, repeat: 1, yoyo: true },
    9.7,
  );
  timeline.fromTo(
    '[data-result]',
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: 0.8 },
    10.2,
  );
  cursor('[data-reference]', 11.5);
  timeline.set(
    '[data-line]',
    { attr: { d: () => connectorPath(scene) } },
    12.4,
  );
  timeline.to('[data-connector]', { autoAlpha: 1, duration: 0.45 }, 12.5);
  timeline.to(
    '[data-highlight]',
    { backgroundSize: '100% 100%', duration: 1.1 },
    12.8,
  );
  timeline.to('[data-camera]', { scale: 1.025, duration: 1.5 }, 12.5);
  timeline.to('[data-cursor]', { autoAlpha: 0, duration: 0.4 }, 14);
  timeline.to('[data-progress]', { scaleX: 1, duration: 18, ease: 'none' }, 0);
  return timeline;
}
