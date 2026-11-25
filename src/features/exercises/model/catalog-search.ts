export const MUSCLE_IDS = [
  'chest',
  'lats',
  'upper_back',
  'lower_back',
  'traps',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abdominals',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
  'abductors',
  'neck',
  'full_body',
  'cardio',
  'other',
] as const;

export const EQUIPMENT_IDS = [
  'none',
  'barbell',
  'ez_bar',
  'trap_bar',
  'dumbbell',
  'kettlebell',
  'plate',
  'machine',
  'cable',
  'smith_machine',
  'suspension',
  'band',
  'medicine_ball',
  'exercise_ball',
  'foam_roll',
  'other',
] as const;

export const SEARCH_MAX_LENGTH = 100;

export interface CatalogSearch {
  q?: string;
  muscle?: string;
  equipment?: string;
  mine?: boolean;
}

export interface CatalogFilters {
  q: string;
  muscle: string[];
  equipment: string[];
  mine: boolean;
}

function parseText(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }
  const text = String(value).trim().slice(0, SEARCH_MAX_LENGTH);
  return text.length > 0 ? text : undefined;
}

function parseIds(
  value: unknown,
  allowed: readonly string[],
): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const ids = value
    .split(',')
    .filter(
      (id, index, all) => allowed.includes(id) && all.indexOf(id) === index,
    );
  return ids.length > 0 ? ids.join(',') : undefined;
}

export function validateNewExerciseSearch(search: Record<string, unknown>): {
  name?: string;
} {
  return { name: parseText(search.name) };
}

export function validateCatalogSearch(
  search: Record<string, unknown>,
): CatalogSearch {
  return {
    q: parseText(search.q),
    muscle: parseIds(search.muscle, MUSCLE_IDS),
    equipment: parseIds(search.equipment, EQUIPMENT_IDS),
    mine: search.mine === true || search.mine === 'true' ? true : undefined,
  };
}

export function splitIds(value: string | undefined): string[] {
  return value ? value.split(',').filter((id) => id.length > 0) : [];
}

export function joinIds(ids: readonly string[]): string | undefined {
  return ids.length > 0 ? ids.join(',') : undefined;
}

export function filtersFromSearch(search: CatalogSearch): CatalogFilters {
  return {
    q: search.q ?? '',
    muscle: splitIds(search.muscle),
    equipment: splitIds(search.equipment),
    mine: search.mine === true,
  };
}

export function hasFilters(filters: CatalogFilters): boolean {
  return (
    filters.q.length > 0 ||
    filters.muscle.length > 0 ||
    filters.equipment.length > 0 ||
    filters.mine
  );
}
