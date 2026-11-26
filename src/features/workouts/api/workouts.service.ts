import { z } from 'zod';
import { api } from '@/features/auth/api/http';
import type { WorkoutPayload } from '@/features/workouts/model/draft';
import { previousExerciseSchema } from '@/features/workouts/model/previous';
import type { ApiClient } from '@/shared/api/client';
import { ApiError } from '@/shared/api/error';

export const WORKOUTS_PAGE_SIZE = 20;

const totalsSchema = z.object({
  durationS: z.number(),
  volumeKg: z.number(),
  setCount: z.number(),
  exerciseCount: z.number(),
});

const setSchema = z.object({
  kind: z.enum(['warmup', 'working', 'drop', 'failure']),
  weightKg: z.number().nullable(),
  reps: z.number().nullable(),
  durationS: z.number().nullable(),
  distanceM: z.number().nullable(),
  completedAt: z.string().nullable(),
});

const exerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  type: z.string(),
  custom: z.boolean(),
  notes: z.string().nullable(),
  restSeconds: z.number().nullable(),
  sets: z.array(setSchema),
});

const baseShape = {
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  startedAt: z.string(),
  endedAt: z.string(),
  localDate: z.string(),
  timeZone: z.string(),
  summary: totalsSchema,
};

const detailsSchema = z.object({
  ...baseShape,
  exercises: z.array(exerciseSchema),
});

const listItemSchema = z.object({
  ...baseShape,
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      name: z.string(),
      image: z.string().nullable(),
      setCount: z.number(),
    }),
  ),
});

const listSchema = z.object({
  items: z.array(listItemSchema),
  total: z.number(),
  nextOffset: z.number().nullable(),
});

const previousSetsSchema = z.object({
  items: z.array(previousExerciseSchema.extend({ exerciseId: z.string() })),
});

export type PreviousSetsResponse = z.infer<typeof previousSetsSchema>;
export type WorkoutTotals = z.infer<typeof totalsSchema>;
export type WorkoutSet = z.infer<typeof setSchema>;
export type WorkoutExercise = z.infer<typeof exerciseSchema>;
export type WorkoutDetails = z.infer<typeof detailsSchema>;
export type WorkoutListItem = z.infer<typeof listItemSchema>;
export type WorkoutList = z.infer<typeof listSchema>;

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Request failed');
  }
  return parsed.data;
}

export async function saveWorkout(
  id: string,
  payload: WorkoutPayload,
  client: ApiClient = api,
): Promise<WorkoutDetails> {
  return parse(
    detailsSchema,
    await client.put(`/workouts/${encodeURIComponent(id)}`, payload),
  );
}

export async function fetchWorkouts(
  offset: number,
  limit: number = WORKOUTS_PAGE_SIZE,
  client: ApiClient = api,
): Promise<WorkoutList> {
  return parse(listSchema, await client.get('/workouts', { offset, limit }));
}

export async function fetchWorkout(
  id: string,
  client: ApiClient = api,
): Promise<WorkoutDetails> {
  return parse(
    detailsSchema,
    await client.get(`/workouts/${encodeURIComponent(id)}`),
  );
}

export async function deleteWorkout(
  id: string,
  client: ApiClient = api,
): Promise<void> {
  await client.delete(`/workouts/${encodeURIComponent(id)}`);
}

export async function fetchPreviousSets(
  exerciseIds: readonly string[],
  client: ApiClient = api,
): Promise<PreviousSetsResponse> {
  return parse(
    previousSetsSchema,
    await client.get('/workouts/previous-sets', {
      exerciseIds: exerciseIds.join(','),
    }),
  );
}
