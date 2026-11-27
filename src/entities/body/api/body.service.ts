import { api } from '@/entities/user/api/http';
import {
  bodySchema,
  goalSchema,
  weightEntrySchema,
  weightListSchema,
  type Body,
  type BodyInput,
  type Goal,
  type GoalInput,
  type WeightEntry,
  type WeightInput,
} from '@/entities/body/model/schemas';
import type { ApiClient } from '@/shared/api/client';
import { hasErrorCode } from '@/shared/api/error';
import { parseResponse, resourcePath } from '@/shared/api/parse';

export const WEIGHT_PAGE_SIZE = 30;

async function orNull<T>(
  code: string,
  load: () => Promise<T>,
): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (hasErrorCode(error, code)) {
      return null;
    }
    throw error;
  }
}

export function fetchBody(client: ApiClient = api): Promise<Body | null> {
  return orNull('BODY_PROFILE_NOT_FOUND', async () =>
    parseResponse(bodySchema, await client.get('/body')),
  );
}

export async function saveBody(
  input: BodyInput,
  today: string,
  client: ApiClient = api,
): Promise<Body> {
  return parseResponse(
    bodySchema,
    await client.put('/body', { ...input, today }),
  );
}

export function fetchGoal(client: ApiClient = api): Promise<Goal | null> {
  return orNull('GOAL_NOT_FOUND', async () =>
    parseResponse(goalSchema, await client.get('/goals/current')),
  );
}

export async function saveGoal(
  input: GoalInput,
  today: string,
  client: ApiClient = api,
): Promise<Goal> {
  return parseResponse(
    goalSchema,
    await client.put('/goals/current', { ...input, today }),
  );
}

export function fetchLatestWeight(
  client: ApiClient = api,
): Promise<WeightEntry | null> {
  return orNull('WEIGHT_NOT_FOUND', async () =>
    parseResponse(weightEntrySchema, await client.get('/weight/latest')),
  );
}

export async function fetchWeightLog(
  options: { to?: string; from?: string; limit?: number } = {},
  client: ApiClient = api,
): Promise<WeightEntry[]> {
  const result = parseResponse(
    weightListSchema,
    await client.get('/weight', {
      limit: options.limit ?? WEIGHT_PAGE_SIZE,
      from: options.from,
      to: options.to,
    }),
  );
  return result.items;
}

export async function saveWeight(
  date: string,
  input: WeightInput,
  today: string,
  client: ApiClient = api,
): Promise<WeightEntry> {
  return parseResponse(
    weightEntrySchema,
    await client.put(resourcePath('/weight', date), { ...input, today }),
  );
}

export function deleteWeight(
  date: string,
  today: string,
  client: ApiClient = api,
): Promise<void> {
  return client.delete(`${resourcePath('/weight', date)}?today=${today}`);
}
