import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import {
  createDocumentRevision,
  pageChunks,
  createRetriever,
  createExtractiveDocumentAnswer,
} from '@evidence/core';
import { documentExamples } from '../apps/web/src/documents/examples.js';
import { evidenceMetrics, transcriptionErrors } from './evaluation-metrics.js';
function transcriptMeasurement(reference: string, actual: string) {
  const errors = transcriptionErrors(reference, actual);
  return {
    ...errors,
    cer: errors.characters ? errors.characterErrors / errors.characters : null,
    wer: errors.words ? errors.wordErrors / errors.words : null,
  };
}
const gold = z
  .object({
    expectedFragments: z.record(z.string(), z.array(z.string()).length(3)),
    unsupportedQueries: z.array(z.string()).length(3),
    simulatedRecognition: z.array(
      z.object({
        locale: z.string(),
        reference: z.string(),
        actual: z.string(),
      }),
    ),
  })
  .parse(JSON.parse(await readFile('eval/documents/gold.json', 'utf8')));
const examples = (['en', 'pt-BR', 'es'] as const).flatMap(documentExamples);
const revisions = examples.map((example) =>
  createDocumentRevision(
    example.id,
    example.title,
    [{ page: 1, text: example.text, origin: 'reviewed', uncertainties: [] }],
    1,
  ),
);
const globalRetriever = createRetriever(revisions.flatMap(pageChunks));
let goldAnswers = 0;
const retrievalCases = [];
const privateCases = [];
for (const [index, example] of examples.entries()) {
  const revision = revisions[index]!;
  const chunks = pageChunks(revision);
  const retriever = createRetriever(chunks);
  const expectedId = chunks[0]!.id;
  for (const [queryIndex, question] of example.questions.entries()) {
    const evidence = retriever.search(question);
    const answer = createExtractiveDocumentAnswer(question, evidence);
    if (
      !answer.abstained &&
      answer.answer.includes(gold.expectedFragments[example.id]![queryIndex]!)
    )
      goldAnswers++;
    const common = {
      supported: true,
      expectedId,
      abstained: answer.abstained,
      quoteValid:
        answer.validation.quotes &&
        answer.validation.references &&
        answer.evidence.every(
          (item) => item.chunk.provenance?.revision === revision.revision,
        ),
    };
    privateCases.push({
      ...common,
      retrievedIds: evidence.map((item) => item.chunk.id),
    });
    retrievalCases.push({
      ...common,
      retrievedIds: globalRetriever
        .search(question)
        .map((item) => item.chunk.id),
    });
  }
  for (const question of gold.unsupportedQueries) {
    const evidence = retriever.search(question);
    const answer = createExtractiveDocumentAnswer(question, evidence);
    privateCases.push({
      supported: false,
      expectedId: '',
      abstained: answer.abstained,
      quoteValid: false,
      retrievedIds: evidence.map((item) => item.chunk.id),
    });
  }
}
const prepared = await Promise.all(
  examples.map(async (example) => ({
    id: example.id,
    ...transcriptMeasurement(
      await readFile(`examples/${example.locale}/${example.kind}.txt`, 'utf8'),
      example.text,
    ),
  })),
);
const result = {
  supportedQueries: 27,
  unsupportedQueries: 27,
  preparedTranscriptConsistency: prepared,
  simulatedRecognition: gold.simulatedRecognition.map((item) => ({
    locale: item.locale,
    ...transcriptMeasurement(item.reference, item.actual),
  })),
  liveRecognition: {
    cases: 0,
    cer: null,
    wer: null,
    reason:
      'No paid/live OCR run. Typeset cursive examples are not handwriting benchmarks.',
  },
  privateSession: evidenceMetrics(privateCases),
  nineDocumentRanking: {
    recallAt5: evidenceMetrics(retrievalCases).recallAt5,
    mrr: evidenceMetrics(retrievalCases).mrr,
  },
  goldFragmentAnswerRate: goldAnswers / 27,
};
console.log(JSON.stringify(result, null, 2));
if (
  result.nineDocumentRanking.recallAt5 !== 1 ||
  result.nineDocumentRanking.mrr < 0.9 ||
  goldAnswers !== 27 ||
  result.privateSession.unsupportedAbstentionRate !== 1 ||
  result.privateSession.validCitationRate !== 1 ||
  prepared.some((item) => item.characterErrors !== 0 || item.wordErrors !== 0)
)
  process.exitCode = 1;
