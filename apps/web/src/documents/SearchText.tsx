import { useEffect, useRef } from 'react';
import type { TextMatch } from './document-search.js';
export function SearchText({
  text,
  matches,
  active,
}: {
  text: string;
  matches: TextMatch[];
  active: TextMatch | undefined;
}) {
  const selected = useRef<HTMLElement>(null);
  useEffect(() => {
    selected.current?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
  }, [active?.page, active?.start, text]);
  const parts = matches.map((match, index) => {
    const prefix = text.slice(matches[index - 1]?.end ?? 0, match.start);
    const current = match.page === active?.page && match.start === active.start;
    return (
      <span key={match.start}>
        {prefix}
        <mark
          ref={current ? selected : undefined}
          aria-current={current ? 'true' : undefined}
        >
          {text.slice(match.start, match.end)}
        </mark>
      </span>
    );
  });
  return (
    <>
      {parts}
      {text.slice(matches.at(-1)?.end ?? 0)}
    </>
  );
}
