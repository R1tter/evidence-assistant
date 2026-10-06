import { chunkDocuments, loadCorpus } from '@evidence/core';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { fileURLToPath } from 'node:url';
import { createMcpServer } from './server.js';

try {
  const documents = await loadCorpus(
    fileURLToPath(new URL('../../../corpus/', import.meta.url)),
  );
  const chunks = chunkDocuments(documents);
  const handle = serveStdio(() => createMcpServer(chunks, documents));
  const shutdown = () => {
    handle.close().catch(() => {
      console.error('MCP shutdown failed.');
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  console.error('MCP startup failed.');
  process.exitCode = 1;
}
