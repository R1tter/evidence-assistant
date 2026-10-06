import { describe, expect, it } from 'vitest';
import { inspectInput, inspectImageDimensions } from './input.js';

const png = new Uint8Array(24);
png.set([137, 80, 78, 71, 13, 10, 26, 10]);
png.set([73, 72, 68, 82], 12);
new DataView(png.buffer).setUint32(16, 640);
new DataView(png.buffer).setUint32(20, 480);
function file(
  bytes: Uint8Array<ArrayBuffer>,
  type: string,
  size = bytes.length,
) {
  return { size, type, arrayBuffer: () => Promise.resolve(bytes.buffer) };
}
describe('bounded document input', () => {
  it('detects PDF and PNG by bytes with compatible declared types', async () => {
    await expect(
      inspectInput(
        file(new TextEncoder().encode('%PDF-1.7\n'), 'application/pdf'),
      ),
    ).resolves.toMatchObject({ kind: 'pdf' });
    await expect(inspectInput(file(png, 'image/png'))).resolves.toMatchObject({
      kind: 'png',
      width: 640,
      height: 480,
    });
  });
  it('rejects empty, unsupported, masquerading and oversized input', async () => {
    for (const candidate of [
      file(png, 'application/pdf'),
      file(new Uint8Array(), ''),
      file(png, 'image/png', 10 * 1024 * 1024 + 1),
      file(new TextEncoder().encode('hello'), 'image/png'),
    ]) {
      await expect(inspectInput(candidate)).rejects.toHaveProperty('code');
    }
  });
  it('rejects extreme pixel dimensions before decoding', () => {
    expect(() => inspectImageDimensions(4001, 4000)).toThrow();
    expect(() => inspectImageDimensions(0, 10)).toThrow();
    expect(() => inspectImageDimensions(50000, 1)).toThrow();
    expect(inspectImageDimensions(4000, 4000)).toEqual({
      width: 4000,
      height: 4000,
    });
  });
  it('reads JPEG frame dimensions and rejects missing frame', async () => {
    const jpeg = new Uint8Array([
      255, 216, 255, 192, 0, 11, 8, 1, 224, 2, 128, 1, 1, 17, 0, 255, 217,
    ]);
    await expect(inspectInput(file(jpeg, 'image/jpeg'))).resolves.toMatchObject(
      { kind: 'jpeg', width: 640, height: 480 },
    );
    await expect(
      inspectInput(file(new Uint8Array([255, 216, 255, 217]), 'image/jpeg')),
    ).rejects.toHaveProperty('code', 'INVALID_FILE');
  });
});
