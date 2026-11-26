import { z } from 'zod';
import type { Draft } from '@/entities/training/model/draft';

export const MIN_REST_SECONDS = 5;
export const MAX_REST_SECONDS = 600;
export const REST_ADJUST_SECONDS = 15;
export const REST_PRESETS_SECONDS = [
  30, 45, 60, 75, 90, 120, 150, 180, 240, 300,
] as const;

export const restSchema = z.object({
  endsAt: z.number(),
  durationS: z.number(),
  exerciseId: z.string().nullable(),
  setId: z.string().nullable(),
});
export type Rest = z.infer<typeof restSchema>;

export function restLeftSeconds(rest: Rest, now: number): number {
  return Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
}

export function startRest(
  draft: Draft,
  seconds: number,
  now: Date,
  source: { exerciseId: string; setId: string } | null = null,
): Draft {
  return {
    ...draft,
    rest: {
      endsAt: now.getTime() + seconds * 1000,
      durationS: seconds,
      exerciseId: source?.exerciseId ?? null,
      setId: source?.setId ?? null,
    },
  };
}

export function adjustRest(draft: Draft, deltaS: number, now: Date): Draft {
  const rest = draft.rest;
  if (!rest) {
    return draft;
  }
  const endsAt = rest.endsAt + deltaS * 1000;
  if (endsAt <= now.getTime()) {
    return { ...draft, rest: null };
  }
  return {
    ...draft,
    rest: { ...rest, endsAt, durationS: Math.max(1, rest.durationS + deltaS) },
  };
}

export function skipRest(draft: Draft): Draft {
  return draft.rest ? { ...draft, rest: null } : draft;
}

export function setRestSeconds(
  draft: Draft,
  exerciseId: string,
  seconds: number | null,
): Draft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) =>
      exercise.id === exerciseId
        ? { ...exercise, restSeconds: seconds }
        : exercise,
    ),
  };
}
