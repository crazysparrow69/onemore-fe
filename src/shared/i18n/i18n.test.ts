import { describe, expect, it } from 'vitest';
import { i18n } from '@/shared/i18n';
import en from '@/shared/i18n/locales/en.json';
import uk from '@/shared/i18n/locales/uk.json';

function leafKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return prefix.length > 0 ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix.length > 0 ? `${prefix}.${key}` : key;
    return typeof child === 'object' && child !== null
      ? leafKeys(child, path)
      : [path];
  });
}

describe('i18n', () => {
  it('uses Ukrainian and sets the document language', () => {
    expect(i18n.language).toBe('uk');
    expect(document.documentElement.lang).toBe('uk');
  });

  it('gives Ukrainian the same keys as English', () => {
    expect(leafKeys(uk).sort()).toEqual(leafKeys(en).sort());
  });
});
