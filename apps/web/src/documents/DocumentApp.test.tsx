// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DocumentApp } from './DocumentApp.js';
import { documentExamples } from './examples.js';
import type { DocumentServices } from './useDocumentSession.js';
import { SessionApiError } from './session-client.js';
beforeEach(() => localStorage.setItem('evidence-interface-locale', 'pt-BR'));
afterEach(() => {
  cleanup();
  localStorage.clear();
});
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
      get: () => Promise.resolve({ document, expiresAt: 100000 }),
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
it('keeps a correction draft while consulting the original', async () => {
  const user = userEvent.setup();
  render(<DocumentApp services={services()} />);
  await user.click(
    screen.getByRole('button', { name: 'Experimentar um exemplo' }),
  );
  await user.click(
    await screen.findByRole('button', { name: 'Revisar texto' }),
  );
  await user.clear(screen.getByLabelText('Texto da página'));
  await user.type(
    screen.getByLabelText('Texto da página'),
    'Correção ainda não salva',
  );
  await user.click(screen.getByRole('button', { name: 'Original' }));
  await user.click(screen.getByRole('button', { name: 'Revisar texto' }));
  expect(screen.getByLabelText('Texto da página')).toHaveValue(
    'Correção ainda não salva',
  );
});
it('keeps separate page drafts when navigating pages and mobile tabs', async () => {
  const user = userEvent.setup();
  const deps = services();
  const initial = await deps.client.create(
    'title',
    [],
    new AbortController().signal,
  );
  const document = {
    ...initial.document,
    pages: [
      ...initial.document.pages,
      { ...initial.document.pages[0]!, page: 2, text: 'Segunda página' },
    ],
  };
  deps.client.create = () => Promise.resolve({ ...initial, document });
  const sample = await deps.example(
    'pt-BR',
    'scan',
    new AbortController().signal,
  );
  deps.example = () =>
    Promise.resolve({
      ...sample,
      document: {
        ...sample.document,
        pages: document.pages,
        previews: [
          ...sample.document.previews,
          { ...sample.document.previews[0]!, page: 2 },
        ],
      },
    });
  render(<DocumentApp services={deps} />);
  await user.click(
    screen.getByRole('button', { name: 'Experimentar um exemplo' }),
  );
  await user.click(
    await screen.findByRole('button', { name: 'Revisar texto' }),
  );
  await user.clear(screen.getByLabelText('Texto da página'));
  await user.type(
    screen.getByLabelText('Texto da página'),
    'Primeiro rascunho',
  );
  await user.selectOptions(screen.getByLabelText('Documento'), '2');
  expect(screen.getByLabelText('Texto da página')).toHaveValue(
    'Segunda página',
  );
  await user.type(screen.getByLabelText('Texto da página'), ' alterada');
  await user.selectOptions(screen.getByLabelText('Documento'), '1');
  expect(screen.getByLabelText('Texto da página')).toHaveValue(
    'Primeiro rascunho',
  );
  await user.click(screen.getByRole('button', { name: 'Perguntas' }));
  await user.click(screen.getByRole('button', { name: 'Texto' }));
  await user.click(screen.getByRole('button', { name: 'Revisar texto' }));
  expect(screen.getByLabelText('Texto da página')).toHaveValue(
    'Primeiro rascunho',
  );
  await user.selectOptions(screen.getByLabelText('Documento'), '2');
  expect(screen.getByLabelText('Texto da página')).toHaveValue(
    'Segunda página alterada',
  );
});
it('recovers a committed revision after a lost save response without deleting the session', async () => {
  const user = userEvent.setup();
  const deps = services();
  const original = await deps.client.create(
    'title',
    [],
    new AbortController().signal,
  );
  const saved = {
    document: {
      ...original.document,
      revision: 2,
      pages: [
        { ...original.document.pages[0]!, text: 'A oficina começa às 16h.' },
      ],
    },
    expiresAt: 100000,
  };
  const get = vi.fn(() => Promise.resolve(saved));
  Object.assign(deps.client, { get });
  deps.client.edit = () => Promise.reject(new TypeError('response lost'));
  deps.client.ask = vi.fn(deps.client.ask);
  render(<DocumentApp services={deps} />);
  await user.click(
    screen.getByRole('button', { name: 'Experimentar um exemplo' }),
  );
  await user.click(
    await screen.findByRole('button', { name: 'Revisar texto' }),
  );
  await user.clear(screen.getByLabelText('Texto da página'));
  await user.type(
    screen.getByLabelText('Texto da página'),
    saved.document.pages[0]!.text,
  );
  await user.click(screen.getByRole('button', { name: 'Salvar revisão' }));
  await vi.waitFor(() => expect(get).toHaveBeenCalled());
  expect(deps.client.remove).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Sua pergunta'), 'oficina');
  await user.click(
    screen.getByRole('button', { name: 'Perguntar ao documento' }),
  );
  expect(deps.client.ask).toHaveBeenCalledWith(
    original.token,
    2,
    'oficina',
    'demo',
    'pt-BR',
    expect.any(AbortSignal),
  );
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

it('preserves the draft and blocks questions until an uncertain revision can be recovered', async () => {
  const user = userEvent.setup();
  const deps = services();
  const saved = await deps.client.get('token', new AbortController().signal);
  const get = vi
    .fn()
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValue(saved);
  deps.client.get = get;
  deps.client.edit = () => Promise.reject(new TypeError('response lost'));
  render(<DocumentApp services={deps} />);
  await user.click(
    screen.getByRole('button', { name: 'Experimentar um exemplo' }),
  );
  await user.click(
    await screen.findByRole('button', { name: 'Revisar texto' }),
  );
  await user.clear(screen.getByLabelText('Texto da página'));
  await user.type(
    screen.getByLabelText('Texto da página'),
    'Rascunho preservado',
  );
  await user.click(screen.getByRole('button', { name: 'Salvar revisão' }));
  await screen.findByText(/Não foi possível confirmar a revisão salva/);
  await user.type(screen.getByLabelText('Sua pergunta'), 'oficina');
  expect(
    screen.getByRole('button', { name: 'Perguntar ao documento' }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Recuperar sessão' }));
  await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText('Texto da página')).toHaveValue(
    'Rascunho preservado',
  );
  expect(deps.client.remove).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Perguntar ao documento' }),
  ).toBeEnabled();
});
it('offers explicit walkthrough playback without starting a document session', async () => {
  const user = userEvent.setup();
  const dependencies = services();
  render(<DocumentApp services={dependencies} />);
  await user.click(screen.getByRole('button', { name: 'Ver demonstração' }));
  expect(
    screen.getByRole('button', { name: 'Pausar demonstração' }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Confira o texto' }));
  expect(
    screen.getByRole('button', { name: 'Continuar demonstração' }),
  ).toBeVisible();
  expect(screen.getByTestId('walkthrough-preview')).toHaveTextContent(
    'Transcrição',
  );
  expect(
    screen.queryByRole('heading', { name: 'Oficina criativa', level: 1 }),
  ).not.toBeInTheDocument();
});
it('offers enlargement of the original page and identifies the transcript', async () => {
  const user = userEvent.setup();
  render(<DocumentApp services={services()} />);
  await user.click(
    screen.getByRole('button', { name: 'Experimentar um exemplo' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Ampliar documento' }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Transcrição' }));
  expect(
    screen.getByRole('region', { name: 'Transcrição · página 1' }),
  ).toHaveTextContent('Oficina criativa');
});
