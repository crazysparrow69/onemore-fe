import { z } from 'zod';
import { ApiError } from '@/shared/api/error';
import type { ApiClient } from '@/shared/api/client';
import { api } from '@/features/auth/api/http';

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  language: z.string(),
  timeZone: z.string(),
  createdAt: z.string(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

export interface AccountProfile {
  language: 'en';
  timeZone: string;
}

export function defaultAccountProfile(): AccountProfile {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    language: 'en',
    timeZone: zone.length > 0 ? zone : 'UTC',
  };
}

export async function fetchCurrentUser(
  client: ApiClient = api,
  profile: AccountProfile = defaultAccountProfile(),
): Promise<CurrentUser> {
  try {
    return parseUser(await client.get('/me'));
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 404 &&
      error.code === 'USER_NOT_FOUND'
    ) {
      return parseUser(await client.put('/me', profile));
    }
    throw error;
  }
}

function parseUser(value: unknown): CurrentUser {
  const parsed = currentUserSchema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Request failed');
  }
  return parsed.data;
}
