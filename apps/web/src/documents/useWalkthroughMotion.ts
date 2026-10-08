import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { createWalkthroughTimeline } from './walkthrough-motion.js';

export function useWalkthroughMotion(question: string) {
  const scene = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const playhead = useRef({ time: 0, playing: false });
  const reduced = useRef(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const context = gsap.context(() => {
      timeline.current = createWalkthroughTimeline(
        scene.current!,
        question,
        setStep,
        () => {
          setComplete(true);
          setPlaying(false);
        },
      );
    }, scene);
    const preference = () => {
      reduced.current = media?.matches ?? false;
      if (reduced.current) {
        timeline.current!.pause().seek(18, false);
        setPlaying(false);
        setComplete(true);
      }
    };
    timeline.current!.seek(playhead.current.time, false);
    if (playhead.current.playing) timeline.current!.play();
    preference();
    media?.addEventListener('change', preference);
    return () => {
      media?.removeEventListener('change', preference);
      playhead.current = {
        time: timeline.current!.time(),
        playing: !timeline.current!.paused(),
      };
      context.revert();
      timeline.current = null;
    };
  }, [question]);
  const selectStep = (index: number) => {
    timeline.current?.pause().seek([0, 5, 18][index]!, false);
    setStep(index);
    setPlaying(false);
    setStarted(true);
    setComplete(index === 2);
  };
  const toggle = () => {
    setStarted(true);
    if (reduced.current) {
      selectStep(2);
      return;
    }
    if (playing) {
      timeline.current?.pause();
      setPlaying(false);
      return;
    }
    if (complete) {
      timeline.current?.restart(false, false);
      setStep(0);
      setComplete(false);
    } else timeline.current?.play();
    setPlaying(true);
  };
  return { scene, step, playing, started, complete, selectStep, toggle };
}
