import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from '@/shared/i18n/locales/en';

export const i18n = i18next;

function setDocumentLanguage(language: string) {
  document.documentElement.lang = language;
}

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
  initAsync: false,
});

setDocumentLanguage(i18n.language);
i18n.on('languageChanged', setDocumentLanguage);
