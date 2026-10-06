import { expect, it } from 'vitest';
import { documentExamples } from './examples.js';
it('offers three original prepared examples for each interface locale', () => {
  for (const locale of ['en', 'pt-BR', 'es'] as const) {
    const examples = documentExamples(locale);
    expect(examples).toHaveLength(3);
    expect(examples.map((example) => example.kind)).toEqual([
      'manual',
      'scan',
      'note',
    ]);
    for (const example of examples) {
      expect(example.locale).toBe(locale);
      expect(example.questions).toHaveLength(3);
      expect(example.text.trim().length).toBeGreaterThan(50);
      expect(example.prepared).toBe(true);
      expect(example.file).toContain(`/examples/${locale}/`);
    }
  }
});
