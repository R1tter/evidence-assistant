# Local document reader

The approved document workspace uses PDF.js 6.4.299 in a dedicated worker, with local input bytes. The package engine requires Node >=22.13.0; this delivery ran on Node 22.17.0. Worker, CMaps, fonts and WASM are served from the local pinned package with its licenses, not a CDN. Vite development worker extraction and termination were verified in Chromium on Windows. Task 5 integrated the reader in the production bundle; a real PDF upload followed by a question through the credential-free API passed against Vite's built preview.

Input validation checks bytes, MIME consistency, 10 MiB file size and image dimensions before decoding. PNG/JPEG have a 16-million-pixel/16,384-side limit. PDFs reject protected, invalid and over-five-page inputs. Transcription output is capped at 40,000 characters. Each PDF preview is limited to two million pixels and a 1,800-pixel side, with canvases cleaned sequentially. The operation deadline is 15 seconds. Cancellation rejects promptly, terminates the worker and revokes allocated object URLs; the successful result owns an idempotent dispose method.

These are resource controls, not a proof that PDF.js/browser decoding has a strict process-memory ceiling. Hostile parsing still needs deployment isolation/load testing; object URL revocation is not an assertion of immediate garbage collection. Image decoding is browser-managed and may finish after cancellation, at which point its bitmap closes. Complex layouts, reading order, embedded font/CMap variation, JPEG2000 and browser/platform differences need broader fixtures. No OCR occurs in this reader; pages without extractable text remain empty and request optional recognition.

Prepared image examples substitute their registered transcriptions only in the example loader. Arbitrary uploads never receive prepared text. The note is a typeset cursive illustration, explicitly documented as unsuitable for measuring recognition of human handwriting.

Reference: [PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html). Public API types and actual browser behavior, rather than older configuration examples, govern the adapter.
