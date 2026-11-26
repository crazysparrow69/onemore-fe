import type { CatalogFilters } from '@/entities/exercise/model/catalog-search';
import type { Language } from '@/shared/i18n/language';

export const exercisesKeys = {
  all: ['exercises'] as const,
  lists: (language: Language) =>
    [...exercisesKeys.all, 'list', language] as const,
  list: (language: Language, filters: CatalogFilters) =>
    [...exercisesKeys.lists(language), filters] as const,
  counts: () => [...exercisesKeys.all, 'count'] as const,
  count: (language: Language, filters: CatalogFilters) =>
    [...exercisesKeys.all, 'count', language, filters] as const,
  detail: (language: Language, id: string) =>
    [...exercisesKeys.all, 'detail', language, id] as const,
  dictionaries: (language: Language) =>
    [...exercisesKeys.all, 'dictionaries', language] as const,
};
