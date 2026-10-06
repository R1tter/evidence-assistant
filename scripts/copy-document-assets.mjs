import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
const root = new URL('../', import.meta.url);
const destination = new URL('apps/web/public/pdfjs/', root);
await mkdir(destination, { recursive: true });
for (const name of ['cmaps', 'standard_fonts', 'wasm', 'LICENSE']) {
  await cp(
    fileURLToPath(new URL(`node_modules/pdfjs-dist/${name}`, root)),
    fileURLToPath(new URL(name, destination)),
    { recursive: true },
  );
}
await cp(
  fileURLToPath(new URL('examples/', root)),
  fileURLToPath(new URL('apps/web/public/examples/', root)),
  { recursive: true },
);
await cp(
  fileURLToPath(new URL('docs/preview-assets/', root)),
  fileURLToPath(new URL('apps/web/public/brand/', root)),
  { recursive: true },
);
