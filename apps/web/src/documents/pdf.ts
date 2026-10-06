import { getDocument, PDFWorker } from 'pdfjs-dist';
import { INPUT_LIMITS, InputError } from './input.js';
import type { PageText, PagePreview } from './types.js';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { GlobalWorkerOptions } from 'pdfjs-dist';
GlobalWorkerOptions.workerSrc = workerUrl;
const PAGE_PIXELS = 2_000_000;
function previewScale(width: number, height: number) {
  if (!Number.isFinite(width * height) || width < 1 || height < 1)
    throw new InputError('INVALID_FILE');
  return Math.min(
    1.5,
    1800 / Math.max(width, height),
    Math.sqrt(PAGE_PIXELS / (width * height)),
  );
}
function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new InputError('INVALID_FILE'))),
      'image/png',
    ),
  );
}
async function renderPreview(
  page: import('pdfjs-dist').PDFPageProxy,
  number: number,
  signal: AbortSignal,
  makeUrl: (blob: Blob) => string,
): Promise<PagePreview> {
  const natural = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({
    scale: previewScale(natural.width, natural.height),
  });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new InputError('INVALID_FILE');
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await canvasBlob(canvas);
    signal.throwIfAborted();
    return {
      page: number,
      url: makeUrl(blob),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }
}
export async function readPdf(
  bytes: Uint8Array<ArrayBuffer>,
  signal: AbortSignal,
  makeUrl: (blob: Blob) => string,
) {
  const worker = new PDFWorker();
  const task = getDocument({
    data: bytes,
    worker,
    useSystemFonts: true,
    stopAtErrors: true,
    maxImageSize: INPUT_LIMITS.pixels,
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
    wasmUrl: '/pdfjs/wasm/',
  });
  const abort = () => {
    void task.destroy().catch(() => undefined);
    worker.destroy();
  };
  signal.addEventListener('abort', abort, { once: true });
  const pages: PageText[] = [];
  const previews: PagePreview[] = [];
  let characters = 0;
  try {
    signal.throwIfAborted();
    const pdf = await task.promise;
    if (pdf.numPages > INPUT_LIMITS.pages)
      throw new InputError('TOO_MANY_PAGES');
    for (let number = 1; number <= pdf.numPages; number++) {
      signal.throwIfAborted();
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) =>
          'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '',
        )
        .join('')
        .trim();
      characters += text.length;
      if (characters > INPUT_LIMITS.text)
        throw new InputError('TEXT_TOO_LARGE');
      pages.push({ page: number, text, origin: 'embedded', uncertainties: [] });
      previews.push(await renderPreview(page, number, signal, makeUrl));
    }
    return { pages, previews };
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof InputError) throw error;
    if (error instanceof Error && error.name === 'PasswordException')
      throw new InputError('PROTECTED_PDF');
    throw new InputError('INVALID_FILE');
  } finally {
    signal.removeEventListener('abort', abort);
    await task.destroy();
    worker.destroy();
  }
}
