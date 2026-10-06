import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./pdf.js', () => ({ readPdf: vi.fn() }));
import { readDocument } from './read.js';
afterEach(() => vi.useRealTimers());
it('bounds an unresolved file read to fifteen seconds', async () => {
  vi.useFakeTimers();
  const pending = readDocument(
    {
      size: 5,
      type: '',
      arrayBuffer: () => new Promise<ArrayBuffer>(() => undefined),
    },
    new AbortController().signal,
  );
  const assertion = expect(pending).rejects.toHaveProperty(
    'code',
    'READ_TIMEOUT',
  );
  await vi.advanceTimersByTimeAsync(15000);
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});
it('rejects pre-aborted reading without touching the file', async () => {
  const controller = new AbortController();
  controller.abort();
  const arrayBuffer = vi.fn<() => Promise<ArrayBuffer>>();
  await expect(
    readDocument({ size: 5, type: '', arrayBuffer }, controller.signal),
  ).rejects.toHaveProperty('name', 'AbortError');
  expect(arrayBuffer).not.toHaveBeenCalled();
});
