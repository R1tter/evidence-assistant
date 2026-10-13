# Evidence Assistant — UX design brief

## Audience and outcome

A recruiter can understand the product and try a useful question within one minute. An engineer can inspect evidence and the implementation without the UI obscuring the reading experience. The product communicates reliability through clarity, not decorative metrics.

## Direction

Approved direction, 6 October 2026: Marcelo approved the document-first scope in `docs/superpowers/specs/2026-10-06-document-workspace-design.md` and the new visual proposal. Use indigo, teal and coral accents, original illustrations, a localized entrance gradient and purposeful motion; keep reading surfaces neutral and honor reduced motion. Marcelo selected identity direction A: the original page with a highlighted passage (`brand-highlight.svg`). Use its color and monochrome variants consistently. The older visual constraints below describe the preserved baseline.

An editorial research workspace: neutral slate background, dark readable text, restrained blue accent and generous spacing. Use a system font stack initially, consistent type scale and semantic tokens for color, spacing, radius and focus. Avoid gradients, arbitrary badges, animated charts and chat bubbles without purpose.

Desktop: compact header; question composer and suggested questions; answer in the main reading column; sources in a secondary column. Mobile: single column with answer first, sources afterward. Cap reading width; prevent horizontal overflow at 320 CSS pixels.

Mode label uses plain language: `Demo · extractive answers` or `AI · generated answers`. Explain the distinction near the mode control; do not expose raw provider configuration. An unavailable AI mode has a clear explanation.

## Interface languages

Marcelo requested English, Brazilian Portuguese and Spanish on 6 October 2026 to broaden the portfolio audience. Use a labeled native selector in the header with language names `English`, `Português (Brasil)` and `Español`, without flag icons. Translate interface controls, notices, validation explanations and accessibility labels; update the document language. Switching language preserves the entered question and current state. Keep original quotes and source documents in their original language and identify that language visibly. Current original corpus and lexical retrieval are English; interface localization alone does not establish multilingual question support. Suggested labels can be localized while queries use the original collection language, with a visible explanation.

The preview starts in Brazilian Portuguese for this review. Product preference persistence, locale fallback and browser-language selection will be verified with the React implementation. Do not promise translated extractive quotes or automatic multilingual retrieval without corresponding corpus and evaluation changes.

## Interaction and states

- Initial: concise product explanation, collection overview and three realistic example questions. Example selection fills the composer; the user chooses when to submit.
- Loading: announce progress, preserve the question, expose cancel, prevent duplicate submission and keep layout stable. Do not fabricate progress percentages.
- Answer: readable paragraphs, numbered references linked to source cards, optional evidence details. Show citation checks alongside their limited meaning; never label an answer as proven true.
- Source inspection: disclose title, section, exact excerpt and original document. Keyboard focus moves predictably; closing a dialog restores focus. Prefer inline disclosure when it avoids a modal.
- No evidence: direct explanation and an actionable suggestion based on the collection; no fabricated answer.
- Error: plain explanation, retry action and preserved input. Technical request ID appears only in optional details for troubleshooting.
- Long content: wrap long words/IDs; avoid fixed-height clipped answers. Prefer expansion to hidden text.

## Components and reference states

`QuestionComposer`, `ModeSelector`, `AnswerPanel`, `CitationLink`, `EvidenceCard`, `SourceDisclosure`, `StatusNotice`, `EmptyState`. App handles composition; components expose focused props and semantic markup. Storybook documents initial, loading, success, abstention, error, long-answer and unavailable-mode cases.

Storybook is the reference for approved component states. Use deterministic fixtures for screenshot comparisons; API/protocol tests remain the reference for behavior and contracts.

## Verification

- Review a static desktop/mobile layout and the end-to-end flow before implementation of the visual layer. Produce a local preview artifact; no external design project is required.
- Target WCAG 2.2 AA: keyboard operation, visible and unobscured focus, semantic landmarks/labels, status announcements, text contrast >=4.5:1 (large text >=3:1), UI contrast >=3:1 and appropriately sized targets. Respect reduced motion.
- Automated axe checks on main application states and Storybook stories; complement with manual keyboard and source-reading checks. Automated checks alone do not establish conformance.
- Playwright screenshot baselines: initial, answered, abstained, error and long evidence, at 390px and 1440px widths. Also inspect 320px reflow and 200% zoom. Review rather than blindly accept updated baselines.
- No invented usability scores or performance scores. Report the actual evidence and issues found during review.

