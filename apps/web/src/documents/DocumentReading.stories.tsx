import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DocumentViewer, type DocumentView } from './DocumentViewer.js';
import { documentExamples, type ExampleLocale } from './examples.js';
import { workspaceMessages } from './product-copy.js';
import './workspace.css';
function ReadingStory({ locale = 'pt-BR' }: { locale: ExampleLocale }) {
  const t = workspaceMessages[locale];
  const example = documentExamples(locale)[1]!;
  const [pages, setPages] = useState([
    {
      page: 1,
      text: example.text.repeat(30),
      origin: 'reviewed' as const,
      uncertainties: [],
    },
    {
      page: 2,
      text: example.text,
      origin: 'reviewed' as const,
      uncertainties: [],
    },
  ]);
  const [number, setPage] = useState(1);
  const [view, setView] = useState<DocumentView>('compare');
  const passageRef = useRef<HTMLDivElement>(null);
  return (
    <div className="document-app">
      <div className="shell">
        <DocumentViewer
          t={t}
          provenance={t.demoLabel}
          pages={pages}
          previews={pages.map((page) => ({
            page: page.page,
            url: example.thumbnail,
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
            setPages(
              pages.map((page) =>
                page.page === number ? { ...page, text } : page,
              ),
            )
          }
          returnToQuestion={() => {}}
        />
      </div>
    </div>
  );
}
const meta = {
  title: 'Documents/Reading tools',
  component: ReadingStory,
  args: { locale: 'pt-BR' },
  argTypes: { locale: { control: 'select', options: ['pt-BR', 'en', 'es'] } },
} satisfies Meta<typeof ReadingStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Compare: Story = {};
