import { pageChunks } from './document-revisions.js';
import type { DocumentRevision } from './document-revisions.js';
import { validateAnswer } from './validation.js';
import type { Citation } from './validation.js';
const conclusion =
  /\b(?:conclus[aã]o|conclus[oõ]es|conclusi[oó]n(?:es)?|conclusions?|impress[aã]o diagn[oó]stica|diagnostic impression)\b/iu;
const heading =
  /^[ \t]*(?:\d+[.)][ \t]*)?(?:conclus[aã]o|conclus[oõ]es|conclusi[oó]n(?:es)?|conclusions?|impress[aã]o diagn[oó]stica|diagnostic impression)[ \t]*(?::|$)/imu;
const nextHeading = /^[ \t]*[\p{Lu}][\p{Lu}\p{N} \t/-]{2,79}[ \t]*:?[ \t]*$/mu;
const namedHeading =
  /^[ \t]*(?:recomendações|recomendaciones|recommendations|observações|observaciones|observations|assinatura|signature|resultados|results|metodologia|methodology)[ \t]*:?[ \t]*$/imu;
export class SectionTooLargeError extends Error {}
function sectionRange(text: string) {
  const start = heading.exec(text);
  if (!start) return undefined;
  const lineEnd = text.indexOf('\n', start.index);
  const bodyStart = lineEnd < 0 ? text.length : lineEnd + 1;
  const remaining = text.slice(bodyStart);
  const offsets = [
    nextHeading.exec(remaining)?.index,
    namedHeading.exec(remaining)?.index,
  ].filter((index): index is number => index !== undefined);
  return {
    start: start.index,
    end: offsets.length ? bodyStart + Math.min(...offsets) : text.length,
  };
}
function sourceSpans(document: DocumentRevision) {
  let pageOffset = 0;
  return document.pages.flatMap((page) => {
    let cursor = 0;
    const spans = pageChunks({ ...document, pages: [page] }).map((chunk) => {
      const start = page.text.indexOf(chunk.text, cursor);
      cursor = start + chunk.text.length;
      return { chunk, start: pageOffset + start, end: pageOffset + cursor };
    });
    pageOffset += page.text.length + 1;
    return spans;
  });
}
export function extractDocumentSection(
  question: string,
  document: DocumentRevision,
) {
  if (!conclusion.test(question)) return undefined;
  const text = document.pages.map((page) => page.text).join('\n');
  const range = sectionRange(text);
  if (!range) return undefined;
  const answer = text.slice(range.start, range.end).trim();
  if (answer.length > 4000) throw new SectionTooLargeError();
  const citations: Citation[] = [];
  const evidence = sourceSpans(document).flatMap(({ chunk, start, end }) => {
    const quote = text
      .slice(Math.max(start, range.start), Math.min(end, range.end))
      .trim();
    if (end <= range.start || start >= range.end || !quote) return [];
    citations.push({ chunkId: chunk.id, quote });
    return [{ chunk, score: 1 }];
  });
  if (citations.length > 5) throw new SectionTooLargeError();
  return validateAnswer(
    { mode: 'demo', answer, citations, abstained: false },
    evidence,
  );
}
