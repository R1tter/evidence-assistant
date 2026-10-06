import { cpus, platform, release, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
import {
  createDocumentRevision,
  pageChunks,
  createRetriever,
} from '@evidence/core';
const chunks = Array.from({ length: 1000 }, (_value, index) =>
  pageChunks(
    createDocumentRevision(
      `benchmark-${index}`,
      `Original fixture ${index}`,
      [
        {
          page: 1,
          text: `Workshop ${index} starts at 14:00. Reference code item${index}. Bring an apron and water. Materials are included in room ${index % 10}.`,
          origin: 'embedded',
          uncertainties: [],
        },
      ],
      1,
    ),
  ),
).flat();
const before = process.memoryUsage();
const started = performance.now();
const retriever = createRetriever(chunks);
const indexMs = performance.now() - started;
const after = process.memoryUsage();
for (let index = 0; index < 50; index++) retriever.search(`item${index}`);
const durations = Array.from({ length: 500 }, (_value, index) => {
  const start = performance.now();
  retriever.search(`item${index % 1000} workshop`);
  return performance.now() - start;
}).sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      documents: 1000,
      chunks: chunks.length,
      queries: 500,
      warmupQueries: 50,
      node: process.version,
      platform: platform(),
      release: release(),
      cpu: cpus()[0]?.model,
      logicalCpus: cpus().length,
      totalMemoryBytes: totalmem(),
      indexMs,
      heapDeltaBytes: after.heapUsed - before.heapUsed,
      rssDeltaBytes: after.rss - before.rss,
      p50Ms: durations[Math.floor(durations.length * 0.5)],
      p95Ms: durations[Math.floor(durations.length * 0.95)],
      method:
        'Single process, synthetic original documents; observed heap/RSS deltas without forced GC, not strict index memory or capacity guarantees.',
    },
    null,
    2,
  ),
);
