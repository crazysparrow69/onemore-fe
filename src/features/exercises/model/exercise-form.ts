import { z } from 'zod';
import type {
  ExerciseDetails,
  ExerciseInput,
} from '@/entities/exercise/api/exercises.service';

export const exerciseFormSchema = z.object({
  name: z.string().refine((value) => value.trim().length > 0),
  type: z.string().min(1),
  primary: z.array(z.string()).min(1),
  secondary: z.array(z.string()),
  equipment: z.string(),
  steps: z.string(),
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;
export type ExerciseFormField = keyof ExerciseFormValues;

const FIELD_OF_ISSUE: Readonly<Record<string, ExerciseFormField>> = {
  name: 'name',
  type: 'type',
  primaryMuscles: 'primary',
  secondaryMuscles: 'secondary',
  equipment: 'equipment',
  instructions: 'steps',
};

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

export function isDirty(
  values: Partial<ExerciseFormValues>,
  initial: ExerciseFormValues,
): boolean {
  return JSON.stringify({ ...initial, ...values }) !== JSON.stringify(initial);
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

export function fieldsOfDetails(details: unknown): ExerciseFormField[] {
  const parsed = issuesSchema.safeParse(details);
  if (!parsed.success) {
    return [];
  }
  const fields = parsed.data.flatMap((issue) => {
    const [head] = issue.path.split('.');
    const field = head === undefined ? undefined : FIELD_OF_ISSUE[head];
    return field === undefined ? [] : [field];
  });
  return [...new Set(fields)];
}
