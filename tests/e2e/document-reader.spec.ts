import { test, expect } from '@playwright/test';
import { pdfFixture, imagePdfFixture } from './pdf-fixture.js';
import { transcriptionErrors } from '../../scripts/evaluation-metrics.js';
test('a plausible PNG header with corrupt image data fails safely', async ({
  page,
}) => {
  await page.goto('/');
  const code = await page.evaluate(async () => {
    const modulePath = '/src/documents/read.ts';
    const { readDocument } = (await import(
      modulePath
    )) as typeof import('../../apps/web/src/documents/read.js');
    const bytes = new Uint8Array(24);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    bytes.set([73, 72, 68, 82], 12);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, 40);
    view.setUint32(20, 30);
    try {
      await readDocument(
        new File([bytes], 'corrupt.png', { type: 'image/png' }),
        new AbortController().signal,
      );
      return 'accepted';
    } catch (error) {
      return error instanceof Error && 'code' in error ? error.code : 'unknown';
    }
  });
  expect(code).toBe('INVALID_FILE');
});
test('aborting an active PDF worker terminates it', async ({ page }) => {
  await page.goto('/');
  const workerCreated = page.waitForEvent('worker');
  const result = page.evaluate(
    async (pdf) => {
      const modulePath = '/src/documents/read.ts';
      const { readDocument } = (await import(
        modulePath
      )) as typeof import('../../apps/web/src/documents/read.js');
      const controller = new AbortController();
      Object.assign(window, { cancelDocumentRead: () => controller.abort() });
      try {
        const doc = await readDocument(
          new File([pdf], 'cancel.pdf', { type: 'application/pdf' }),
          controller.signal,
        );
        doc.dispose();
        return 'accepted';
      } catch (error) {
        return error instanceof Error ? error.name : 'unknown';
      }
    },
    pdfFixture('A bounded worker fixture.', 5),
  );
  const worker = await workerCreated;
  expect(worker.url()).toContain('pdf.worker');
  const closed = new Promise<void>((resolve) =>
    worker.once('close', () => resolve()),
  );
  await page.evaluate(() => {
    const cancel: unknown = Reflect.get(window, 'cancelDocumentRead');
    if (typeof cancel === 'function') (cancel as () => void)();
  });
  expect(await result).toBe('AbortError');
  await closed;
  expect(page.workers()).toHaveLength(0);
});
test('original localized examples load with matching prepared transcriptions', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const outputs = await page.evaluate(async () => {
    const modulePath = '/src/documents/load-example.ts';
    const { loadExample } = (await import(
      modulePath
    )) as typeof import('../../apps/web/src/documents/load-example.js');
    const results = [];
    for (const locale of ['en', 'pt-BR', 'es'] as const) {
      for (const kind of ['manual', 'scan', 'note'] as const) {
        const result = await loadExample(
          locale,
          kind,
          new AbortController().signal,
        );
        results.push({
          kind,
          locale,
          pages: result.document.pages.length,
          text: result.document.pages[0]!.text,
          expected: result.example.text,
          recognition: result.document.requiresRecognition,
        });
        result.document.dispose();
      }
    }
    return results;
  });
  expect(outputs).toHaveLength(9);
  for (const output of outputs) {
    expect(output.pages).toBe(1);
    expect(output.recognition).toBe(false);
    expect(output.text.replaceAll(/\s+/g, ' ')).toBe(
      output.expected.replaceAll(/\s+/g, ' '),
    );
  }
  const measurements = outputs.map((output) => ({
    locale: output.locale,
    kind: output.kind,
    category:
      output.kind === 'manual'
        ? 'embedded PDF extraction'
        : 'prepared transcript consistency (not OCR)',
    ...transcriptionErrors(output.expected, output.text),
  }));
  expect(
    measurements.every(
      (result) => result.characterErrors === 0 && result.wordErrors === 0,
    ),
  ).toBe(true);
  await testInfo.attach('transcription-measurements', {
    body: JSON.stringify(measurements, null, 2),
    contentType: 'application/json',
  });
});
test('real browser worker extracts pages and releases local previews', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(
    async ({ pdf }) => {
      const modulePath = '/src/documents/read.ts';
      const { readDocument } = (await import(
        modulePath
      )) as typeof import('../../apps/web/src/documents/read.js');
      const controller = new AbortController();
      const doc = await readDocument(
        new File([pdf], 'original.pdf', { type: 'application/pdf' }),
        controller.signal,
      );
      const before = await fetch(doc.previews[0]!.url).then(
        (response) => response.ok,
      );
      const output = {
        text: doc.pages[0]!.text,
        recognition: doc.requiresRecognition,
        pages: doc.pages.length,
        width: doc.previews[0]!.width,
        before,
        released: false,
      };
      const url = doc.previews[0]!.url;
      doc.dispose();
      doc.dispose();
      try {
        await fetch(url);
      } catch {
        output.released = true;
      }
      return output;
    },
    { pdf: pdfFixture('The workshop starts at 14:00.', 2) },
  );
  expect(result).toMatchObject({
    text: 'The workshop starts at 14:00.',
    pages: 2,
    recognition: false,
    before: true,
    released: true,
  });
  expect(result.width).toBeGreaterThan(0);
});
test('empty PDF, PNG and JPEG keep missing text empty', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(
    async ({ pdf }) => {
      const modulePath = '/src/documents/read.ts';
      const { readDocument } = (await import(
        modulePath
      )) as typeof import('../../apps/web/src/documents/read.js');
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 30;
      const blobs = await Promise.all(
        ['image/png', 'image/jpeg'].map(
          (type) =>
            new Promise<Blob>((resolve) =>
              canvas.toBlob((blob) => resolve(blob!), type),
            ),
        ),
      );
      const files = [
        new File([pdf], 'scan.pdf', { type: 'application/pdf' }),
        ...blobs.map((blob) => new File([blob], 'image', { type: blob.type })),
      ];
      const outputs = [];
      for (const file of files) {
        const doc = await readDocument(file, new AbortController().signal);
        outputs.push({
          text: doc.pages[0]!.text,
          recognition: doc.requiresRecognition,
        });
        doc.dispose();
      }
      return outputs;
    },
    { pdf: imagePdfFixture() },
  );
  expect(results).toEqual(
    Array.from({ length: 3 }, () => ({ text: '', recognition: true })),
  );
});
test('rejects protected, malformed and over-page-budget PDFs', async ({
  page,
}) => {
  await page.goto('/');
  const codes = await page.evaluate(
    async (fixtures) => {
      const modulePath = '/src/documents/read.ts';
      const { readDocument } = (await import(
        modulePath
      )) as typeof import('../../apps/web/src/documents/read.js');
      const errors = [];
      for (const pdf of fixtures) {
        try {
          const doc = await readDocument(
            new File([pdf], 'test.pdf', { type: 'application/pdf' }),
            new AbortController().signal,
          );
          doc.dispose();
          errors.push('accepted');
        } catch (error) {
          errors.push(
            error instanceof Error && 'code' in error ? error.code : 'unknown',
          );
        }
      }
      return errors;
    },
    [pdfFixture('private', 1, true), '%PDF-garbage', pdfFixture('', 6)],
  );
  expect(codes).toEqual(['PROTECTED_PDF', 'INVALID_FILE', 'TOO_MANY_PAGES']);
});
test('cancellation rejects promptly while file reading remains unresolved', async ({
  page,
}) => {
  await page.goto('/');
  const name = await page.evaluate(async () => {
    const modulePath = '/src/documents/read.ts';
    const { readDocument } = (await import(
      modulePath
    )) as typeof import('../../apps/web/src/documents/read.js');
    const controller = new AbortController();
    const result = readDocument(
      {
        size: 5,
        type: '',
        arrayBuffer: () => new Promise<ArrayBuffer>(() => undefined),
      },
      controller.signal,
    );
    controller.abort();
    try {
      await result;
      return 'accepted';
    } catch (error) {
      return error instanceof Error ? error.name : 'unknown';
    }
  });
  expect(name).toBe('AbortError');
});
