import type { ExampleLocale } from './examples.js';
const preferenceKey = 'evidence-interface-locale';
export function chooseLocale(
  saved: string | null,
  languages: readonly string[],
): ExampleLocale {
  if (saved === 'en' || saved === 'pt-BR' || saved === 'es') return saved;
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'en' || base === 'es') return base;
  }
  return 'en';
}
export function initialLocale(): ExampleLocale {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(preferenceKey);
  } catch {
    /* Storage can be disabled. */
  }
  return chooseLocale(saved, navigator.languages);
}
export function persistLocale(locale: ExampleLocale): void {
  try {
    localStorage.setItem(preferenceKey, locale);
  } catch {
    /* The current session still uses the chosen language. */
  }
}
