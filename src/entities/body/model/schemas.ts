import { z } from 'zod';

export const SEXES = ['male', 'female'] as const;
export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const;
export const GOAL_TYPES = ['lose', 'maintain', 'gain', 'recomp'] as const;

export type Sex = (typeof SEXES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type GoalType = (typeof GOAL_TYPES)[number];

export const bodySchema = z.object({
  sex: z.enum(SEXES),
  birthDate: z.string(),
  heightCm: z.number(),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  updatedAt: z.string(),
});

export const goalSchema = z.object({
  type: z.enum(GOAL_TYPES),
  rateKgPerWeek: z.number().nullable(),
  targetWeightKg: z.number().nullable(),
  effectiveFrom: z.string(),
});

export const weightEntrySchema = z.object({
  localDate: z.string(),
  weightKg: z.number(),
  note: z.string().nullable(),
  updatedAt: z.string(),
});

export const weightListSchema = z.object({
  items: z.array(weightEntrySchema),
});

export type Body = z.infer<typeof bodySchema>;
export type Goal = z.infer<typeof goalSchema>;
export type WeightEntry = z.infer<typeof weightEntrySchema>;

export interface BodyInput {
  sex: Sex;
  birthDate: string;
  heightCm: number;
  activityLevel: ActivityLevel;
}

export interface GoalInput {
  type: GoalType;
  rateKgPerWeek: number | null;
  targetWeightKg: number | null;
}

export interface WeightInput {
  weightKg: number;
  note: string | null;
}
