import { z } from 'zod';

export const TARGET_SOURCES = ['auto', 'manual'] as const;
export type TargetSource = (typeof TARGET_SOURCES)[number];

export const MIN_MANUAL_KCAL = 1000;
export const MAX_MANUAL_KCAL = 6000;

const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const;
const GOAL_TYPES = ['lose', 'maintain', 'gain', 'recomp'] as const;

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

const inputsSchema = z.object({
  sex: z.enum(['male', 'female']),
  age: z.number(),
  heightCm: z.number(),
  weightKg: z.number(),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  goalType: z.enum(GOAL_TYPES),
  rateKgPerWeek: z.number().nullable(),
  proteinGPerKg: z.number().optional(),
  fatSharePercent: z.number().optional(),
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
export type TargetInputs = NonNullable<Target['inputs']>;
