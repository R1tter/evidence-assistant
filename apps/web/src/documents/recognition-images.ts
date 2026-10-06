import type { PagePreview } from './types.js';
import type { RecognitionPage } from './session-client.js';
import { InputError, INPUT_LIMITS } from './input.js';
function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result.split(',')[1] ?? '')
        : reject(new InputError('INVALID_FILE'));
    reader.onerror = () => reject(new InputError('INVALID_FILE'));
    reader.readAsDataURL(blob);
  });
}
export async function recognitionImages(
  previews: PagePreview[],
  selected: number[],
  signal: AbortSignal,
): Promise<RecognitionPage[]> {
  const output: RecognitionPage[] = [];
  let bytes = 0;
  for (const page of previews.filter((item) => selected.includes(item.page))) {
    signal.throwIfAborted();
    const response = await fetch(page.url, { signal });
    const blob = await response.blob();
    bytes += blob.size;
    if (bytes > INPUT_LIMITS.bytes) throw new InputError('FILE_TOO_LARGE');
    if (blob.type !== 'image/png' && blob.type !== 'image/jpeg')
      throw new InputError('INVALID_FILE');
    const data = await base64(blob);
    signal.throwIfAborted();
    output.push({ page: page.page, mime: blob.type, data });
  }
  return output;
}
