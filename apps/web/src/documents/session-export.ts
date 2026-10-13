import type { DocumentRevision } from '@evidence/core';
import type { DocumentMessages } from './messages.js';
import type { HistoryEntry } from './session-history.js';
export function historyRecordText(
  entry: HistoryEntry,
  revision: number,
  t: DocumentMessages,
): string {
  const answer = entry.answer;
  const state =
    answer.revision === revision ? t.currentRevision : t.previousRevision;
  const citations = answer.citations.map((citation) => {
    const page = answer.evidence.find(
      (item) => item.chunk.id === citation.chunkId,
    )?.chunk.provenance?.page;
    return `${t.pageLabel} ${page ?? '?'}\n${citation.quote}`;
  });
  return [
    `${t.yourQuestion}: ${entry.question}`,
    `${t.answerMode}: ${answer.mode === 'demo' ? t.answerExtracted : t.modeAi}`,
    `${t.revisionLabel} ${answer.revision} · ${state}`,
    answer.abstained ? t.noEvidenceTitle : '',
    answer.answer,
    ...citations,
    answer.revision === revision ? '' : t.historyStaleHelp,
  ]
    .filter(Boolean)
    .join('\n\n');
}
export function buildSessionExport(
  document: DocumentRevision,
  history: readonly HistoryEntry[],
  t: DocumentMessages,
): string {
  return [
    'Evidence Assistant',
    document.title,
    `${t.revisionLabel} ${document.revision}`,
    t.exportHelp,
    t.checksBody,
    t.savedTranscript,
    ...document.pages.map(
      (page) => `${t.pageLabel} ${page.page}\n\n${page.text}`,
    ),
    t.historyTitle,
    history.length
      ? history
          .map((entry) => historyRecordText(entry, document.revision, t))
          .join('\n\n--------------------\n\n')
      : t.historyEmpty,
  ].join('\n\n');
}
export function downloadSessionExport(text: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'text/plain;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'evidence-assistant.txt';
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
