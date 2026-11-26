import { z } from 'zod';
import { UNITS } from '@/entities/user/api/current-user.service';
import { LANGUAGES } from '@/shared/i18n/language';

export const NAME_MAX_LENGTH = 100;
export const NICKNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const profileSchema = z.object({
  name: z.string().trim().max(NAME_MAX_LENGTH, { error: 'validation.nameMax' }),
  nickname: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value === '' || NICKNAME_PATTERN.test(value), {
      error: 'validation.nickname',
    }),
});

export const settingsSchema = z.object({
  language: z.enum(LANGUAGES),
  units: z.enum(UNITS),
  timeZone: z.string().min(1, { error: 'validation.required' }),
});

export type ProfileValues = z.infer<typeof profileSchema>;
export type SettingsValues = z.infer<typeof settingsSchema>;
