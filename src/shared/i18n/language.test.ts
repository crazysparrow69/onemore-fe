import { afterEach, describe, expect, it } from 'vitest';
import {
  detectLanguage,
  isLanguage,
  readStoredLanguage,
  storeLanguage,
} from '@/shared/i18n/language';

describe('language', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('detects Ukrainian browsers and defaults to English', () => {
    expect(detectLanguage('uk')).toBe('uk');
    expect(detectLanguage('uk-UA')).toBe('uk');
    expect(detectLanguage('en-US')).toBe('en');
    expect(detectLanguage('ru-RU')).toBe('en');
  });

  it('knows the supported languages', () => {
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('uk')).toBe(true);
    expect(isLanguage('ru')).toBe(false);
    expect(isLanguage(null)).toBe(false);
  });

  it('remembers the last language and ignores a bad stored value', () => {
    expect(readStoredLanguage()).toBeNull();
    storeLanguage('en');
    expect(readStoredLanguage()).toBe('en');
    window.localStorage.setItem('onemore.language', 'xx');
    expect(readStoredLanguage()).toBeNull();
  });
});
