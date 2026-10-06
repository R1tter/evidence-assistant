import { inspectInput, INPUT_LIMITS, InputError } from './input.js';
import type { InputFile } from './input.js';
import type { ReadDocument } from './types.js';
import { readPdf } from './pdf.js';

async function readImage(
  input: Exclude<Awaited<ReturnType<typeof inspectInput>>, { kind: 'pdf' }>,
  signal: AbortSignal,
  makeUrl: (blob: Blob) => string,
) {
  const blob = new Blob([input.bytes], {
    type: input.kind === 'png' ? 'image/png' : 'image/jpeg',
  });
  const bitmap = await createImageBitmap(blob).catch(() => {
    throw new InputError('INVALID_FILE');
  });
  try {
    signal.throwIfAborted();
    const same = bitmap.width === input.width && bitmap.height === input.height;
    const rotatedJpeg =
      input.kind === 'jpeg' &&
      bitmap.width === input.height &&
      bitmap.height === input.width;
    if (!same && !rotatedJpeg) throw new InputError('INVALID_FILE');
    return {
      pages: [
        { page: 1, text: '', origin: 'embedded' as const, uncertainties: [] },
      ],
      previews: [
        {
          page: 1,
          url: makeUrl(blob),
          width: bitmap.width,
          height: bitmap.height,
        },
      ],
    };
  } finally {
    bitmap.close();
  }
}
export async function readDocument(
  file: InputFile,
  signal: AbortSignal,
): Promise<ReadDocument> {
  signal.throwIfAborted();
  const controller = new AbortController();
  const urls = new Set<string>();
  const dispose = () => {
    for (const url of urls) URL.revokeObjectURL(url);
    urls.clear();
  };
  const makeUrl = (blob: Blob) => {
    controller.signal.throwIfAborted();
    const url = URL.createObjectURL(blob);
    urls.add(url);
    return url;
  };
  const cancel = () => controller.abort(signal.reason);
  signal.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(
    () => controller.abort(new InputError('READ_TIMEOUT')),
    INPUT_LIMITS.milliseconds,
  );
  let rejectAbort: (reason: unknown) => void = () => undefined;
  const aborted = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });
  const onAbort = () => {
    dispose();
    rejectAbort(controller.signal.reason);
  };
  controller.signal.addEventListener('abort', onAbort, { once: true });
  const operation = async () => {
    const input = await inspectInput(file);
    controller.signal.throwIfAborted();
    return input.kind === 'pdf'
      ? readPdf(input.bytes, controller.signal, makeUrl)
      : readImage(input, controller.signal, makeUrl);
  };
  try {
    const result = await Promise.race([operation(), aborted]);
    return {
      ...result,
      requiresRecognition: result.pages.some((page) => !page.text.trim()),
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
    controller.signal.removeEventListener('abort', onAbort);
  }
}
