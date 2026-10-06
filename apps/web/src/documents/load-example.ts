import { documentExamples } from './examples.js';
import type { ExampleKind, ExampleLocale } from './examples.js';
import { readDocument } from './read.js';
import { InputError } from './input.js';
export async function loadExample(
  locale: ExampleLocale,
  kind: ExampleKind,
  signal: AbortSignal,
) {
  const example = documentExamples(locale).find((item) => item.kind === kind);
  if (!example) throw new InputError('INVALID_FILE');
  const response = await fetch(example.file, { signal, credentials: 'omit' });
  if (!response.ok) throw new InputError('INVALID_FILE');
  const blob = await response.blob();
  const file = new File(
    [blob],
    `${kind}.${kind === 'manual' ? 'pdf' : 'png'}`,
    { type: kind === 'manual' ? 'application/pdf' : 'image/png' },
  );
  const document = await readDocument(file, signal);
  if (kind !== 'manual') {
    document.pages = [
      { page: 1, text: example.text, origin: 'reviewed', uncertainties: [] },
    ];
    document.requiresRecognition = false;
  }
  return { example, document };
}
