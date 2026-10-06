import { expect, it } from 'vitest';
import { createDocumentSessions } from './document-session.js';
const pages = [
  {
    page: 1,
    text: 'The workshop starts at 14:00. Bring an apron.',
    origin: 'embedded',
    uncertainties: [],
  },
];
it('isolates opaque tokens, copies input and invalidates old revisions', () => {
  const store = createDocumentSessions();
  const first = store.create('Workshop', pages);
  const second = store.create('Another', [
    { ...pages[0], text: 'Only the second document.' },
  ]);
  expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(first.token).not.toBe(second.token);
  expect(store.get(first.token).document.pages[0]!.text).toContain('14:00');
  expect(store.get(second.token).document.pages[0]!.text).toContain('second');
  expect(() => store.get('invalid')).toThrow();
  const updated = store.update(
    first.token,
    1,
    1,
    'The workshop starts at 16:00.',
  );
  expect(updated.document.revision).toBe(2);
  expect(updated.document.pages[0]!.origin).toBe('reviewed');
  expect(() => store.assertRevision(first.token, 1)).toThrow();
  expect(
    store.get(first.token).retriever.search('workshop starts 16:00')[0]!.chunk
      .provenance?.revision,
  ).toBe(2);
  expect(() => store.update(first.token, 1, 1, 'stale')).toThrow();
  store.delete(first.token);
  expect(() => store.get(first.token)).toThrow();
  expect(store.get(second.token).document.title).toBe('Another');
});
it('enforces inactivity expiry and frees capacity and content budgets', () => {
  let now = 0;
  const store = createDocumentSessions({
    now: () => now,
    maxSessions: 1,
    maxBytes: 500,
  });
  const first = store.create('Small', pages);
  expect(() => store.create('Second', pages)).toThrow();
  now = 29 * 60000;
  store.get(first.token);
  now = 31 * 60000;
  expect(store.get(first.token).document.title).toBe('Small');
  now += 30 * 60000;
  store.cleanup();
  expect(() => store.get(first.token)).toThrow();
  expect(store.create('After expiry', pages).token).toHaveLength(43);
  const limited = createDocumentSessions({ maxBytes: 30 });
  expect(() => limited.create('Large', pages)).toThrow();
});
it('rejects invalid and over-budget edits without replacing the prior revision', () => {
  const store = createDocumentSessions({ maxBytes: 500 });
  const session = store.create('Workshop', pages);
  expect(() => store.update(session.token, 1, 1, 'x'.repeat(40001))).toThrow();
  expect(() => store.update(session.token, 1, 1, 'x'.repeat(600))).toThrow();
  expect(() => store.update(session.token, 2, 1, 'unknown page')).toThrow();
  expect(store.get(session.token).document.revision).toBe(1);
  expect(() => store.create('Invalid', [])).toThrow();
  store.clear();
  expect(() => store.get(session.token)).toThrow();
});
