import { z } from 'zod';
import {
  GOAL_TYPES,
  type Goal,
  type GoalInput,
  type GoalType,
} from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import {
  kgToUnits,
  parseDecimal,
  unitsToKg,
} from '@/entities/training/model/format';
import { weightToKg } from '@/features/body/model/weight-form';

export const RATE_PRESETS: Record<Units, readonly string[]> = {
  kg: ['0.25', '0.5', '0.75', '1'],
  lb: ['0.5', '1', '1.5', '2'],
};

export const DEFAULT_RATE: Record<Units, string> = { kg: '0.5', lb: '1' };

export interface GoalFormValues {
  type: GoalType;
  rate: string;
  targetWeight: string;
}

export function usesRate(type: GoalType): boolean {
  return type === 'lose' || type === 'gain';
}

export function goalFormSchema(units: Units) {
  return z
    .object({
      type: z.enum(GOAL_TYPES),
      rate: z.string(),
      targetWeight: z.string().trim(),
    })
    .transform((values, ctx): GoalInput => {
      let targetWeightKg: number | null = null;
      if (values.targetWeight !== '') {
        targetWeightKg = weightToKg(values.targetWeight, units);
        if (targetWeightKg === null) {
          ctx.addIssue({
            code: 'custom',
            path: ['targetWeight'],
            message: 'validation.weight',
          });
          return z.NEVER;
        }
      }
      let rateKgPerWeek: number | null = null;
      if (usesRate(values.type)) {
        const rate = parseDecimal(values.rate);
        if (rate === null || rate <= 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['rate'],
            message: 'validation.required',
          });
          return z.NEVER;
        }
        rateKgPerWeek = unitsToKg(rate, units);
      }
      return { type: values.type, rateKgPerWeek, targetWeightKg };
    });
}

export function nearestRate(kgPerWeek: number, units: Units): string {
  const shown = units === 'lb' ? kgToUnits(kgPerWeek, 'lb') : kgPerWeek;
  const presets = RATE_PRESETS[units];
  let best = DEFAULT_RATE[units];
  let bestGap = Number.POSITIVE_INFINITY;
  for (const preset of presets) {
    const gap = Math.abs(Number(preset) - shown);
    if (gap < bestGap) {
      best = preset;
      bestGap = gap;
    }
  }
  return best;
}

export function goalDefaults(goal: Goal | null, units: Units): GoalFormValues {
  return {
    type: goal?.type ?? 'lose',
    rate:
      goal?.rateKgPerWeek != null
        ? nearestRate(goal.rateKgPerWeek, units)
        : DEFAULT_RATE[units],
    targetWeight:
      goal?.targetWeightKg != null
        ? String(kgToUnits(goal.targetWeightKg, units))
        : '',
  };
}
