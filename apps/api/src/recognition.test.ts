import { expect, it } from 'vitest';
import {
  validateRecognitionInput,
  validateRecognitionOutput,
} from './recognition.js';
import { readFileSync } from 'node:fs';
const png = readFileSync(
  new URL('../../../examples/en/note.png', import.meta.url),
).toString('base64');
const input = {
  revision: 1,
  consent: true,
  pages: [{ page: 1, mime: 'image/png', data: png }],
};
it('validates selected images, bytes and explicit consent', () => {
  expect(validateRecognitionInput(input).pages[0]).toMatchObject({
    page: 1,
    mime: 'image/png',
    width: 600,
    height: 800,
  });
  for (const invalid of [
    { ...input, consent: false },
    { ...input, pages: [{ page: 1, mime: 'image/jpeg', data: png }] },
    { ...input, pages: [input.pages[0], input.pages[0]] },
    { ...input, pages: [{ page: 1, mime: 'image/png', data: 'not-base64' }] },
  ]) {
    expect(() => validateRecognitionInput(invalid)).toThrow();
  }
  const oversized = Buffer.from(png, 'base64');
  oversized.writeUInt32BE(50000, 16);
  expect(() =>
    validateRecognitionInput({
      ...input,
      pages: [
        { page: 1, mime: 'image/png', data: oversized.toString('base64') },
      ],
    }),
  ).toThrow();
});
it('accepts bounded recognized and illegible pages, rejects invention of page IDs and oversized output', () => {
  const result = validateRecognitionOutput(
    {
      pages: [
        {
          page: 1,
          text: '[illegible]',
          uncertainties: ['Unable to read the name.'],
        },
      ],
    },
    [1],
  );
  expect(result[0]).toMatchObject({ page: 1, origin: 'vision' });
  for (const output of [
    { pages: [] },
    { pages: [{ page: 2, text: 'foreign page', uncertainties: [] }] },
    { pages: [{ page: 1, text: 'x'.repeat(40001), uncertainties: [] }] },
    {
      pages: [{ page: 1, text: 'invented', uncertainties: [], confidence: 99 }],
    },
  ]) {
    expect(() => validateRecognitionOutput(output, [1])).toThrow();
  }
});
