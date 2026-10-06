import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { checkBoundaries } from './check-boundaries.js';

it('rejects a core-to-app import in a real temporary source fixture', async () => {
  const root = await mkdtemp(join(tmpdir(), 'evidence-boundaries-'));
  try {
    const folder = join(root, 'packages/core/src');
    await mkdir(folder, { recursive: true });
    await writeFile(
      join(folder, 'prohibited.ts'),
      "import '../../../apps/api/src/app.js';\n",
    );
    expect(await checkBoundaries(root)).toEqual([
      expect.stringContaining('prohibited.ts'),
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
