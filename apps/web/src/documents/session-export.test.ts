import { expect, it } from 'vitest';
import { buildSessionExport } from './session-export.js';
import { workspaceMessages } from './product-copy.js';
it('exports saved text and revision-specific history without credentials or omitted source quotes', () => {
  const document = {
    id: 'private-id',
    title: 'Meu documento',
    revision: 2,
    pages: [
      {
        page: 1,
        text: 'Texto salvo <script>literal</script>',
        origin: 'reviewed' as const,
        uncertainties: [],
      },
    ],
  };
  const result = {
    revision: 1,
    mode: 'demo' as const,
    answer: 'Resposta antiga',
    abstained: false,
    citations: [{ chunkId: 'old', quote: 'Trecho antigo completo' }],
    evidence: [],
    validation: {
      structure: true,
      references: true,
      quotes: true,
      semantic: 'not_verified' as const,
    },
  };
  const output = buildSessionExport(
    document,
    [{ question: 'Pergunta original', answer: result }],
    workspaceMessages['pt-BR'],
  );
  expect(output).toContain('Texto salvo <script>literal</script>');
  expect(output).toContain('Pergunta original');
  expect(output).toContain('Resposta antiga');
  expect(output).toContain('Trecho antigo completo');
  expect(output).toContain('Revisão anterior');
  expect(output).not.toContain('private-id');
});
