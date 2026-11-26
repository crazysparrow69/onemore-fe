import type { z } from 'zod';
import { ApiError } from '@/shared/api/error';

export function parseResponse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Request failed');
  }
  return parsed.data;
}

export function resourcePath(collection: string, id: string): string {
  return `${collection}/${encodeURIComponent(id)}`;
}
