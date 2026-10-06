// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { App } from './App.js';
import type { AssistantClient } from './api.js';
import type { Answer } from '@evidence/core';

const answer: Answer = {
  mode: 'demo',
  answer: 'Source sentence.',
  abstained: false,
  citations: [{ chunkId: 'doc:section:1', quote: 'Source sentence.' }],
  evidence: [
    {
      chunk: {
        id: 'doc:section:1',
        documentId: 'doc',
        title: 'Original source',
        section: 'Section',
        text: 'Source sentence.',
      },
      score: 0.6,
    },
  ],
  validation: {
    structure: true,
    references: true,
    quotes: true,
    semantic: 'not_verified',
  },
};
function client(): AssistantClient {
  return {
    config: () => Promise.resolve({ llmAvailable: false }),
    ask: () => Promise.resolve(answer),
    document: () =>
      Promise.resolve({
        id: 'doc',
        title: 'Original source',
        content: 'Source sentence.',
      }),
  };
}
afterEach(cleanup);
describe('accessible assistant', () => {
  it('changes interface locale without erasing the question', async () => {
    const user = userEvent.setup();
    render(<App client={client()} />);
    await user.type(screen.getByRole('textbox'), 'My question');
    await user.selectOptions(screen.getByRole('combobox'), 'pt-BR');
    expect(screen.getByRole('textbox')).toHaveValue('My question');
    expect(
      screen.getByRole('button', { name: 'Consultar a coleção' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('pt-BR');
    await user.selectOptions(screen.getByRole('combobox'), 'es');
    expect(
      screen.getByRole('button', { name: 'Consultar la colección' }),
    ).toBeInTheDocument();
  });
  it('disables unavailable AI and renders source inspection', async () => {
    const user = userEvent.setup();
    render(<App client={client()} />);
    await waitFor(() =>
      expect(screen.getByLabelText('AI · generated answers')).toBeDisabled(),
    );
    await user.type(screen.getByRole('textbox'), 'evidence');
    await user.click(
      screen.getByRole('button', { name: 'Ask the collection' }),
    );
    expect(
      await screen.findByText('Source sentence.', { selector: '.answer-text' }),
    ).toBeInTheDocument();
    await user.click(screen.getByText('Read original document'));
    expect(
      await screen.findByText('Source sentence.', { selector: 'pre' }),
    ).toBeInTheDocument();
  });
  it('announces abstention and hides unsafe failure details', async () => {
    const user = userEvent.setup();
    const api = client();
    api.ask = vi
      .fn()
      .mockResolvedValueOnce({
        ...answer,
        abstained: true,
        answer: 'abstain',
        citations: [],
        evidence: [],
      })
      .mockRejectedValueOnce(new Error('secret provider detail'));
    render(<App client={api} />);
    await user.type(screen.getByRole('textbox'), 'unsupported');
    await user.click(
      screen.getByRole('button', { name: 'Ask the collection' }),
    );
    expect(
      await screen.findByText(
        'The collection does not contain enough evidence to answer this question.',
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Ask the collection' }),
    );
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/secret provider detail/),
    ).not.toBeInTheDocument();
  });
  it('preserves input, exposes cancel and ignores a stale result', async () => {
    const user = userEvent.setup();
    let resolveFirst: ((value: Answer) => void) | undefined;
    const api = client();
    api.ask = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Answer>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({ ...answer, answer: 'Latest answer' });
    render(<App client={api} />);
    await user.type(screen.getByRole('textbox'), 'question');
    await user.click(
      screen.getByRole('button', { name: 'Ask the collection' }),
    );
    expect(
      screen.getByRole('button', { name: 'Ask the collection' }),
    ).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(
      screen.getByRole('button', { name: 'Ask the collection' }),
    );
    expect(await screen.findByText('Latest answer')).toBeInTheDocument();
    resolveFirst?.({ ...answer, answer: 'Stale answer' });
    await waitFor(() =>
      expect(screen.queryByText('Stale answer')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('textbox')).toHaveValue('question');
  });
});
