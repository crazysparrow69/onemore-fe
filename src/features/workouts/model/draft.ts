import { z } from 'zod';
import type { Units } from '@/features/auth/api/current-user.service';
import {
  previousExerciseSchema,
  previousSetSchema,
  previousValues,
  matchPrevious,
  type PreviousExercise,
} from '@/features/workouts/model/previous';
import {
  templateLinkSchema,
  type TemplateSource,
} from '@/features/workouts/model/template-link';
import { restSchema, startRest } from '@/features/workouts/model/rest';
import {
  parseDecimal,
  parseDuration,
  parseInteger,
  unitsToKg,
} from '@/features/workouts/model/format';

export const SET_KINDS = ['warmup', 'working', 'drop', 'failure'] as const;
export type SetKind = (typeof SET_KINDS)[number];

export const SET_FIELD_IDS = [
  'weightKg',
  'reps',
  'durationS',
  'distanceM',
] as const;
export type SetFieldId = (typeof SET_FIELD_IDS)[number];

export const draftFieldRuleSchema = z.object({
  id: z.enum(SET_FIELD_IDS),
  requirement: z.enum(['required', 'optional', 'any_of']),
  min: z.number(),
  max: z.number(),
});
export type FieldRule = z.infer<typeof draftFieldRuleSchema>;

export const draftSetSchema = z.object({
  id: z.string(),
  kind: z.enum(SET_KINDS),
  weight: z.string(),
  reps: z.string(),
  duration: z.string(),
  distance: z.string(),
  completedAt: z.string().nullable(),
  target: previousSetSchema.nullable().optional(),
});
export type DraftSet = z.infer<typeof draftSetSchema>;

export const draftExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  type: z.string(),
  custom: z.boolean(),
  fields: z.array(draftFieldRuleSchema),
  notes: z.string(),
  restSeconds: z.number().nullable().optional(),
  planned: z.boolean().optional(),
  previous: previousExerciseSchema.nullable().optional(),
  sets: z.array(draftSetSchema),
});
export type DraftExercise = z.infer<typeof draftExerciseSchema>;

export const draftSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  name: z.string(),
  notes: z.string(),
  rest: restSchema.nullable().optional(),
  template: templateLinkSchema.nullable().optional(),
  exercises: z.array(draftExerciseSchema),
});
export type Draft = z.infer<typeof draftSchema>;

export interface PickedExercise {
  exerciseId: string;
  name: string;
  image: string | null;
  type: string;
  custom: boolean;
  fields: FieldRule[];
}

export type SetValueKey = 'weight' | 'reps' | 'duration' | 'distance';

export const FIELD_KEYS: Readonly<Record<SetFieldId, SetValueKey>> = {
  weightKg: 'weight',
  reps: 'reps',
  durationS: 'duration',
  distanceM: 'distance',
};

export const MAX_EXERCISES = 50;
export const MAX_SETS = 50;

export function emptySet(id: string, kind: SetKind = 'working'): DraftSet {
  return {
    id,
    kind,
    weight: '',
    reps: '',
    duration: '',
    distance: '',
    completedAt: null,
  };
}

export function createDraft(id: string, now: Date): Draft {
  return {
    id,
    startedAt: now.toISOString(),
    name: '',
    notes: '',
    exercises: [],
  };
}

export type IdFactory = () => string;

