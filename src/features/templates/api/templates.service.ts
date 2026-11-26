import { z } from 'zod';
import { api } from '@/entities/user/api/http';
import type { TemplatePayload } from '@/features/templates/model/payload';
import type { ApiClient } from '@/shared/api/client';
import { parseResponse, resourcePath } from '@/shared/api/parse';

const setSchema = z.object({
  kind: z.enum(['warmup', 'working', 'drop', 'failure']),
  weightKg: z.number().nullable(),
  reps: z.number().nullable(),
  durationS: z.number().nullable(),
  distanceM: z.number().nullable(),
});

const exerciseSchema = z.object({
  exerciseId: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  type: z.string(),
  custom: z.boolean(),
  archived: z.boolean(),
  notes: z.string().nullable(),
  restSeconds: z.number().nullable(),
  sets: z.array(setSchema),
});

const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastPerformedAt: z.string().nullable(),
  exercises: z.array(exerciseSchema),
});

const listSchema = z.object({ items: z.array(templateSchema) });

export type Template = z.infer<typeof templateSchema>;
export type TemplateExercise = z.infer<typeof exerciseSchema>;
export type TemplateSet = z.infer<typeof setSchema>;
export type TemplateList = z.infer<typeof listSchema>;

export async function saveTemplate(
  id: string,
  payload: TemplatePayload,
  client: ApiClient = api,
): Promise<Template> {
  return parseResponse(
    templateSchema,
    await client.put(resourcePath('/templates', id), payload),
  );
}

export async function fetchTemplates(
  client: ApiClient = api,
): Promise<TemplateList> {
  return parseResponse(listSchema, await client.get('/templates'));
}

export async function fetchTemplate(
  id: string,
  client: ApiClient = api,
): Promise<Template> {
  return parseResponse(
    templateSchema,
    await client.get(resourcePath('/templates', id)),
  );
}

export async function archiveTemplate(
  id: string,
  client: ApiClient = api,
): Promise<void> {
  await client.delete(resourcePath('/templates', id));
}
