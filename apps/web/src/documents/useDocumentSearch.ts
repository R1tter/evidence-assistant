import { useEffect, useEffectEvent, useState } from 'react';
import { searchPages } from './document-search.js';
import type { DocumentView } from './DocumentViewer.js';
export function useDocumentSearch(
  pages: readonly { page: number; text: string }[],
  jump: (page: number) => void,
  view: DocumentView,
  onView: (view: DocumentView) => void,
  onReveal: () => void,
) {
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState({ key: '', index: 0 });
  const key = JSON.stringify([query, pages]);
  const matches = searchPages(pages, query);
  const index =
    selection.key === key
      ? Math.min(selection.index, Math.max(0, matches.length - 1))
      : 0;
  const active = matches[index];
  const reveal = (page: number) => {
    onReveal();
    jump(page);
    onView(view === 'compare' ? 'compare' : 'text');
  };
  const revision = JSON.stringify(pages);
  const revealRevision = useEffectEvent(() => {
    if (active) reveal(active.page);
  });
  useEffect(() => {
    revealRevision();
  }, [revision]);
  const change = (value: string) => {
    setQuery(value);
    setSelection({ key: '', index: 0 });
    const first = searchPages(pages, value)[0];
    if (first) reveal(first.page);
  };
  const move = (direction: number) => {
    if (!matches.length) return;
    const next = (index + direction + matches.length) % matches.length;
    setSelection({ key, index: next });
    reveal(matches[next]!.page);
  };
  return { query, matches, index, active, change, move };
}