export function draftFromTemplate(
  id: string,
  now: Date,
  template: TemplateSource,
  fieldsOf: (type: string) => FieldRule[],
  newId: IdFactory,
): Draft {
  return {
    id,
    startedAt: now.toISOString(),
    name: template.name,
    notes: '',
    template: {
      id: template.id,
      name: template.name,
      notes: template.notes,
      exercises: template.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        notes: exercise.notes,
        restSeconds: exercise.restSeconds,
        sets: exercise.sets.map((set) => ({
          kind: set.kind,
          weightKg: set.weightKg,
          reps: set.reps,
          durationS: set.durationS,
          distanceM: set.distanceM,
        })),
      })),
    },
    exercises: template.exercises
      .slice(0, MAX_EXERCISES)
      .map((exercise): DraftExercise => ({
        id: newId(),
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        image: exercise.image,
        type: exercise.type,
        custom: exercise.custom,
        fields: fieldsOf(exercise.type),
        notes: exercise.notes ?? '',
        restSeconds: exercise.restSeconds,
        planned: true,
        sets: exercise.sets.slice(0, MAX_SETS).map((set) => ({
          ...emptySet(newId(), set.kind),
          target: {
            kind: set.kind,
            weightKg: set.weightKg,
            reps: set.reps,
            durationS: set.durationS,
            distanceM: set.distanceM,
          },
        })),
      })),
  };
}

export function addExercises(
  draft: Draft,
  picked: readonly PickedExercise[],
  newId: IdFactory,
): Draft {
  const room = MAX_EXERCISES - draft.exercises.length;
  const added = picked
    .slice(0, Math.max(0, room))
    .map((item): DraftExercise => ({
      id: newId(),
      exerciseId: item.exerciseId,
      name: item.name,
      image: item.image,
      type: item.type,
      custom: item.custom,
      fields: item.fields,
      notes: '',
      restSeconds: null,
      sets: [emptySet(newId())],
    }));
  return { ...draft, exercises: [...draft.exercises, ...added] };
}

function mapExercise(
  draft: Draft,
  exerciseId: string,
  change: (exercise: DraftExercise) => DraftExercise,
): Draft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) =>
      exercise.id === exerciseId ? change(exercise) : exercise,
    ),
  };
}

export function removeExercise(draft: Draft, exerciseId: string): Draft {
  return {
    ...draft,
    rest: draft.rest?.exerciseId === exerciseId ? null : draft.rest,
    exercises: draft.exercises.filter((exercise) => exercise.id !== exerciseId),
  };
}

export function moveExercise(
  draft: Draft,
  exerciseId: string,
  direction: -1 | 1,
): Draft {
  const index = draft.exercises.findIndex(
    (exercise) => exercise.id === exerciseId,
  );
  const target = index + direction;
  if (index < 0 || target < 0 || target >= draft.exercises.length) {
    return draft;
  }
  const exercises = [...draft.exercises];
  const [moved] = exercises.splice(index, 1);
  if (moved) {
    exercises.splice(target, 0, moved);
  }
  return { ...draft, exercises };
}

export function setExerciseNotes(
  draft: Draft,
  exerciseId: string,
  notes: string,
): Draft {
  return mapExercise(draft, exerciseId, (exercise) => ({
    ...exercise,
    notes,
  }));
}

export function addSet(
  draft: Draft,
  exerciseId: string,
  newId: IdFactory,
): Draft {
  return mapExercise(draft, exerciseId, (exercise) =>
    exercise.sets.length >= MAX_SETS
      ? exercise
      : { ...exercise, sets: [...exercise.sets, emptySet(newId())] },
  );
}

export function removeSet(
  draft: Draft,
  exerciseId: string,
  setId: string,
): Draft {
  const next = mapExercise(draft, exerciseId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.filter((set) => set.id !== setId),
  }));
  return next.rest?.setId === setId ? { ...next, rest: null } : next;
}

function mapSet(
  draft: Draft,
  exerciseId: string,
  setId: string,
  change: (set: DraftSet, previous: DraftSet | null) => DraftSet,
): Draft {
  return mapExercise(draft, exerciseId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, index) =>
      set.id === setId ? change(set, exercise.sets[index - 1] ?? null) : set,
    ),
  }));
}

export function updateSet(
  draft: Draft,
  exerciseId: string,
  setId: string,
  patch: Partial<Pick<DraftSet, SetValueKey | 'kind'>>,
): Draft {
  return mapSet(draft, exerciseId, setId, (set) => ({ ...set, ...patch }));
}

