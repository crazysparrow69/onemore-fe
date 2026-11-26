import { describe, expect, it } from 'vitest';
import type { ExerciseDictionaries } from '@/entities/exercise/api/exercises.service';
import { buildLabels } from '@/entities/exercise/model/labels';

const dictionaries: ExerciseDictionaries = {
  locale: 'uk',
  muscleGroups: [
    {
      id: 'upper_body',
      label: 'Верх тіла',
      muscles: [{ id: 'chest', label: 'Груди', primaryOnly: false }],
    },
    {
      id: 'lower_body',
      label: 'Низ тіла',
      muscles: [{ id: 'calves', label: 'Литки', primaryOnly: false }],
    },
  ],
  equipment: [{ id: 'barbell', label: 'Штанга' }],
  types: [],
  categories: [{ id: 'strength', label: 'Силові' }],
  levels: [{ id: 'beginner', label: 'Початківець' }],
  forces: [{ id: 'push', label: 'Жим' }],
  mechanics: [{ id: 'compound', label: 'Базова' }],
};

describe('buildLabels', () => {
  it('finds labels across all muscle groups', () => {
    const labels = buildLabels(dictionaries);

    expect(labels.muscle('chest')).toBe('Груди');
    expect(labels.muscle('calves')).toBe('Литки');
    expect(labels.equipment('barbell')).toBe('Штанга');
    expect(labels.category('strength')).toBe('Силові');
    expect(labels.level('beginner')).toBe('Початківець');
    expect(labels.force('push')).toBe('Жим');
    expect(labels.mechanic('compound')).toBe('Базова');
  });

  it('falls back to the id for unknown values and before loading', () => {
    expect(buildLabels(dictionaries).muscle('wings')).toBe('wings');
    expect(buildLabels(undefined).equipment('cable')).toBe('cable');
  });
});
