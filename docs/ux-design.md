# Evidence Assistant — UX design brief

## Audience and outcome

A recruiter can understand the product and try a useful question within one minute. An engineer can inspect evidence and the implementation without the UI obscuring the reading experience. The product communicates reliability through clarity, not decorative metrics.

## Direction

An editorial research workspace: neutral slate background, dark readable text, restrained blue accent and generous spacing. Use a system font stack initially, consistent type scale and semantic tokens for color, spacing, radius and focus. Avoid gradients, arbitrary badges, animated charts and chat bubbles without purpose.

Desktop: compact header; question composer and suggested questions; answer in the main reading column; sources in a secondary column. Mobile: single column with answer first, sources afterward. Cap reading width; prevent horizontal overflow at 320 CSS pixels.

Mode label uses plain language: `Demo · extractive answers` or `AI · generated answers`. Explain the distinction near the mode control; do not expose raw provider configuration. An unavailable AI mode has a clear explanation.

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
