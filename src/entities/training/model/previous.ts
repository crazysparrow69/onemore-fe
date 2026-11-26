import { z } from 'zod';
import type { Units } from '@/entities/user/api/current-user.service';
import { formatClock, kgToUnits } from '@/entities/training/model/format';

export const previousSetSchema = z.object({
  kind: z.enum(['warmup', 'working', 'drop', 'failure']),
  weightKg: z.number().nullable(),
  reps: z.number().nullable(),
  durationS: z.number().nullable(),
  distanceM: z.number().nullable(),
});
export type PreviousSet = z.infer<typeof previousSetSchema>;

export const previousExerciseSchema = z.object({
  workoutId: z.string(),
  startedAt: z.string(),
  localDate: z.string(),
  restSeconds: z.number().nullable(),
  sets: z.array(previousSetSchema),
});
export type PreviousExercise = z.infer<typeof previousExerciseSchema>;

export type PreviousValues = Record<
  'weight' | 'reps' | 'duration' | 'distance',
  string
>;

export function matchPrevious(
  sets: readonly { kind: string }[],
  previous: PreviousExercise | null | undefined,
): (PreviousSet | null)[] {
  if (!previous) {
    return sets.map(() => null);
  }
  const warmups = previous.sets.filter((set) => set.kind === 'warmup');
  const others = previous.sets.filter((set) => set.kind !== 'warmup');
  let warmupIndex = 0;
  let otherIndex = 0;
  return sets.map((set) => {
    if (set.kind === 'warmup') {
      const found = warmups[warmupIndex] ?? null;
      warmupIndex += 1;
      return found;
    }
    const found = others[otherIndex] ?? null;
    otherIndex += 1;
    return found;
  });
}

export function previousValues(set: PreviousSet, units: Units): PreviousValues {
  return {
    weight: set.weightKg === null ? '' : String(kgToUnits(set.weightKg, units)),
    reps: set.reps === null ? '' : String(set.reps),
    duration: set.durationS === null ? '' : formatClock(set.durationS),
    distance:
      set.distanceM === null
        ? ''
        : String(Number((set.distanceM / 1000).toFixed(3))),
  };
}
