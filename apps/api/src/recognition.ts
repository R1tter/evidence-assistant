import { z } from 'zod';
import { pageTextSchema } from '@evidence/core';
import type { PageText } from '@evidence/core';
import { PublicError } from './errors.js';
export const recognitionOutputSchema = z.strictObject({
  pages: z
    .array(pageTextSchema.omit({ origin: true }))
    .min(1)
    .max(5),
});
const inputSchema = z.strictObject({
  revision: z.number().int().min(1),
  consent: z.literal(true),
  pages: z
    .array(
      z.strictObject({
        page: z.number().int().min(1).max(5),
        mime: z.enum(['image/png', 'image/jpeg']),
        data: z
          .string()
          .min(1)
          .max(14 * 1024 * 1024),
      }),
    )
    .min(1)
    .max(5),
});
export interface RecognitionImage {
  page: number;
  mime: 'image/png' | 'image/jpeg';
  data: string;
  width: number;
  height: number;
}
export interface Recognizer {
  recognize(
    this: void,
    pages: RecognitionImage[],
    signal?: AbortSignal,
  ): Promise<PageText[]>;
}
function jpegDimensions(bytes: Buffer) {
  if (bytes[0] !== 255 || bytes[1] !== 216)
    throw new PublicError('INVALID_REQUEST');
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 255) throw new PublicError('INVALID_REQUEST');
    const marker = bytes.readUInt8(offset + 1);
    if (marker === 255) {
      offset++;
      continue;
    }
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length)
      throw new PublicError('INVALID_REQUEST');
    if (
      [
        192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
      ].includes(marker)
    ) {
      if (length < 8) throw new PublicError('INVALID_REQUEST');
      return {
        width: bytes.readUInt16BE(offset + 7),
        height: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += length + 2;
  }
  throw new PublicError('INVALID_REQUEST');
}
function dimensions(bytes: Buffer, mime: RecognitionImage['mime']) {
  if (mime === 'image/jpeg') return jpegDimensions(bytes);
  if (
    bytes.length < 33 ||
    bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    bytes.readUInt32BE(8) !== 13 ||
    bytes.subarray(12, 16).toString() !== 'IHDR'
  )
    throw new PublicError('INVALID_REQUEST');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
export function validateRecognitionInput(value: unknown) {
  const parsed = inputSchema.safeParse(value);
  if (!parsed.success) throw new PublicError('INVALID_REQUEST');
  const seen = new Set<number>();
  let total = 0;
  const pages = parsed.data.pages.map((page) => {
    if (seen.has(page.page) || !/^[A-Za-z0-9+/]+={0,2}$/.test(page.data))
      throw new PublicError('INVALID_REQUEST');
    seen.add(page.page);
    const bytes = Buffer.from(page.data, 'base64');
    total += bytes.length;
    if (bytes.toString('base64') !== page.data || total > 10 * 1024 * 1024)
      throw new PublicError('INVALID_REQUEST');
    const size = dimensions(bytes, page.mime);
    if (
      size.width < 1 ||
      size.height < 1 ||
      size.width * size.height > 16_000_000 ||
      Math.max(size.width, size.height) > 16384
    )
      throw new PublicError('INVALID_REQUEST');
    return { ...page, ...size };
  });
  return { ...parsed.data, pages };
}
export function validateRecognitionOutput(
  value: unknown,
  selected: number[],
): PageText[] {
  const parsed = recognitionOutputSchema.safeParse(value);
  if (!parsed.success) throw new PublicError('PROVIDER_INVALID');
  const pages = parsed.data.pages;
  if (
    pages.length !== selected.length ||
    pages.some((page, i) => page.page !== selected[i]) ||
    pages.reduce((sum, page) => sum + page.text.length, 0) > 40000
  )
    throw new PublicError('PROVIDER_INVALID');
  return pages.map((page) => ({ ...page, origin: 'vision' }));
}
