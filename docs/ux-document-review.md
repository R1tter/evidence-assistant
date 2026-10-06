# Document workspace visual review

Scope and plan approved by Marcelo on 6 October 2026. This review artifact covers revised Task 1; the visual direction still awaits Marcelo's feedback before frontend consolidation.

Open [the interactive proposal](ux-document-preview.html). The top selector exposes entrance, upload, reading, recognition, ready, review, answer, illegible, error and expired states. The language selector covers English, Brazilian Portuguese and Spanish. The identity disclosure contains two original vector sketches; monochrome variants are in `preview-assets/`.

The proposal reads no file content and sends nothing. Example text, responses and recognition states are prepared for interaction review. The illustrations are original vectors, not real scanned/manuscript evaluation fixtures. Asking arbitrary questions is not implemented here; the suggested questions demonstrate answer-to-passage navigation. Local editing clears the previous answer. Provider recognition remains future implementation.

Executed verification: 11 browser tests passed across the preserved app and this proposal. Preview axe/overflow checks passed for ten states in three locales at 390 px. The citation receives focus, matches the demonstrated answer and opens the source. Editing invalidates the answer, and the recognition control requires explicit consent. Automated checks supplement visual review; they do not establish comprehensive accessibility conformance or OCR/semantic correctness.

Eight new capture candidates cover entrance, upload, answer and review at 390/1440 px in `preview-captures/`. Agent inspection found readable text, no clipped controls and a clear original/text/questions hierarchy. The mobile workspace separates these views through labeled controls. Corrections removed opacity fading on readable content and immediate color transitions on selected tabs to preserve contrast during motion. Reduced motion disables displacement.

Pending visual feedback: entrance clarity and personality, the two mark options, mobile switching between document/text/questions, and whether source navigation makes the value obvious. The implementation plan requires this review before consolidating the visual into React. PDF parsing and OCR are separate later deliveries.
