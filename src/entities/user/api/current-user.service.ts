import { z } from 'zod';
import { ApiError } from '@/shared/api/error';
import { parseResponse } from '@/shared/api/parse';
import type { ApiClient } from '@/shared/api/client';
import { api } from '@/entities/user/api/http';
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
  avatar: z.string().nullable(),
  createdAt: z.string(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

export interface UserPatch {
  name?: string | null;
  nickname?: string | null;
  language?: Language;
  units?: Units;
  timeZone?: string;
  avatarId?: string | null;
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
    return parseResponse(currentUserSchema, await client.get('/me'));
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 404 &&
      error.code === 'USER_NOT_FOUND'
    ) {
      return parseResponse(currentUserSchema, await client.put('/me', profile));
    }
    throw error;
  }
}

export async function patchCurrentUser(
  patch: UserPatch,
  client: ApiClient = api,
): Promise<CurrentUser> {
  return parseResponse(currentUserSchema, await client.patch('/me', patch));
}
