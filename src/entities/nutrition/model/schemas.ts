import { z } from 'zod';

export const TARGET_SOURCES = ['auto', 'manual'] as const;
export type TargetSource = (typeof TARGET_SOURCES)[number];

export const MIN_MANUAL_KCAL = 1000;
export const MAX_MANUAL_KCAL = 6000;

const inputsSchema = z.object({
  sex: z.enum(['male', 'female']),
  age: z.number(),
  heightCm: z.number(),
  weightKg: z.number(),
  activityLevel: z.string(),
  goalType: z.string(),
  rateKgPerWeek: z.number().nullable(),
});

export const targetSchema = z.object({
  effectiveFrom: z.string(),
  source: z.enum(TARGET_SOURCES),
  caloriesKcal: z.number(),
  proteinG: z.number(),
  fatG: z.number(),
  carbsG: z.number(),
  bmrKcal: z.number().nullable(),
  tdeeKcal: z.number().nullable(),
  floorApplied: z.boolean(),
  inputs: inputsSchema.nullable(),
});

export type Target = z.infer<typeof targetSchema>;
