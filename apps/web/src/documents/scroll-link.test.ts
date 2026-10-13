// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { synchronizeScroll } from './scroll-link.js';
function region(range: number, position: number) {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientHeight: { value: 100 },
    scrollHeight: { value: range + 100 },
  });
  element.scrollTop = position;
  return element;
}
it('does not let a queued programmatic event overwrite a newer user position', () => {
  const original = region(100, 0);
  const text = region(1000, 500);
  const pending = new WeakMap<HTMLElement, number>();
  synchronizeScroll(text, original, pending);
  original.scrollTop = 52;
  synchronizeScroll(original, text, pending);
  expect(text.scrollTop).toBe(520);
  original.scrollTop = 100;
  synchronizeScroll(text, original, pending);
  expect(original.scrollTop).toBe(100);
  synchronizeScroll(original, text, pending);
  expect(text.scrollTop).toBe(1000);
});
it('ignores non-scrollable sources and synchronizes either direction', () => {
  const original = region(100, 25);
  const text = region(1000, 0);
  const pending = new WeakMap<HTMLElement, number>();
  synchronizeScroll(original, text, pending);
  expect(text.scrollTop).toBe(250);
  text.scrollTop = 750;
  synchronizeScroll(text, original, pending);
  expect(original.scrollTop).toBe(75);
  synchronizeScroll(region(0, 0), original, pending);
  expect(original.scrollTop).toBe(75);
});
