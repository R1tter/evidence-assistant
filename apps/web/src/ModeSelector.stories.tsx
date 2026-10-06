import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModeSelector } from './components.js';
import { messages } from './locales.js';
const meta = {
  component: ModeSelector,
  args: { mode: 'demo', available: true, onChange: () => {}, t: messages.en },
} satisfies Meta<typeof ModeSelector>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Available: Story = {};
export const Unavailable: Story = { args: { available: false } };
