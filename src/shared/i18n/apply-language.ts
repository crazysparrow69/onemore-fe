import { i18n } from '@/shared/i18n';
import { storeLanguage, type Language } from '@/shared/i18n/language';

export async function applyLanguage(language: Language): Promise<void> {
  storeLanguage(language);
  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }
}
