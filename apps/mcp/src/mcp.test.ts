import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { chunkDocuments, loadCorpus, search } from '@evidence/core';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('MCP over a spawned stdio process', () => {
  const client = new Client({ name: 'evidence-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../dist/stdio.js', import.meta.url))],
    cwd: tmpdir(),
    stderr: 'pipe',
  });
  const protocolErrors: Error[] = [];
  transport.onerror = (error) => protocolErrors.push(error);
  beforeAll(async () => {
    await client.connect(transport);
  });
  afterAll(async () => {
    await client.close();
  });

  it('exposes exactly two read-only tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'get_document',
      'search_documents',
    ]);
    expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(
      true,
    );
  });

  it('returns the same evidence and scores as the core', async () => {
    const documents = await loadCorpus(
      fileURLToPath(new URL('../../../corpus/', import.meta.url)),
    );
    const query = 'How are evidence citations checked?';
    const expected = search(chunkDocuments(documents), query, 3);
    const result = await client.callTool({
      name: 'search_documents',
      arguments: { query, limit: 3 },
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual({ evidence: expected });
    expect(expected.length).toBeGreaterThan(0);
  });

  it('returns original source content without exposing paths', async () => {
    const documents = await loadCorpus(
      fileURLToPath(new URL('../../../corpus/', import.meta.url)),
    );
    const document = documents[0];
    if (!document) throw new Error('Missing corpus fixture');
    const result = await client.callTool({
      name: 'get_document',
      arguments: { id: document.id },
    });
    expect(result.structuredContent).toEqual({
      document: {
        id: document.id,
        title: document.title,
        content: document.content,
      },
    });
  });

  it.each(['missing', '../../.env'])(
    'rejects unknown document ID %s',
    async (id) => {
      const result = await client.callTool({
        name: 'get_document',
        arguments: { id },
      });
      expect(result.isError).toBe(true);
      expect(result.content).toEqual([
        { type: 'text', text: 'Document not found.' },
      ]);
    },
  );

  it.each([0, 6, 1.5, '2'])('rejects invalid limit %s', async (limit) => {
    const result = await client.callTool({
      name: 'search_documents',
      arguments: { query: 'evidence', limit },
    });
    expect(result.isError).toBe(true);
  });

  it.each([' ', 'a'.repeat(1001)])(
    'rejects an invalid query length',
    async (query) => {
      const result = await client.callTool({
        name: 'search_documents',
        arguments: { query },
      });
      expect(result.isError).toBe(true);
    },
  );

  it('returns an empty evidence list for an unsupported query', async () => {
    const result = await client.callTool({
      name: 'search_documents',
      arguments: { query: 'galactic penguin recipes' },
    });
    expect(result.structuredContent).toEqual({ evidence: [] });
    expect(protocolErrors).toEqual([]);
  });

  it('exits cleanly when its input pipe closes without printing to stdout', async () => {
    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL('../dist/stdio.js', import.meta.url))],
      { cwd: tmpdir(), stdio: 'pipe' },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (data: string) => {
      stdout += data;
    });
    child.stderr.setEncoding('utf8').on('data', (data: string) => {
      stderr += data;
    });
    const exited = once(child, 'exit');
    child.stdin.end();
    try {
      expect(await exited).toEqual([0, null]);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
    } finally {
      child.kill();
    }
  });
});
