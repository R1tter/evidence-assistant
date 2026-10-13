import type { DocumentMessages } from './messages.js';
import type { TextMatch } from './document-search.js';
export function DocumentSearch({
  t,
  query,
  count,
  index,
  active,
  change,
  move,
}: {
  t: DocumentMessages;
  query: string;
  count: number;
  index: number;
  active: TextMatch | undefined;
  change(this: void, query: string): void;
  move(this: void, direction: number): void;
}) {
  return (
    <div
      role="search"
      className="document-search"
      aria-label={t.searchDocument}
    >
      <label>
        {t.searchDocument}
        <input
          type="search"
          maxLength={200}
          value={query}
          onChange={(event) => change(event.target.value)}
          aria-describedby="document-search-help"
        />
      </label>
      <div className="actions">
        <button disabled={!count} onClick={() => move(-1)}>
          {t.previousMatch}
        </button>
        <button disabled={!count} onClick={() => move(1)}>
          {t.nextMatch}
        </button>
        <button disabled={!query} onClick={() => change('')}>
          {t.clearSearch}
        </button>
      </div>
      <p role="status">
        {query.trim()
          ? count
            ? t.searchCount
                .replace('{current}', String(index + 1))
                .replace('{total}', String(count)) +
              ` · ${t.pageLabel} ${active!.page}`
            : t.noSearchResults
          : t.searchPrompt}
      </p>
      <p id="document-search-help" className="help">
        {t.searchHelp}
      </p>
    </div>
  );
}
