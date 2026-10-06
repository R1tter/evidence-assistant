import { fileURLToPath } from 'node:url';
import { loadCorpus, chunkDocuments } from '@evidence/core';
import { buildApp } from './app.js';
import { generatorFromEnvironment } from './provider.js';

try {
  const documents = await loadCorpus(
    fileURLToPath(new URL('../../../corpus/', import.meta.url)),
  );
  const provider = generatorFromEnvironment();
  const app = buildApp({
    documents,
    chunks: chunkDocuments(documents),
    ...(provider ? { generate: provider.generate } : {}),
    log: (entry) => console.log(JSON.stringify(entry)),
  });
  await app.listen({
    port: Number(process.env.PORT ?? 3001),
    host: '127.0.0.1',
  });
  const stop = () => {
    void app.close().catch(() => {
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
} catch {
  console.error(
    'API startup failed. Check corpus, port and optional AI configuration.',
  );
  process.exitCode = 1;
}
