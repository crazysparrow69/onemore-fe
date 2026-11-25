import { z } from 'zod';
import { api } from '@/features/auth/api/http';
import type { CatalogFilters } from '@/features/exercises/model/catalog-search';
import { ApiError } from '@/shared/api/error';
import type { ApiClient } from '@/shared/api/client';

export const EXERCISES_PAGE_SIZE = 50;

const listItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  equipment: z.string(),
  image: z.string().nullable(),
  custom: z.boolean(),
});

const listSchema = z.object({
  items: z.array(listItemSchema),
  total: z.number(),
  nextOffset: z.number().nullable(),
});

const detailsSchema = listItemSchema.extend({
  imageKeys: z.array(z.string()),
  category: z.string().nullable(),
  force: z.string().nullable(),
  mechanic: z.string().nullable(),
  level: z.string().nullable(),
  instructions: z.array(z.string()),
});

const optionSchema = z.object({ id: z.string(), label: z.string() });

const muscleOptionSchema = optionSchema.extend({ primaryOnly: z.boolean() });
const typeOptionSchema = optionSchema.extend({ example: z.string() });

const dictionariesSchema = z.object({
  locale: z.string(),
  muscleGroups: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      muscles: z.array(muscleOptionSchema),
    }),
  ),
  equipment: z.array(optionSchema),
  types: z.array(typeOptionSchema),
  categories: z.array(optionSchema),
  levels: z.array(optionSchema),
  forces: z.array(optionSchema),
  mechanics: z.array(optionSchema),
});

export type ExerciseListItem = z.infer<typeof listItemSchema>;
export type ExerciseList = z.infer<typeof listSchema>;
export type ExerciseDetails = z.infer<typeof detailsSchema>;
export type ExerciseDictionaries = z.infer<typeof dictionariesSchema>;
export type ExerciseOption = z.infer<typeof optionSchema>;
export type MuscleOption = z.infer<typeof muscleOptionSchema>;
export type TypeOption = z.infer<typeof typeOptionSchema>;

export interface ExerciseInput {
  name: string;
  type: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  instructions: string[];
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Request failed');
  }
  return parsed.data;
}

export async function fetchExercises(
  filters: CatalogFilters,
  offset: number,
  limit: number = EXERCISES_PAGE_SIZE,
  client: ApiClient = api,
): Promise<ExerciseList> {
  return parse(
    listSchema,
    await client.get('/exercises', {
      q: filters.q.length > 0 ? filters.q : undefined,
      muscle: filters.muscle.length > 0 ? filters.muscle.join(',') : undefined,
      equipment:
        filters.equipment.length > 0 ? filters.equipment.join(',') : undefined,
      mine: filters.mine ? 'true' : undefined,
      offset,
      limit,
    }),
  );
}

export async function fetchExercise(
  id: string,
  client: ApiClient = api,
): Promise<ExerciseDetails> {
  return parse(
    detailsSchema,
    await client.get(`/exercises/${encodeURIComponent(id)}`),
  );
}

export async function createExercise(
  input: ExerciseInput,
  client: ApiClient = api,
): Promise<ExerciseDetails> {
  return parse(detailsSchema, await client.post('/exercises', input));
}

export async function updateExercise(
  id: string,
  input: ExerciseInput,
  client: ApiClient = api,
): Promise<ExerciseDetails> {
  return parse(
    detailsSchema,
    await client.put(`/exercises/${encodeURIComponent(id)}`, input),
  );
}

export async function deleteExercise(
  id: string,
  client: ApiClient = api,
): Promise<void> {
  await client.delete(`/exercises/${encodeURIComponent(id)}`);
}

export async function fetchExerciseDictionaries(
  client: ApiClient = api,
): Promise<ExerciseDictionaries> {
  return parse(dictionariesSchema, await client.get('/exercise-dictionaries'));
}

export function exerciseImageUrl(key: string): string {
  return `/${key}`;
}
