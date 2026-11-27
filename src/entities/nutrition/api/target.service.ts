import { api } from '@/entities/user/api/http';
import { targetSchema, type Target } from '@/entities/nutrition/model/schemas';
import type { ApiClient } from '@/shared/api/client';
import { hasErrorCode } from '@/shared/api/error';
import { parseResponse } from '@/shared/api/parse';

export async function fetchTarget(
  date: string,
  client: ApiClient = api,
): Promise<Target | null> {
  try {
    return parseResponse(
      targetSchema,
      await client.get('/nutrition/target', { date }),
    );
  } catch (error) {
    if (hasErrorCode(error, 'TARGET_NOT_FOUND')) {
      return null;
    }
    throw error;
  }
}

export async function setManualTarget(
  caloriesKcal: number,
  today: string,
  client: ApiClient = api,
): Promise<Target> {
  return parseResponse(
    targetSchema,
    await client.put('/nutrition/target/manual', { caloriesKcal, today }),
  );
}

export async function requestAutoTarget(
  today: string,
  client: ApiClient = api,
): Promise<Target> {
  return parseResponse(
    targetSchema,
    await client.put('/nutrition/target/auto', { today }),
  );
}
