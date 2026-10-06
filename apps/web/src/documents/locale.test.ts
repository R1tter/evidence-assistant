import { expect, it } from 'vitest';
import { chooseLocale } from './locale.js';
it('prefers the saved interface language and matches regional browser languages', () => {
  expect(chooseLocale('es', ['pt-BR'])).toBe('es');
  expect(chooseLocale(null, ['es-MX', 'en-US'])).toBe('es');
  expect(chooseLocale('invalid', ['pt-PT'])).toBe('pt-BR');
  expect(chooseLocale(null, ['fr-FR'])).toBe('en');
});
