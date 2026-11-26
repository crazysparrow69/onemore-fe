import type { Units } from '@/features/auth/api/current-user.service';
import type {
  TemplateExercisePayload,
  TemplatePayload,
  TemplateSetPayload,
} from '@/features/templates/model/payload';
import {
  setValuesToMetric,
  type Draft,
  type DraftExercise,
  type DraftSet,
  type SetValueKey,
} from '@/features/workouts/model/draft';
import { previousValues } from '@/features/workouts/model/previous';

export type TemplateChange =
  | { kind: 'added'; name: string }
  | { kind: 'removed'; name: string }
  | { kind: 'order' }
  | { kind: 'sets'; name: string; from: number; to: number }
  | { kind: 'values'; name: string }
  | { kind: 'rest'; name: string; from: number | null; to: number | null };

export interface TemplateUpdate {
  changes: TemplateChange[];
  payload: TemplatePayload;
}

function completedSet(set: DraftSet, units: Units): TemplateSetPayload {
  const parsed = setValuesToMetric(set, units);
  const target = set.target;
  if (!target) {
    return { kind: set.kind, ...parsed };
  }
  const shown = previousValues(target, units);
  const same = (key: SetValueKey): boolean => set[key] === shown[key];
  return {
    kind: set.kind,
    weightKg: same('weight') ? target.weightKg : parsed.weightKg,
    reps: same('reps') ? target.reps : parsed.reps,
    durationS: same('duration') ? target.durationS : parsed.durationS,
    distanceM: same('distance') ? target.distanceM : parsed.distanceM,
  };
}

function proposedSets(
  exercise: DraftExercise,
  units: Units,
): TemplateSetPayload[] {
  const sets: TemplateSetPayload[] = [];
  for (const set of exercise.sets) {
    if (set.completedAt !== null) {
      sets.push(completedSet(set, units));
    } else if (set.target) {
      sets.push({
        kind: set.kind,
        weightKg: set.target.weightKg,
        reps: set.target.reps,
        durationS: set.target.durationS,
        distanceM: set.target.distanceM,
      });
    }
  }
  return sets;
}

function sameSets(
  left: readonly TemplateSetPayload[],
  right: readonly TemplateSetPayload[],
): boolean {
  return (
    left.length === right.length &&
    left.every((set, index) => {
      const other = right[index];
      return (
        set.kind === other?.kind &&
        set.weightKg === other.weightKg &&
        set.reps === other.reps &&
        set.durationS === other.durationS &&
        set.distanceM === other.distanceM
      );
    })
  );
}

export function computeTemplateUpdate(
  draft: Draft,
  units: Units,
): TemplateUpdate | null {
  const base = draft.template;
  if (!base) {
    return null;
  }

  const seen = new Map<string, number>();
  const used = new Set<number>();
  const exercises: TemplateExercisePayload[] = [];
  const matched: number[] = [];
  const changes: TemplateChange[] = [];
  const valueChanged: string[] = [];

  for (const exercise of draft.exercises) {
    const sets = proposedSets(exercise, units);
    if (sets.length === 0) {
      continue;
    }
    const occurrence = seen.get(exercise.exerciseId) ?? 0;
    seen.set(exercise.exerciseId, occurrence + 1);
    const found =
      base.exercises
        .map((item, index) =>
          item.exerciseId === exercise.exerciseId ? index : -1,
        )
        .filter((index) => index >= 0)[occurrence] ?? -1;
    const original = found === -1 ? undefined : base.exercises[found];
    const restSeconds = exercise.restSeconds ?? null;
    exercises.push({
      exerciseId: exercise.exerciseId,
      notes: original?.notes ?? null,
      restSeconds,
      sets,
    });
    if (!original) {
      changes.push({ kind: 'added', name: exercise.name });
      continue;
    }
    used.add(found);
    matched.push(found);
    if (original.restSeconds !== restSeconds) {
      changes.push({
        kind: 'rest',
        name: exercise.name,
        from: original.restSeconds,
        to: restSeconds,
      });
    }
    const before = original.sets.map((set) => ({ ...set }));
    if (before.length !== sets.length) {
      changes.push({
        kind: 'sets',
        name: exercise.name,
        from: before.length,
        to: sets.length,
      });
    } else if (!sameSets(before, sets)) {
      valueChanged.push(exercise.name);
    }
  }

  base.exercises.forEach((item, index) => {
    if (!used.has(index)) {
      changes.push({ kind: 'removed', name: item.name });
    }
  });
  if (
    matched.some(
      (index, position) => position > 0 && index < (matched[position - 1] ?? 0),
    )
  ) {
    changes.push({ kind: 'order' });
  }
  for (const name of valueChanged) {
    changes.push({ kind: 'values', name });
  }

  if (changes.length === 0 || exercises.length === 0) {
    return null;
  }
  return {
    changes,
    payload: { name: base.name, notes: base.notes, exercises },
  };
}
