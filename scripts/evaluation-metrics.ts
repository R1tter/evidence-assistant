export function normalizeTranscript(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
}
function editDistance(reference: string[], actual: string[]): number {
  let previous = actual.map((_token, index) => index + 1);
  previous.unshift(0);
  reference.forEach((token, row) => {
    const current = [row + 1];
    actual.forEach((value, column) => {
      current.push(
        Math.min(
          current[column]! + 1,
          previous[column + 1]! + 1,
          previous[column]! + Number(token !== value),
        ),
      );
    });
    previous = current;
  });
  return previous[actual.length]!;
}
export function transcriptionErrors(reference: string, actual: string) {
  const normalizedReference = normalizeTranscript(reference);
  const normalizedActual = normalizeTranscript(actual);
  const words = normalizedReference ? normalizedReference.split(' ') : [];
  const actualWords = normalizedActual ? normalizedActual.split(' ') : [];
  return {
    characters: [...normalizedReference].length,
    words: words.length,
    characterErrors: editDistance(
      [...normalizedReference],
      [...normalizedActual],
    ),
    wordErrors: editDistance(words, actualWords),
  };
}
interface EvidenceCase {
  supported: boolean;
  expectedId: string;
  retrievedIds: string[];
  abstained: boolean;
  quoteValid: boolean;
}
export function evidenceMetrics(cases: EvidenceCase[]) {
  const supported = cases.filter((item) => item.supported);
  const unsupported = cases.filter((item) => !item.supported);
  const answered = cases.filter((item) => !item.abstained);
  const ranks = supported.map((item) =>
    item.retrievedIds.slice(0, 5).indexOf(item.expectedId),
  );
  return {
    recallAt5:
      ranks.filter((rank) => rank >= 0).length / Math.max(supported.length, 1),
    mrr:
      ranks.reduce((sum, rank) => sum + (rank < 0 ? 0 : 1 / (rank + 1)), 0) /
      Math.max(supported.length, 1),
    supportedAnswerRate:
      supported.filter((item) => !item.abstained).length /
      Math.max(supported.length, 1),
    unsupportedAbstentionRate:
      unsupported.filter((item) => item.abstained).length /
      Math.max(unsupported.length, 1),
    validCitationRate:
      answered.filter(
        (item) =>
          item.quoteValid && item.retrievedIds.includes(item.expectedId),
      ).length / Math.max(answered.length, 1),
  };
}
