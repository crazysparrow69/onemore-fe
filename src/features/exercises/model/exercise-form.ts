import { z } from 'zod';
import type {
  ExerciseDetails,
  ExerciseInput,
} from '@/features/exercises/api/exercises.service';

export interface ExerciseFormValues {
  name: string;
  type: string;
  primary: string[];
  secondary: string[];
  equipment: string;
  steps: string;
}

export type ExerciseFormField =
  | 'name'
  | 'type'
  | 'primaryMuscles'
  | 'secondaryMuscles'
  | 'equipment'
  | 'instructions';

export type ExerciseFormErrors = Partial<Record<ExerciseFormField, true>>;

const FIELDS: readonly string[] = [
  'name',
  'type',
  'primaryMuscles',
  'secondaryMuscles',
  'equipment',
  'instructions',
];

const issuesSchema = z.array(z.object({ path: z.string() }));

export function emptyFormValues(name = ''): ExerciseFormValues {
  return {
    name,
    type: '',
    primary: [],
    secondary: [],
    equipment: 'none',
    steps: '',
  };
}

export function formValuesOf(exercise: ExerciseDetails): ExerciseFormValues {
  return {
    name: exercise.name,
    type: exercise.type,
    primary: exercise.primaryMuscles,
    secondary: exercise.secondaryMuscles,
    equipment: exercise.equipment,
    steps: exercise.instructions.join('\n'),
  };
}

export function canSave(values: ExerciseFormValues): boolean {
  return (
    values.name.trim().length > 0 &&
    values.type.length > 0 &&
    values.primary.length > 0
  );
}

export function isDirty(
  values: ExerciseFormValues,
  initial: ExerciseFormValues,
): boolean {
  return JSON.stringify(values) !== JSON.stringify(initial);
}

export function toInput(values: ExerciseFormValues): ExerciseInput {
  return {
    name: values.name,
    type: values.type,
    primaryMuscles: values.primary,
    secondaryMuscles: values.secondary,
    equipment: values.equipment,
    instructions: values.steps
      .split('\n')
      .filter((line) => line.trim().length > 0),
  };
}

export function errorsOfDetails(details: unknown): ExerciseFormErrors {
  const parsed = issuesSchema.safeParse(details);
  const errors: ExerciseFormErrors = {};
  if (!parsed.success) {
    return errors;
  }
  for (const issue of parsed.data) {
    const [head] = issue.path.split('.');
    if (head !== undefined && FIELDS.includes(head)) {
      errors[head as ExerciseFormField] = true;
    }
  }
  return errors;
}
