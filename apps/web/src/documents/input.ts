export const INPUT_LIMITS = Object.freeze({
  bytes: 10 * 1024 * 1024,
  pages: 5,
  pixels: 16_000_000,
  dimension: 16384,
  text: 40000,
  milliseconds: 15000,
});
export type InputErrorCode =
  | 'INVALID_FILE'
  | 'UNSUPPORTED_FILE'
  | 'FILE_TOO_LARGE'
  | 'IMAGE_TOO_LARGE'
  | 'TOO_MANY_PAGES'
  | 'PROTECTED_PDF'
  | 'TEXT_TOO_LARGE'
  | 'READ_TIMEOUT';
export class InputError extends Error {
  constructor(public readonly code: InputErrorCode) {
    super(code);
  }
}
export interface InputFile {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}
export type InspectedInput =
  | { bytes: Uint8Array<ArrayBuffer>; kind: 'pdf' }
  | {
      bytes: Uint8Array<ArrayBuffer>;
      kind: 'png' | 'jpeg';
      width: number;
      height: number;
    };
export function inspectImageDimensions(width: number, height: number) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1
  )
    throw new InputError('INVALID_FILE');
  if (
    width * height > INPUT_LIMITS.pixels ||
    Math.max(width, height) > INPUT_LIMITS.dimension
  )
    throw new InputError('IMAGE_TOO_LARGE');
  return { width, height };
}
function jpegDimensions(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 255) throw new InputError('INVALID_FILE');
    const marker = view.getUint8(offset + 1);
    if (marker === 255) {
      offset++;
      continue;
    }
    const length = view.getUint16(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length)
      throw new InputError('INVALID_FILE');
    if (
      [
        192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
      ].includes(marker)
    ) {
      if (length < 8) throw new InputError('INVALID_FILE');
      return inspectImageDimensions(
        view.getUint16(offset + 7),
        view.getUint16(offset + 5),
      );
    }
    offset += length + 2;
  }
  throw new InputError('INVALID_FILE');
}
function detect(bytes: Uint8Array<ArrayBuffer>): InspectedInput {
  const head = Array.from(bytes.subarray(0, 8)).join(',');
  if (new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-')
    return { bytes, kind: 'pdf' };
  if (
    head === '137,80,78,71,13,10,26,10' &&
    bytes.length >= 24 &&
    new TextDecoder().decode(bytes.subarray(12, 16)) === 'IHDR'
  ) {
    const view = new DataView(bytes.buffer);
    return {
      bytes,
      kind: 'png',
      ...inspectImageDimensions(view.getUint32(16), view.getUint32(20)),
    };
  }
  if (bytes[0] === 255 && bytes[1] === 216)
    return { bytes, kind: 'jpeg', ...jpegDimensions(bytes) };
  throw new InputError('UNSUPPORTED_FILE');
}
export async function inspectInput(file: InputFile): Promise<InspectedInput> {
  if (file.size <= 0) throw new InputError('INVALID_FILE');
  if (file.size > INPUT_LIMITS.bytes) throw new InputError('FILE_TOO_LARGE');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== file.size) throw new InputError('INVALID_FILE');
  const result = detect(bytes);
  const expected = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpeg: 'image/jpeg',
  }[result.kind];
  if (file.type && file.type !== expected) throw new InputError('INVALID_FILE');
  return result;
}
