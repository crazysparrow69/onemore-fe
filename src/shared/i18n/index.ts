import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/shared/i18n/locales/en.json';
import uk from '@/shared/i18n/locales/uk.json';

export const i18n = i18next;

function setDocumentLanguage(language: string) {
  document.documentElement.lang = language;
}

void i18n.use(initReactI18next).init({
  lng: 'uk',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    uk: { translation: uk },
  },
  interpolation: { escapeValue: false },
  initAsync: false,
});

setDocumentLanguage(i18n.language);
i18n.on('languageChanged', setDocumentLanguage);
