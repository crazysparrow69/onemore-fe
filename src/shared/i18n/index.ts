import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/shared/i18n/locales/en.json';
import { LANGUAGES, readStoredLanguage } from '@/shared/i18n/language';

export const i18n = i18next;

const localeModules = import.meta.glob<{ default: typeof en }>(
  './locales/*.json',
  { eager: true },
);

const resources = Object.fromEntries(
  LANGUAGES.map((language) => [
    language,
    { translation: localeModules[`./locales/${language}.json`]?.default ?? en },
  ]),
);

function setDocumentLanguage(language: string) {
  document.documentElement.lang = language;
}

void i18n.use(initReactI18next).init({
  lng: readStoredLanguage() ?? 'uk',
  fallbackLng: 'en',
  resources,
  interpolation: { escapeValue: false },
  initAsync: false,
});

setDocumentLanguage(i18n.language);
i18n.on('languageChanged', setDocumentLanguage);
