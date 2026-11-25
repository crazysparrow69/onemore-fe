import { describe, expect, it } from 'vitest';
import type { ExerciseDetails } from '@/features/exercises/api/exercises.service';
import {
  canSave,
  emptyFormValues,
  errorsOfDetails,
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

    expect(canSave(values)).toBe(true);
    expect(canSave({ ...values, name: '   ' })).toBe(false);
    expect(canSave({ ...values, type: '' })).toBe(false);
    expect(canSave({ ...values, primary: [] })).toBe(false);
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
    expect(isDirty({ ...initial, name: 'Other' }, initial)).toBe(true);
    expect(isDirty({ ...initial, secondary: [] }, initial)).toBe(true);
  });

  it('maps backend issue paths to form fields', () => {
    expect(
      errorsOfDetails([
        { path: 'name', message: 'x' },
        { path: 'primaryMuscles.0', message: 'x' },
        { path: 'instructions.3', message: 'x' },
        { path: 'unknown', message: 'x' },
      ]),
    ).toEqual({ name: true, primaryMuscles: true, instructions: true });
    expect(errorsOfDetails('nope')).toEqual({});
    expect(errorsOfDetails(undefined)).toEqual({});
  });
});
