import { z } from 'zod';
import {
  MAX_MANUAL_KCAL,
  MIN_MANUAL_KCAL,
} from '@/entities/nutrition/model/schemas';
import { parseInteger } from '@/entities/training/model/format';

export interface ManualTargetValues {
  calories: string;
}

export const manualTargetSchema = z
  .object({
    calories: z.string().transform((value, ctx) => {
      const parsed = parseInteger(value);
      if (
        parsed === null ||
        parsed < MIN_MANUAL_KCAL ||
        parsed > MAX_MANUAL_KCAL
      ) {
        ctx.addIssue({ code: 'custom', message: 'validation.calories' });
        return z.NEVER;
      }
      return parsed;
    }),
  })
  .transform((values) => values.calories);
