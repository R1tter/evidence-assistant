export interface TextMatch {
  page: number;
  start: number;
  end: number;
}
export function searchPages(
  pages: readonly { page: number; text: string }[],
  query: string,
): TextMatch[] {
  const term = query.trim();
  if (!term) return [];
  const pattern = new RegExp(
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'giu',
  );
  return pages.flatMap((page) =>
    [...page.text.matchAll(pattern)].map((match) => ({
      page: page.page,
      start: match.index,
      end: match.index + match[0].length,
    })),
  );
}
