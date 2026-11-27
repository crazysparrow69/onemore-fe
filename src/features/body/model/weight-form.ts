import { z } from 'zod';
import type { WeightEntry } from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import {
  kgToUnits,
  parseDecimal,
  unitsToKg,
} from '@/entities/training/model/format';
import { isCalendarDate } from '@/features/body/model/dates';
import {
  MAX_WEIGHT_KG,
  MIN_WEIGHT_DATE,
  MIN_WEIGHT_KG,
  NOTE_MAX_LENGTH,
} from '@/features/body/model/rules';

export interface WeightFormValues {
  date: string;
  weight: string;
  note: string;
}

export interface WeightFormOutput {
  date: string;
  weightKg: number;
  note: string | null;
}

export function weightToKg(text: string, units: Units): number | null {
  const parsed = parseDecimal(text);
  if (parsed === null) {
    return null;
  }
  const kg = unitsToKg(parsed, units);
  return kg >= MIN_WEIGHT_KG && kg <= MAX_WEIGHT_KG ? kg : null;
}

export function weightFormSchema(units: Units, today: string) {
  return z
    .object({
      date: z
        .string()
        .refine(
          (value) =>
            isCalendarDate(value) && value >= MIN_WEIGHT_DATE && value <= today,
          { error: 'validation.date' },
        ),
      weight: z.string().transform((value, ctx) => {
        const kg = weightToKg(value, units);
        if (kg === null) {
          ctx.addIssue({ code: 'custom', message: 'validation.weight' });
          return z.NEVER;
        }
        return kg;
      }),
      note: z
        .string()
        .trim()
        .max(NOTE_MAX_LENGTH, { error: 'validation.noteMax' }),
    })
    .transform((values): WeightFormOutput => ({
      date: values.date,
      weightKg: values.weight,
      note: values.note === '' ? null : values.note,
    }));
}

export function weightDefaults(
  entry: WeightEntry | null,
  units: Units,
  today: string,
): WeightFormValues {
  return {
    date: entry?.localDate ?? today,
    weight: entry ? String(kgToUnits(entry.weightKg, units)) : '',
    note: entry?.note ?? '',
  };
}
