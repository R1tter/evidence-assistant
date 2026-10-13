export function synchronizeScroll(
  source: HTMLElement,
  target: HTMLElement | null,
  pending: WeakMap<HTMLElement, number>,
) {
  const expected = pending.get(source);
  pending.delete(source);
  if (expected !== undefined && Math.abs(source.scrollTop - expected) < 0.5)
    return;
  if (!target) return;
  const range = source.scrollHeight - source.clientHeight;
  if (range <= 0) return;
  const position =
    (source.scrollTop / range) *
    Math.max(0, target.scrollHeight - target.clientHeight);
  if (Math.abs(target.scrollTop - position) <= 1) return;
  target.scrollTop = position;
  // Native scroll events arrive later; consume our own event instead of
  // feeding its old position back into a pane the visitor has since moved.
  pending.set(target, target.scrollTop);
}