export function isFilled(
  fields: readonly FieldRule[],
  values: Pick<DraftSet, SetValueKey>,
): boolean {
  const present = (rule: FieldRule): boolean =>
    values[FIELD_KEYS[rule.id]].trim().length > 0;
  const anyOf = fields.filter((rule) => rule.requirement === 'any_of');
  return (
    fields
      .filter((rule) => rule.requirement === 'required')
      .every((rule) => present(rule)) &&
    (anyOf.length === 0 || anyOf.some((rule) => present(rule)))
  );
}

export function suggestedValue(
  previous: DraftSet | null,
  key: SetValueKey,
): string {
  return previous?.[key] ?? '';
}

export function lastTimeValues(
  exercise: DraftExercise,
  index: number,
  units: Units,
): Pick<DraftSet, SetValueKey> | null {
  const match = matchPrevious(exercise.sets, exercise.previous)[index];
  return match ? previousValues(match, units) : null;
}

export function placeholderValue(
  exercise: DraftExercise,
  index: number,
  key: SetValueKey,
  units: Units,
): string {
  const target = exercise.sets[index]?.target;
  const planned = target ? previousValues(target, units)[key] : '';
  if (planned.length > 0) {
    return planned;
  }
  const last = lastTimeValues(exercise, index, units)?.[key] ?? '';
  return last.length > 0
    ? last
    : suggestedValue(exercise.sets[index - 1] ?? null, key);
}

function isPristine(set: DraftSet): boolean {
  return (
    set.completedAt === null &&
    set.weight === '' &&
    set.reps === '' &&
    set.duration === '' &&
    set.distance === ''
  );
}

export function applyPrevious(
  draft: Draft,
  requested: readonly string[],
  items: readonly (PreviousExercise & { exerciseId: string })[],
  newId: IdFactory,
): Draft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) => {
      if (
        exercise.previous !== undefined ||
        !requested.includes(exercise.exerciseId)
      ) {
        return exercise;
      }
      const found = items.find(
        (item) => item.exerciseId === exercise.exerciseId,
      );
      if (!found) {
        return { ...exercise, previous: null };
      }
      const previous: PreviousExercise = {
        workoutId: found.workoutId,
        startedAt: found.startedAt,
        localDate: found.localDate,
        restSeconds: found.restSeconds,
        sets: found.sets,
      };
      const shape =
        exercise.planned !== true &&
        exercise.sets.every((set) => isPristine(set) && set.kind === 'working');
      const sets =
        shape && previous.sets.length > 0
          ? previous.sets
              .slice(0, MAX_SETS)
              .map((set) => emptySet(newId(), set.kind))
          : exercise.sets;
      return {
        ...exercise,
        previous,
        restSeconds:
          exercise.planned === true
            ? (exercise.restSeconds ?? null)
            : (exercise.restSeconds ?? previous.restSeconds),
        sets,
      };
    }),
  };
}

export function applyPreviousToSet(
  draft: Draft,
  exerciseId: string,
  setId: string,
  units: Units,
): Draft {
  return mapExercise(draft, exerciseId, (exercise) => {
    const index = exercise.sets.findIndex((set) => set.id === setId);
    const values = lastTimeValues(exercise, index, units);
    const target = exercise.sets[index];
    if (!values || target?.completedAt !== null) {
      return exercise;
    }
    const patch: Partial<Pick<DraftSet, SetValueKey>> = {};
    for (const rule of exercise.fields) {
      const key = FIELD_KEYS[rule.id];
      patch[key] = values[key];
    }
    return {
      ...exercise,
      sets: exercise.sets.map((set) =>
        set.id === setId ? { ...set, ...patch } : set,
      ),
    };
  });
}

