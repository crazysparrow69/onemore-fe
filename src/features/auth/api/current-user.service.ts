import { z } from 'zod';
import { ApiError } from '@/shared/api/error';
import type { ApiClient } from '@/shared/api/client';
import { api } from '@/features/auth/api/http';
import {
  detectLanguage,
  LANGUAGES,
  type Language,
} from '@/shared/i18n/language';

export const UNITS = ['kg', 'lb'] as const;
export type Units = (typeof UNITS)[number];

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  nickname: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  language: z.enum(LANGUAGES),
  units: z.enum(UNITS),
  timeZone: z.string(),
  createdAt: z.string(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

export interface UserPatch {
  name?: string | null;
  nickname?: string | null;
  language?: Language;
  units?: Units;
  timeZone?: string;
}

export interface AccountProfile {
  language: Language;
  units: Units;
  timeZone: string;
}

export function defaultAccountProfile(): AccountProfile {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    language: detectLanguage(navigator.language),
    units: 'kg',
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

export async function patchCurrentUser(
  patch: UserPatch,
  client: ApiClient = api,
): Promise<CurrentUser> {
  return parseUser(await client.patch('/me', patch));
}

function parseUser(value: unknown): CurrentUser {
  const parsed = currentUserSchema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Request failed');
  }
  return parsed.data;
}
