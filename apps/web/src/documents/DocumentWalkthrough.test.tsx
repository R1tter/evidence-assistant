// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DocumentWalkthrough } from './DocumentWalkthrough.js';
import { documentExamples } from './examples.js';
import { workspaceMessages } from './product-copy.js';
afterEach(cleanup);
it('manual chapters pause playback and replay explicitly returns to the beginning', () => {
  render(
    <DocumentWalkthrough
      t={workspaceMessages['pt-BR']}
      example={documentExamples('pt-BR')[1]!}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Confira o texto' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Continuar demonstração' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Pausar demonstração' }));
  expect(
    screen.getByRole('button', { name: 'Confira o texto' }),
  ).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Pergunte e compare' }));
  expect(screen.getByTestId('demo-answer')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Repetir demonstração' }));
  expect(
    screen.getByRole('button', { name: 'Traga seu documento' }),
  ).toHaveAttribute('aria-pressed', 'true');
});
