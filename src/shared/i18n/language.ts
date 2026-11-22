export const LANGUAGES = ['en', 'uk'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'onemore.language';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value);
}

export function detectLanguage(browserLanguage: string): Language {
  return browserLanguage.toLowerCase().startsWith('uk') ? 'uk' : 'en';
}

export function readStoredLanguage(): Language | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeLanguage(language: Language): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    return;
  }
}
