export const MUSCLES = [
  'chest',
  'lats',
  'upper_back',
  'lower_back',
  'traps',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abdominals',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
  'abductors',
  'neck',
  'full_body',
  'cardio',
  'other',
] as const;

export const EQUIPMENT = [
  'none',
  'barbell',
  'ez_bar',
  'trap_bar',
  'dumbbell',
  'kettlebell',
  'plate',
  'machine',
  'cable',
  'smith_machine',
  'suspension',
  'band',
  'medicine_ball',
  'exercise_ball',
  'foam_roll',
  'other',
] as const;

export const EXERCISE_TYPES = [
  'weight_reps',
  'bodyweight_reps',
  'duration',
  'distance_duration',
  'weight_distance',
] as const;

export const CATEGORIES = [
  'strength',
  'powerlifting',
  'olympic_weightlifting',
  'strongman',
  'cardio',
  'stretching',
  'plyometrics',
] as const;

export const LEVELS = ['beginner', 'intermediate', 'expert'] as const;
export const FORCES = ['push', 'pull', 'static'] as const;
export const MECHANICS = ['compound', 'isolation'] as const;

export type Muscle = (typeof MUSCLES)[number];
export type Equipment = (typeof EQUIPMENT)[number];
export type ExerciseType = (typeof EXERCISE_TYPES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Level = (typeof LEVELS)[number];
export type Force = (typeof FORCES)[number];
export type Mechanic = (typeof MECHANICS)[number];
