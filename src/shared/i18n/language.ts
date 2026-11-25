export const LANGUAGE_NAMES = {
  en: 'English',
  uk: 'Українська',
} as const;

export type Language = keyof typeof LANGUAGE_NAMES;

export const LANGUAGES = Object.keys(LANGUAGE_NAMES) as [
  Language,
  ...Language[],
];

const FALLBACK_LANGUAGE: Language = 'en';

const STORAGE_KEY = 'onemore.language';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value);
}

export function detectLanguage(browserLanguage: string): Language {
  const code = browserLanguage.toLowerCase().split('-')[0];
  return LANGUAGES.find((language) => language === code) ?? FALLBACK_LANGUAGE;
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
