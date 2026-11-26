import { describe, expect, it } from 'vitest';
import type { ExerciseDetails } from '@/entities/exercise/api/exercises.service';
import {
  emptyFormValues,
  exerciseFormSchema,
  fieldsOfDetails,
  formValuesOf,
  isDirty,
  toInput,
} from '@/features/exercises/model/exercise-form';

const details: ExerciseDetails = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Hammer press',
  type: 'weight_reps',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'machine',
  image: null,
  custom: true,
  imageKeys: [],
  category: null,
  force: null,
  mechanic: null,
  level: null,
  instructions: ['Sit down', 'Press'],
  typeLocked: false,
};

describe('exercise form model', () => {
  it('starts empty with bodyweight equipment and an optional name', () => {
    expect(emptyFormValues()).toEqual({
      name: '',
      type: '',
      primary: [],
      secondary: [],
      equipment: 'none',
      steps: '',
    });
    expect(emptyFormValues('Row').name).toBe('Row');
  });

  it('can save only with a name, a type and a primary muscle', () => {
    const values = {
      ...emptyFormValues(),
      name: 'Row',
      type: 'weight_reps',
      primary: ['lats'],
    };

    const valid = (candidate: typeof values) =>
      exerciseFormSchema.safeParse(candidate).success;

    expect(valid(values)).toBe(true);
    expect(valid({ ...values, name: '   ' })).toBe(false);
    expect(valid({ ...values, type: '' })).toBe(false);
    expect(valid({ ...values, primary: [] })).toBe(false);
  });

  it('round-trips an exercise through the form', () => {
    const values = formValuesOf(details);

    expect(values).toEqual({
      name: 'Hammer press',
      type: 'weight_reps',
      primary: ['chest'],
      secondary: ['triceps'],
      equipment: 'machine',
      steps: 'Sit down\nPress',
    });
    expect(toInput(values)).toEqual({
      name: 'Hammer press',
      type: 'weight_reps',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      equipment: 'machine',
      instructions: ['Sit down', 'Press'],
    });
  });

  it('drops blank lines from the steps', () => {
    const values = { ...formValuesOf(details), steps: 'One\n\n  \nTwo\n' };

    expect(toInput(values).instructions).toEqual(['One', 'Two']);
  });

  it('detects changes against the initial values', () => {
    const initial = formValuesOf(details);

    expect(isDirty(initial, initial)).toBe(false);
    expect(isDirty({ name: 'Other' }, initial)).toBe(true);
    expect(isDirty({ secondary: [] }, initial)).toBe(true);
  });

  it('maps backend issue paths to form fields', () => {
    expect(
      fieldsOfDetails([
        { path: 'name', message: 'x' },
        { path: 'primaryMuscles.0', message: 'x' },
        { path: 'primaryMuscles.1', message: 'x' },
        { path: 'instructions.3', message: 'x' },
        { path: 'unknown', message: 'x' },
      ]),
    ).toEqual(['name', 'primary', 'steps']);
    expect(fieldsOfDetails('nope')).toEqual([]);
    expect(fieldsOfDetails(undefined)).toEqual([]);
  });
});
