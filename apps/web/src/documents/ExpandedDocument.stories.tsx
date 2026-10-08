import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ExampleLocale } from './examples.js';
import { documentExamples } from './examples.js';
import { workspaceMessages } from './product-copy.js';
import { ExpandedDocument } from './ExpandedDocument.js';
import './workspace.css';
function ViewerStory({ locale }: { locale: ExampleLocale }) {
  const [open, setOpen] = useState(true);
  const t = workspaceMessages[locale];
  return (
    <div className="document-app">
      <button onClick={() => setOpen(true)}>{t.enlarge}</button>
      {open && (
        <ExpandedDocument
          t={t}
          preview={{
            page: 1,
            url: documentExamples(locale)[2]!.thumbnail,
            width: 600,
            height: 800,
          }}
          close={() => setOpen(false)}
        />
      )}
    </div>
  );
}
const meta = {
  title: 'Documents/ExpandedDocument',
  component: ViewerStory,
  args: { locale: 'pt-BR' },
  argTypes: { locale: { control: 'select', options: ['en', 'pt-BR', 'es'] } },
} satisfies Meta<typeof ViewerStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Original: Story = {};
