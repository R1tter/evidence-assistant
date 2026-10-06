# Original document examples

Authored for Evidence Assistant on 6 October 2026; no personal, employer or third-party source documents. Canonical text and questions are in `apps/web/src/documents/examples.ts`. Each locale has a short plant-care manual, a workshop sheet and a travel note, with matching prepared transcription in `.txt`.

`manual.pdf` is a real PDF with embedded WinAnsi text; `manual.png` is its matching thumbnail. `scan.png` is an original scan-style printed illustration. `note.png` uses a cursive font to illustrate a handwritten-style note; it is typeset, not a human handwriting evaluation sample. The prepared demo does not claim live recognition quality. No dates, instructions or details in these fictional examples are guidance for real use.

`scripts/generate-document-examples.ts` reproduces the documents using local Chromium/canvas and a minimal original PDF writer. Font rasterization varies by platform; the committed PNGs are the reviewed originals. Predev/prebuild copies these assets to the web public directory. PDF.js assets and licenses are copied from the pinned package, not a CDN.

Text extraction preserves source language; switching the interface does not translate uploaded documents. Each example has one page. Recognition and answer correctness must be evaluated separately from textual citation matching.