## UI UX Pro Max applied

Installed workspace skill: `.agents/skills/ui-ux-pro-max/SKILL.md`. Read and applied on 6 October 2026. Its guidance supplements this brief and does not override the approved scope or code-quality contract.

Queries executed: `AI document search content-first --design-system` and one narrower retry, `knowledge base search workspace --design-system`. The first matched a marketing showcase; rejected that layout as unsuitable. The second matched FAQ/Documentation Landing and Minimalism & Swiss Style. Adopt the prominent search, readable restrained layout and palette; adapt the landing pattern into the application workspace. Do not add contact escalation, analytics or invented social proof.

Initial tokens selected from the verified second match: background `#F8FAFC`, text `#1E293B`, surface `#FFFFFF`, accent `#2563EB`, muted text `#475569`, border `#E2E8F0`. Borders used as decoration are distinct from contrast-required control boundaries. Check all actual text/control combinations before accepting the visual baseline. Keep system fonts to avoid an external font dependency; the suggested Atkinson Hyperlegible is an optional future typography comparison.

Use 16px body text, line-height >=1.5, 44px interaction targets where practical, visible focus, SVG icons with accessible names where needed, and reduced-motion support. Review widths 375/768/1024/1440 in addition to the project's existing reflow and screenshot cases.

Focused query `keyboard focus disclosure --domain ux` verified visible focus and unobscured focus guidance. Fully unobscured focus is a useful higher target; do not mislabel the enhanced AAA criterion as an AA requirement. Disclosure-specific implementation will also require keyboard and focus-restoration tests already listed above.

## Approved interface refinements, 6 October 2026

Marcelo approved five local refinements: native selects with inset decorative chevrons, a visitor-controlled walkthrough using the prepared example, a discreet authored footer credit, an explicitly labeled indigo transcript surface, and an enlarged original-page dialog. Teal remains reserved for the cited passage. The walkthrough does not create a session or simulate live recognition; it supports manual steps and play/pause/replay, with a static result under reduced motion. The enlarged original fits its available reading area, supports zoom up to 300%, offers keyboard scrolling and Escape, and returns focus to its opener. Zoom enlarges the available preview; it does not improve document resolution or handwriting recognition. Labels are localized in English, Brazilian Portuguese and Spanish.

The approved walkthrough now uses a continuous 18-second GSAP timeline with a moving cursor, original-to-transcript transition, progressive question typing, answer reveal and a source highlight. All visual stages stay mounted to avoid abrupt frame replacement. Playback remains visitor-controlled with pause/resume, replay and manual chapters; reduced motion presents the completed example. A static accessible summary avoids announcing every animation frame. This is a presentation of prepared text, with no OCR or generation request.

## Reading tools, approved 11 October 2026

Add a Compare view with original and saved transcript side by side on desktop; mobile uses explicit original/transcript controls. Questions follow below the full-width comparison. Linked scrolling is opt-in and follows proportional vertical position, with no word-level alignment claim. Named scroll regions support keyboard navigation. Original enlargement remains available; local review drafts survive view changes.

Search is local and literal across all saved pages, ignores letter case and preserves accent distinctions. A labeled search field, previous/next/clear controls, result count and page number expose navigation. Search marks use amber and an outlined active occurrence, distinct from teal evidence. Selecting a search result reveals its page and transcript, including when the mobile original pane was open. Saving a revision recalculates matches and reconciles the active result with the displayed page. Empty results suggest another word or reviewing the transcript. Unsubmitted drafts are not searched. All labels support English, Brazilian Portuguese and Spanish. No recognition or generation request is needed.

## Session history and export, approved 13 October 2026

Completed responses are recorded with the submitted question, response mode, original revision and quoted passages. History lives only in browser memory and is cleared when changing documents or leaving/reloading the session. Native disclosures expose each record; a response based on an older revision has a visible notice and static quotes, without links claiming they describe the current transcript. Cancellation, failed requests and superseded responses do not create history entries. Revision edits preserve the historical records while removing the current answer.

An explicit TXT download exports the saved current transcript and the complete historical questions, answers and quotes, with revision/mode labels and the limits of evidence verification. Unsaved drafts, capability tokens, internal document IDs and original image URLs are excluded. Saving the file makes a local copy that outlives the temporary session, explained near the export control. Export is disabled during operations or uncertain revision recovery. JavaScript download failures are announced next to the control, with retry guidance. All copy is localized in English, Brazilian Portuguese and Spanish. No external service is involved in export.
