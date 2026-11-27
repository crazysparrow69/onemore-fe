import { z } from 'zod';
import {
  ACTIVITY_LEVELS,
  SEXES,
  type ActivityLevel,
  type Body,
  type BodyInput,
  type Sex,
} from '@/entities/body/model/schemas';
import { ageOn, isCalendarDate } from '@/features/body/model/dates';
import {
  MAX_AGE,
  MAX_HEIGHT_CM,
  MIN_AGE,
  MIN_DATE,
  MIN_HEIGHT_CM,
} from '@/features/body/model/rules';
import { parseDecimal } from '@/entities/training/model/format';

export interface BodyFormValues {
  sex: Sex;
  birthDate: string;
  height: string;
  activityLevel: ActivityLevel;
}

export function bodyFormSchema(today: string) {
  return z
    .object({
      sex: z.enum(SEXES),
      birthDate: z
        .string()
        .refine((value) => isCalendarDate(value) && value >= MIN_DATE, {
          error: 'validation.date',
        }),
      height: z.string().transform((value, ctx) => {
        const parsed = parseDecimal(value);
        if (
          parsed === null ||
          parsed < MIN_HEIGHT_CM ||
          parsed > MAX_HEIGHT_CM
        ) {
          ctx.addIssue({ code: 'custom', message: 'validation.height' });
          return z.NEVER;
        }
        return parsed;
      }),
      activityLevel: z.enum(ACTIVITY_LEVELS),
    })
    .superRefine((values, ctx) => {
      if (!isCalendarDate(values.birthDate)) {
        return;
      }
      const age = ageOn(values.birthDate, today);
      if (age < MIN_AGE || age > MAX_AGE) {
        ctx.addIssue({
          code: 'custom',
          path: ['birthDate'],
          message: 'validation.age',
        });
      }
    })
    .transform((values): BodyInput => ({
      sex: values.sex,
      birthDate: values.birthDate,
      heightCm: values.height,
      activityLevel: values.activityLevel,
    }));
}

export function bodyDefaults(body: Body | null): BodyFormValues {
  return {
    sex: body?.sex ?? 'male',
    birthDate: body?.birthDate ?? '',
    height: body ? String(body.heightCm) : '',
    activityLevel: body?.activityLevel ?? 'light',
  };
}
