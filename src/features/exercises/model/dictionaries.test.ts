import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@/shared/i18n/language';
import {
  CATEGORIES,
  EQUIPMENT,
  EXERCISE_TYPES,
  FORCES,
  LEVELS,
  MECHANICS,
  MUSCLES,
} from '@/features/exercises/model/dictionaries';

const localeModules = import.meta.glob<{
  default: { exercises: Record<string, Record<string, unknown>> };
}>('@/shared/i18n/locales/*.json', { eager: true });

const DICTIONARIES = [
  ['muscles', MUSCLES],
  ['equipment', EQUIPMENT],
  ['types', EXERCISE_TYPES],
  ['categories', CATEGORIES],
  ['levels', LEVELS],
  ['forces', FORCES],
  ['mechanics', MECHANICS],
] as const;

const ALIASED = [
  ['muscleAliases', MUSCLES],
  ['equipmentAliases', EQUIPMENT],
] as const;

function exercisesOf(language: string) {
  const module = Object.entries(localeModules).find(([path]) =>
    path.endsWith(`/${language}.json`),
  )?.[1];
  if (!module) {
    throw new Error(`No locale file for ${language}`);
  }
  return module.default.exercises;
}

describe.each(LANGUAGES)('exercise dictionaries (%s)', (language) => {
  const exercises = exercisesOf(language);

  it.each(DICTIONARIES)(
    'labels every %s slug and nothing else',
    (key, slugs) => {
      const labels = exercises[key] ?? {};
      expect(Object.keys(labels).sort()).toEqual([...slugs].sort());
      for (const label of Object.values(labels)) {
        expect(typeof label === 'string' && label.trim().length > 0).toBe(true);
      }
    },
  );

  it.each(ALIASED)('has search aliases for every slug in %s', (key, slugs) => {
    const aliases = exercises[key] ?? {};
    expect(Object.keys(aliases).sort()).toEqual([...slugs].sort());
    for (const list of Object.values(aliases)) {
      expect(Array.isArray(list) && list.length > 0).toBe(true);
    }
  });
});
