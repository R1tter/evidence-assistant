import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnswerPanel } from './components.js';
import { messages } from './locales.js';
const meta = {
  component: AnswerPanel,
  args: { t: messages.en, retry: () => {} },
} satisfies Meta<typeof AnswerPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Initial: Story = { args: { state: { status: 'idle' } } };
export const Loading: Story = { args: { state: { status: 'loading' } } };
export const Error: Story = { args: { state: { status: 'error' } } };
const answer = {
  mode: 'demo' as const,
  answer: 'Exact sentence from the original source.',
  abstained: false,
  citations: [],
  evidence: [],
  validation: {
    structure: true,
    references: true,
    quotes: true,
    semantic: 'not_verified' as const,
  },
};
export const Answered: Story = {
  args: { state: { status: 'success', answer } },
};
export const Abstained: Story = {
  args: {
    state: { status: 'success', answer: { ...answer, abstained: true } },
  },
};
export const LongAnswer: Story = {
  args: {
    state: {
      status: 'success',
      answer: {
        ...answer,
        answer: 'An original source sentence. '.repeat(100),
      },
    },
  },
};
