import { afterEach, expect, it, vi } from 'vitest';
import { createProviderQueue } from './provider-queue.js';

afterEach(() => vi.useRealTimers());

it('rejects non-Error failures instead of turning them into successful results', async () => {
  const queue = createProviderQueue();
  await expect(
    queue.run(
      () =>
        new Promise((_resolve, reject) => {
          // Deliberately exercise a malformed external rejection, not an Error.
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject();
        }),
    ),
  ).rejects.toMatchObject({ code: 'PROVIDER_INVALID' });
});

it('runs two calls, queues eight and rejects the eleventh', async () => {
  const queue = createProviderQueue();
  const releases: (() => void)[] = [];
  let active = 0;
  let peak = 0;
  const task = async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise<void>((resolve) => releases.push(resolve));
    active--;
    return 'done';
  };
  const requests = Array.from({ length: 10 }, () => queue.run(task));
  expect(active).toBe(2);
  await expect(queue.run(task)).rejects.toMatchObject({
    code: 'PROVIDER_BUSY',
  });
  for (let i = 0; i < 10; i++) {
    releases[i]?.();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }
  expect(await Promise.all(requests)).toEqual(Array<string>(10).fill('done'));
  expect(peak).toBe(2);
});

it('counts queue waiting toward the deadline and aborts running work', async () => {
  vi.useFakeTimers();
  const queue = createProviderQueue(100);
  const signals: AbortSignal[] = [];
  const task = async (signal: AbortSignal) => {
    signals.push(signal);
    return new Promise<string>(() => {});
  };
  const outcomes = [queue.run(task), queue.run(task), queue.run(task)].map(
    (request) => request.catch((error: unknown) => error),
  );
  await vi.advanceTimersByTimeAsync(100);
  expect(signals.every((signal) => signal.aborted)).toBe(true);
  expect(await Promise.all(outcomes)).toMatchObject(
    Array.from({ length: 3 }, () => ({ code: 'PROVIDER_TIMEOUT' })),
  );
  expect(await queue.run(() => Promise.resolve('released'))).toBe('released');
});

it('removes cancelled queued work and releases running capacity', async () => {
  const queue = createProviderQueue();
  const running = new AbortController();
  const queued = new AbortController();
  const blocker = async () => new Promise<string>(() => {});
  const first = queue
    .run(blocker, running.signal)
    .catch((error: unknown) => error);
  const secondController = new AbortController();
  const second = queue
    .run(blocker, secondController.signal)
    .catch((error: unknown) => error);
  const waiting = queue
    .run(() => Promise.resolve('must not run'), queued.signal)
    .catch((error: unknown) => error);
  queued.abort();
  running.abort();
  expect(await waiting).toMatchObject({ code: 'REQUEST_CANCELLED' });
  expect(await first).toMatchObject({ code: 'REQUEST_CANCELLED' });
  expect(await queue.run(() => Promise.resolve('released'))).toBe('released');
  secondController.abort();
  await second;
});