export function toggleSet(
  draft: Draft,
  exerciseId: string,
  setId: string,
  now: Date,
  units: Units = 'kg',
): { draft: Draft; done: boolean } {
  const exercise = draft.exercises.find((item) => item.id === exerciseId);
  const target = exercise?.sets.find((item) => item.id === setId);
  if (!exercise || !target) {
    return { draft, done: false };
  }
  if (target.completedAt !== null) {
    const reopened = mapSet(draft, exerciseId, setId, (set) => ({
      ...set,
      completedAt: null,
    }));
    return {
      draft:
        reopened.rest?.setId === setId ? { ...reopened, rest: null } : reopened,
      done: true,
    };
  }
  const index = exercise.sets.findIndex((item) => item.id === setId);
  const filled = { ...target };
  for (const rule of exercise.fields) {
    const key = FIELD_KEYS[rule.id];
    if (filled[key].trim().length === 0) {
      filled[key] = placeholderValue(exercise, index, key, units);
    }
  }
  if (!isFilled(exercise.fields, filled)) {
    return { draft, done: false };
  }
  const completed = mapSet(draft, exerciseId, setId, () => ({
    ...filled,
    completedAt: now.toISOString(),
  }));
  const rest = exercise.restSeconds ?? 0;
  return {
    draft:
      rest > 0
        ? startRest(completed, rest, now, { exerciseId, setId })
        : completed,
    done: true,
  };
}

export function completedSetCount(draft: Draft): number {
  return draft.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => set.completedAt !== null).length,
    0,
  );
}

export function unfinishedSetCount(draft: Draft): number {
  return draft.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => set.completedAt === null).length,
    0,
  );
}

export function setMeta(
  draft: Draft,
  meta: Partial<Pick<Draft, 'name' | 'notes' | 'startedAt'>>,
): Draft {
  return { ...draft, ...meta };
}

export interface WorkoutSetPayload {
  kind: SetKind;
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
  completedAt: string | null;
}

export interface WorkoutPayload {
  name: string;
  templateId: string | null;
  notes: string | null;
  startedAt: string;
  endedAt: string;
  timeZone: string;
  exercises: {
    exerciseId: string;
    notes: string | null;
    restSeconds: number | null;
    sets: WorkoutSetPayload[];
  }[];
}

export interface MetricSetValues {
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
}

export function setValuesToMetric(
  values: Pick<DraftSet, SetValueKey>,
  units: Units,
): MetricSetValues {
  const weight = parseDecimal(values.weight);
  const distance = parseDecimal(values.distance);
  return {
    weightKg: weight === null ? null : unitsToKg(weight, units),
    reps: parseInteger(values.reps),
    durationS: parseDuration(values.duration),
    distanceM: distance === null ? null : Math.round(distance * 100000) / 100,
  };
}

function orNull(text: string): string | null {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toWorkoutPayload(
  draft: Draft,
  options: { units: Units; timeZone: string; endedAt: Date },
): WorkoutPayload {
  return {
    name: draft.name.trim(),
    templateId: draft.template?.id ?? null,
    notes: orNull(draft.notes),
    startedAt: draft.startedAt,
    endedAt: options.endedAt.toISOString(),
    timeZone: options.timeZone,
    exercises: draft.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      notes: orNull(exercise.notes),
      restSeconds: exercise.restSeconds ?? null,
      sets: exercise.sets.map((set) => ({
        kind: set.kind,
        ...setValuesToMetric(set, options.units),
        completedAt: set.completedAt,
      })),
    })),
  };
}

const SANITIZERS: Readonly<Record<SetValueKey, RegExp>> = {
  weight: /^-?\d*[.,]?\d*$/,
  reps: /^\d*$/,
  duration: /^\d*(:\d*){0,2}$/,
  distance: /^\d*[.,]?\d*$/,
};

const MAX_INPUT_LENGTH = 9;

export function acceptsInput(key: SetValueKey, text: string): boolean {
  return text.length <= MAX_INPUT_LENGTH && SANITIZERS[key].test(text);
}
