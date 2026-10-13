// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { DocumentViewer, type DocumentView } from './DocumentViewer.js';
import { workspaceMessages } from './product-copy.js';
const pages = [
  {
    page: 1,
    text: 'Oficina às 14h.',
    origin: 'reviewed' as const,
    uncertainties: [],
  },
  {
    page: 2,
    text: 'Outra oficina. Oficina às 16h.',
    origin: 'reviewed' as const,
    uncertainties: [],
  },
];
function Reader() {
  const [number, setPage] = useState(1);
  const [view, setView] = useState<DocumentView>('original');
  const [current, setPages] = useState(pages);
  const passageRef = useRef<HTMLDivElement>(null);
  return (
    <DocumentViewer
      provenance="Exemplo"
      t={workspaceMessages['pt-BR']}
      pages={current}
      previews={pages.map((p) => ({
        page: p.page,
        url: '/page.png',
        width: 600,
        height: 800,
      }))}
      number={number}
      view={view}
      busy={false}
      passage={undefined}
      passageRef={passageRef}
      onPage={setPage}
      onView={setView}
      save={(text) =>
        setPages(current.map((p) => (p.page === number ? { ...p, text } : p)))
      }
      returnToQuestion={() => {}}
    />
  );
}
afterEach(cleanup);
it('searches across pages, cycles results and clears highlights', async () => {
  const user = userEvent.setup();
  render(<Reader />);
  await user.type(
    screen.getByRole('searchbox', { name: 'Buscar no documento' }),
    'oficina',
  );
  expect(screen.getByRole('status')).toHaveTextContent('1 de 3');
  await user.click(screen.getByRole('button', { name: 'Próximo resultado' }));
  expect(screen.getByLabelText('Documento')).toHaveValue('2');
  expect(document.querySelector('mark[aria-current="true"]')).toHaveTextContent(
    'oficina',
  );
  await user.click(screen.getByRole('button', { name: 'Resultado anterior' }));
  expect(screen.getByLabelText('Documento')).toHaveValue('1');
  await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
  expect(document.querySelector('mark')).toBeNull();
});
it('preserves drafts through comparison and searches the saved revision', async () => {
  const user = userEvent.setup();
  render(<Reader />);
  await user.click(screen.getByRole('button', { name: 'Revisar texto' }));
  await user.clear(screen.getByLabelText('Texto da página'));
  await user.type(screen.getByLabelText('Texto da página'), 'Novo horário');
  await user.click(screen.getByRole('button', { name: 'Comparar' }));
  expect(
    screen.getByRole('checkbox', { name: 'Vincular rolagem' }),
  ).not.toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Revisar texto' }));
  expect(screen.getByLabelText('Texto da página')).toHaveValue('Novo horário');
  await user.click(screen.getByRole('button', { name: 'Salvar revisão' }));
  await user.type(screen.getByRole('searchbox'), 'horário');
  expect(screen.getByRole('status')).toHaveTextContent('1 de 1');
  expect(document.querySelector('mark')).toHaveTextContent('horário');
});
it('reveals the active page after a saved revision invalidates the search selection', async () => {
  const user = userEvent.setup();
  render(<Reader />);
  await user.type(screen.getByRole('searchbox'), 'oficina');
  await user.click(screen.getByRole('button', { name: 'Próximo resultado' }));
  await user.click(screen.getByRole('button', { name: 'Revisar texto' }));
  await user.clear(screen.getByLabelText('Texto da página'));
  await user.type(
    screen.getByLabelText('Texto da página'),
    'Sem resultados aqui',
  );
  await user.click(screen.getByRole('button', { name: 'Salvar revisão' }));
  expect(screen.getByLabelText('Documento')).toHaveValue('1');
  expect(document.querySelector('mark[aria-current="true"]')).toHaveTextContent(
    'Oficina',
  );
});
