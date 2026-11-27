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
  MAX_FAT_SHARE_PERCENT,
  MAX_HEIGHT_CM,
  MAX_PROTEIN_G_PER_KG,
  MIN_AGE,
  MIN_DATE,
  MIN_FAT_SHARE_PERCENT,
  MIN_HEIGHT_CM,
  MIN_PROTEIN_G_PER_KG,
} from '@/features/body/model/rules';
import { parseDecimal, parseInteger } from '@/entities/training/model/format';

const TENTH = 10;

export interface BodyFormValues {
  sex: Sex;
  birthDate: string;
  height: string;
  activityLevel: ActivityLevel;
  protein: string;
  fat: string;
}

function optionalNumber(
  parse: (text: string) => number | null,
  min: number,
  max: number,
  message: string,
) {
  return z.string().transform((value, ctx) => {
    if (value.trim() === '') {
      return null;
    }
    const parsed = parse(value);
    if (parsed === null || parsed < min || parsed > max) {
      ctx.addIssue({ code: 'custom', message });
      return z.NEVER;
    }
    return parsed;
  });
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
      protein: optionalNumber(
        parseDecimal,
        MIN_PROTEIN_G_PER_KG,
        MAX_PROTEIN_G_PER_KG,
        'validation.protein',
      ),
      fat: optionalNumber(
        parseInteger,
        MIN_FAT_SHARE_PERCENT,
        MAX_FAT_SHARE_PERCENT,
        'validation.fatShare',
      ),
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
      proteinGPerKg:
        values.protein === null
          ? null
          : Math.round(values.protein * TENTH) / TENTH,
      fatSharePercent: values.fat,
    }));
}

function numberText(value: number | null | undefined): string {
  return typeof value === 'number' ? String(value) : '';
}

export function bodyDefaults(body: Body | null): BodyFormValues {
  return {
    sex: body?.sex ?? 'male',
    birthDate: body?.birthDate ?? '',
    height: body ? String(body.heightCm) : '',
    activityLevel: body?.activityLevel ?? 'light',
    protein: numberText(body?.proteinGPerKg),
    fat: numberText(body?.fatSharePercent),
  };
}
