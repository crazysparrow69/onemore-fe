import { describe, expect, it } from 'vitest';
import { i18n } from '@/shared/i18n';

describe('i18n', () => {
  it('resolves the home title and sets the document language', () => {
    expect(i18n.t('home.title')).toBe('onemore');
    expect(document.documentElement.lang).toBe('en');
  });
});
