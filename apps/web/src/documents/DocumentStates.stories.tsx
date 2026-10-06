import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ExampleLocale } from './examples.js';
import { documentExamples } from './examples.js';
import { workspaceMessages } from './product-copy.js';
import { DocumentHome } from './DocumentHome.js';
import { DocumentInput } from './DocumentInput.js';
import { DocumentNotice } from './DocumentNotice.js';
import { DocumentWorkspace } from './DocumentWorkspace.js';
import type { DocumentController } from './useDocumentSession.js';
import './workspace.css';
const noop = () => {};
function storyError(state: State) {
  const errors: Partial<Record<State, string>> = {
    expired: 'SESSION_EXPIRED',
    error: 'REQUEST_FAILED',
  };
  return errors[state];
}
type State =
  | 'home'
  | 'upload'
  | 'reading'
  | 'recognizing'
  | 'review'
  | 'answer'
  | 'abstained'
  | 'illegible'
  | 'error'
  | 'expired';
function DocumentState({
  state,
  locale,
}: {
  state: State;
  locale: ExampleLocale;
}) {
  const t = workspaceMessages[locale];
  const example = documentExamples(locale)[1]!;
  const text = state === 'illegible' ? '[illegible]' : example.text;
  const loaded = {
    document: {
      id: 'story',
      title: example.title,
      revision: 1,
      pages: [
        { page: 1, text, origin: 'reviewed' as const, uncertainties: [] },
      ],
    },
    local: {
      pages: [],
      previews: [{ page: 1, url: example.thumbnail, width: 600, height: 800 }],
      requiresRecognition: false,
      dispose: noop,
    },
    token: 'story',
    expiresAt: 0,
    example,
  };
  const answer = {
    mode: 'demo' as const,
    revision: 1,
    answer: text.split('\n')[1]!,
    abstained: state === 'abstained',
    evidence: [
      {
        chunk: {
          id: 'story:r1:p1:b1',
          documentId: 'story',
          title: example.title,
          section: 'Page 1',
          text,
          provenance: {
            page: 1,
            block: 1,
            revision: 1,
            origin: 'reviewed' as const,
          },
        },
        score: 0.8,
      },
    ],
    citations:
      state === 'abstained'
        ? []
        : [{ chunkId: 'story:r1:p1:b1', quote: text.split('\n')[1]! }],
    validation: {
      structure: true,
      references: true,
      quotes: true,
      semantic: 'not_verified' as const,
    },
  };
  const controller: DocumentController = {
    status: state === 'reading' || state === 'recognizing' ? state : 'ready',
    loaded,
    answer: state === 'answer' || state === 'abstained' ? answer : undefined,
    error: storyError(state),
    config: { llmAvailable: false, recognitionAvailable: true },
    clearError: noop,
    refresh: noop,
    upload: noop,
    home: noop,
    cancel: noop,
    example: noop,
    read: noop,
    ask: noop,
    edit: noop,
    recognize: noop,
  };
  return (
    <div lang={locale} className="shell">
      <DocumentNotice
        controller={controller}
        t={t}
        locale={locale}
        upload={noop}
      />
      {state === 'home' ? (
        <DocumentHome t={t} locale={locale} example={noop} upload={noop} />
      ) : state === 'upload' || state === 'reading' ? (
        <DocumentInput
          t={t}
          busy={state === 'reading'}
          read={noop}
          home={noop}
        />
      ) : (
        <DocumentWorkspace
          controller={controller}
          loaded={loaded}
          locale={locale}
          t={t}
          upload={noop}
        />
      )}
    </div>
  );
}
const meta = {
  title: 'Document workspace',
  component: DocumentState,
  args: { state: 'home', locale: 'pt-BR' },
  play: ({ canvasElement, args }) => {
    const t = workspaceMessages[args.locale];
    const text =
      args.state === 'review'
        ? t.editText
        : args.state === 'illegible'
          ? t.transcriptTab
          : undefined;
    if (text)
      [...canvasElement.querySelectorAll('button')]
        .find((button) => button.textContent === text)
        ?.click();
  },
  argTypes: {
    locale: { control: 'select', options: ['en', 'pt-BR', 'es'] },
    state: {
      control: 'select',
      options: [
        'home',
        'upload',
        'reading',
        'recognizing',
        'review',
        'answer',
        'abstained',
        'illegible',
        'error',
        'expired',
      ],
    },
  },
} satisfies Meta<typeof DocumentState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Home: Story = {};
export const Upload: Story = { args: { state: 'upload' } };
export const Reading: Story = { args: { state: 'reading' } };
export const Recognizing: Story = { args: { state: 'recognizing' } };
export const Review: Story = { args: { state: 'review' } };
export const Answer: Story = { args: { state: 'answer' } };
export const Abstained: Story = { args: { state: 'abstained' } };
export const Illegible: Story = { args: { state: 'illegible' } };
export const Error: Story = { args: { state: 'error' } };
export const Expired: Story = { args: { state: 'expired' } };
export const English: Story = { args: { locale: 'en', state: 'answer' } };
export const Spanish: Story = { args: { locale: 'es', state: 'answer' } };
