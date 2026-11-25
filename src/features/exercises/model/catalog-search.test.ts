import { describe, expect, it } from 'vitest';
import {
  filtersFromSearch,
  hasFilters,
  joinIds,
  splitIds,
  validateCatalogSearch,
  validateNewExerciseSearch,
} from '@/features/exercises/model/catalog-search';

describe('validateCatalogSearch', () => {
  it('keeps a trimmed query and known ids', () => {
    expect(
      validateCatalogSearch({
        q: '  bench  ',
        muscle: 'chest,triceps',
        equipment: 'barbell,dumbbell',
      }),
    ).toEqual({
      q: 'bench',
      muscle: 'chest,triceps',
      equipment: 'barbell,dumbbell',
      mine: undefined,
    });
  });

  it('drops unknown ids, duplicates and empty values', () => {
    expect(
      validateCatalogSearch({
        q: '   ',
        muscle: 'chest,wings,chest',
        equipment: 'unknown',
      }),
    ).toEqual({
      q: undefined,
      muscle: 'chest',
      equipment: undefined,
      mine: undefined,
    });
  });

  it('turns a numeric query into text and ignores other types', () => {
    expect(validateCatalogSearch({ q: 90 }).q).toBe('90');
    expect(validateCatalogSearch({ q: ['a'], muscle: 5 })).toEqual({
      q: undefined,
      muscle: undefined,
      equipment: undefined,
      mine: undefined,
    });
  });

  it('keeps mine only when it is switched on', () => {
    expect(validateCatalogSearch({ mine: true }).mine).toBe(true);
    expect(validateCatalogSearch({ mine: 'true' }).mine).toBe(true);
    expect(validateCatalogSearch({ mine: false }).mine).toBeUndefined();
    expect(validateCatalogSearch({ mine: 1 }).mine).toBeUndefined();
  });

  it('keeps a trimmed name for a new exercise', () => {
    expect(validateNewExerciseSearch({ name: '  Hammer  ' })).toEqual({
      name: 'Hammer',
    });
    expect(validateNewExerciseSearch({ name: ' ' })).toEqual({
      name: undefined,
    });
  });

  it('cuts a query longer than the backend allows', () => {
    expect(validateCatalogSearch({ q: 'a'.repeat(150) }).q).toHaveLength(100);
  });
});

describe('ids helpers', () => {
  it('splits and joins ids', () => {
    expect(splitIds('chest,lats')).toEqual(['chest', 'lats']);
    expect(splitIds(undefined)).toEqual([]);
    expect(joinIds(['chest', 'lats'])).toBe('chest,lats');
    expect(joinIds([])).toBeUndefined();
  });

  it('builds filters from the search and detects active ones', () => {
    const empty = filtersFromSearch({});
    expect(empty).toEqual({ q: '', muscle: [], equipment: [], mine: false });
    expect(hasFilters(empty)).toBe(false);
    expect(hasFilters(filtersFromSearch({ mine: true }))).toBe(true);
    expect(hasFilters(filtersFromSearch({ equipment: 'cable' }))).toBe(true);
    expect(hasFilters(filtersFromSearch({ q: 'row' }))).toBe(true);
  });
});
