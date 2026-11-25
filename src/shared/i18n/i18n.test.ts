import { describe, expect, it } from 'vitest';
import { i18n } from '@/shared/i18n';
import { LANGUAGES } from '@/shared/i18n/language';
import en from '@/shared/i18n/locales/en.json';

const localeModules = import.meta.glob<{ default: unknown }>(
  './locales/*.json',
  { eager: true },
);

function leafKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return prefix.length > 0 ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix.length > 0 ? `${prefix}.${key}` : key),
  );
}

describe('i18n', () => {
  it('uses Ukrainian and sets the document language', () => {
    expect(i18n.language).toBe('uk');
    expect(document.documentElement.lang).toBe('uk');
  });

  it('has a locale file for every language and no extra files', () => {
    const files = Object.keys(localeModules)
      .map((path) => path.replace('./locales/', '').replace('.json', ''))
      .sort();
    expect(files).toEqual([...LANGUAGES].sort());
  });

  it.each(LANGUAGES)('gives %s the same keys as English', (language) => {
    const locale = localeModules[`./locales/${language}.json`]?.default;
    expect(leafKeys(locale).sort()).toEqual(leafKeys(en).sort());
  });
});
