// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DocumentApp } from './DocumentApp.js';
import { documentExamples } from './examples.js';
import type { DocumentServices } from './useDocumentSession.js';
import { SessionApiError } from './session-client.js';
afterEach(cleanup);
function services(): DocumentServices {
  const example = documentExamples('pt-BR')[1]!;
  const document = {
    id: 'doc-1',
    title: example.title,
    revision: 1,
    pages: [
      {
        page: 1,
        text: example.text,
        origin: 'reviewed' as const,
        uncertainties: [],
      },
    ],
  };
  return {
    example: vi.fn(() =>
      Promise.resolve({
        example,
        document: {
          pages: document.pages,
          previews: [{ page: 1, url: '/example.png', width: 600, height: 800 }],
          requiresRecognition: false,
          dispose: vi.fn(),
        },
      }),
    ),
    read: vi.fn(),
    client: {
      config: () =>
        Promise.resolve({ llmAvailable: false, recognitionAvailable: false }),
      create: () =>
        Promise.resolve({ token: 'x'.repeat(43), document, expiresAt: 100000 }),
      remove: vi.fn(() => Promise.resolve()),
      edit: (_token, _page, _revision, text) =>
        Promise.resolve({
          document: {
            ...document,
            revision: 2,
            pages: [{ ...document.pages[0]!, text }],
          },
          expiresAt: 100000,
        }),
      recognize: vi.fn(),
      ask: () =>
        Promise.resolve({
          revision: 1,
          mode: 'demo',
          answer: 'A oficina começa às 14h no sábado.',
          abstained: false,
          citations: [
            {
              chunkId: 'doc-1:r1:p1:b1',
              quote: 'A oficina começa às 14h no sábado.',
            },
          ],
          evidence: [
            {
              chunk: {
                id: 'doc-1:r1:p1:b1',
                documentId: 'doc-1',
                title: example.title,
                section: 'Page 1',
                text: example.text,
                provenance: {
                  page: 1,
                  block: 1,
                  revision: 1,
                  origin: 'reviewed',
                },
              },
              score: 0.8,
            },
          ],
          validation: {
            structure: true,
            references: true,
            quotes: true,
            semantic: 'not_verified',
          },
        }),
    },
  };
}
it('lets a visitor ask about an example, inspect its source and invalidate the answer by editing', async () => {
  const user = userEvent.setup();
  render(<DocumentApp services={services()} />);
  await user.click(
    screen.getByRole('button', {
      name: 'Experimentar um exemplo',
    }),
  );
  await screen.findByRole('heading', { name: 'Pergunte sobre este documento' });
  await user.type(screen.getByLabelText('Sua pergunta'), 'A que horas começa?');
  await user.selectOptions(screen.getByLabelText('Idioma'), 'es');
  expect(screen.getByRole('textbox', { name: 'Tu pregunta' })).toHaveValue(
    'A que horas começa?',
  );
  await user.selectOptions(screen.getByLabelText('Idioma'), 'pt-BR');
  await user.click(
    screen.getByRole('button', { name: 'Perguntar ao documento' }),
  );
  await screen.findByText('A oficina começa às 14h no sábado.');
  await user.click(
    screen.getByRole('button', { name: 'Página 1 · ver trecho' }),
  );
  expect(screen.getByTestId('source-passage')).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Revisar texto' }));
  const text = screen.getByRole('textbox', { name: 'Texto da página' });
  await user.clear(text);
  await user.type(text, 'A oficina começa às 16h.');
  await user.click(screen.getByRole('button', { name: 'Salvar revisão' }));
  expect(screen.queryByTestId('document-answer')).not.toBeInTheDocument();
});
it('does not upload a late local read after cancellation and disposes its previews', async () => {
  const user = userEvent.setup();
  const deps = services();
  let finish!: (
    value: Awaited<ReturnType<DocumentServices['example']>>,
  ) => void;
  const result = await deps.example(
    'pt-BR',
    'scan',
    new AbortController().signal,
  );
  deps.example = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  deps.client.create = vi.fn(deps.client.create);
  render(<DocumentApp services={deps} />);
  await user.click(
    screen.getByRole('button', { name: 'Experimentar um exemplo' }),
  );
  await user.click(
    within(screen.getByRole('status')).getByRole('button', {
      name: 'Cancelar',
    }),
  );
  finish(result);
  await vi.waitFor(() => expect(result.document.dispose).toHaveBeenCalled());
  expect(deps.client.create).not.toHaveBeenCalled();
});
it('keeps expired sessions disabled until the visitor opens another document', async () => {
  const user = userEvent.setup();
  const deps = services();
  deps.client.ask = () =>
    Promise.reject(new SessionApiError('SESSION_EXPIRED'));
  render(<DocumentApp services={deps} />);
  await user.click(
    screen.getByRole('button', { name: 'Experimentar um exemplo' }),
  );
  await user.type(await screen.findByLabelText('Sua pergunta'), 'oficina');
  await user.click(
    screen.getByRole('button', { name: 'Perguntar ao documento' }),
  );
  await screen.findByRole('alert');
  expect(
    screen.getByRole('button', { name: 'Perguntar ao documento' }),
  ).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: 'Descartar alterações' }),
  ).not.toBeInTheDocument();
});
it('ignores a late answer after switching documents and deletes the previous session', async () => {
  const user = userEvent.setup();
  const deps = services();
  let finish!: (
    value: Awaited<ReturnType<DocumentServices['client']['ask']>>,
  ) => void;
  const result = await deps.client.ask(
    'token',
    1,
    'question',
    'demo',
    'pt-BR',
    new AbortController().signal,
  );
  deps.client.ask = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  render(<DocumentApp services={deps} />);
  await user.click(
    screen.getByRole('button', { name: 'Experimentar um exemplo' }),
  );
  await user.type(await screen.findByLabelText('Sua pergunta'), 'oficina');
  await user.click(
    screen.getByRole('button', { name: 'Perguntar ao documento' }),
  );
  await user.click(screen.getByRole('button', { name: 'Trocar documento' }));
  finish(result);
  await vi.waitFor(() => expect(deps.client.remove).toHaveBeenCalled());
  expect(screen.queryByTestId('document-answer')).not.toBeInTheDocument();
});
