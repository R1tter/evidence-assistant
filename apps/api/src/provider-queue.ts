import { PublicError } from './errors.js';

interface Job {
  start(): void;
}
export interface ProviderQueue {
  run<T>(
    task: (signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T>;
}

export function createProviderQueue(deadlineMs = 20000): ProviderQueue {
  let active = 0;
  const waiting: Job[] = [];
  const drain = () => {
    while (active < 2 && waiting.length > 0) waiting.shift()?.start();
  };
  return {
    run<T>(
      task: (signal: AbortSignal) => Promise<T>,
      signal?: AbortSignal,
    ): Promise<T> {
      if (signal?.aborted)
        return Promise.reject(new PublicError('REQUEST_CANCELLED'));
      if (active >= 2 && waiting.length >= 8)
        return Promise.reject(new PublicError('PROVIDER_BUSY'));
      const expires = Date.now() + deadlineMs;
      return new Promise<T>((resolve, reject) => {
        const controller = new AbortController();
        let settled = false;
        let started = false;
        const finish = (error: Error | undefined, value?: T) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', cancel);
          const index = waiting.indexOf(job);
          if (index >= 0) waiting.splice(index, 1);
          if (started) active--;
          if (error !== undefined) reject(error);
          else resolve(value as T);
          drain();
        };
        const abort = (code: 'REQUEST_CANCELLED' | 'PROVIDER_TIMEOUT') => {
          controller.abort();
          finish(new PublicError(code));
        };
        const cancel = () => abort('REQUEST_CANCELLED');
        const timer = setTimeout(() => abort('PROVIDER_TIMEOUT'), deadlineMs);
        const job: Job = {
          start() {
            if (Date.now() >= expires) {
              abort('PROVIDER_TIMEOUT');
              return;
            }
            started = true;
            active++;
            try {
              void task(controller.signal).then(
                (value) => finish(undefined, value),
                (error: unknown) =>
                  finish(
                    error instanceof Error
                      ? error
                      : new PublicError('PROVIDER_INVALID'),
                  ),
              );
            } catch (error) {
              finish(
                error instanceof Error
                  ? error
                  : new PublicError('PROVIDER_INVALID'),
              );
            }
          },
        };
        signal?.addEventListener('abort', cancel, { once: true });
        waiting.push(job);
        drain();
      });
    },
  };
}
