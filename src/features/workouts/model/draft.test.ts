import { describe, expect, it } from 'vitest';
import {
  acceptsInput,
  addExercises,
  addSet,
  completedSetCount,
  createDraft,
  draftSchema,
  isFilled,
  MAX_EXERCISES,
  MAX_SETS,
  moveExercise,
  removeExercise,
  removeSet,
  setExerciseNotes,
  setMeta,
  toggleSet,
  toWorkoutPayload,
  unfinishedSetCount,
  updateSet,
  type Draft,
  type FieldRule,
  type PickedExercise,
} from '@/features/workouts/model/draft';

const weightReps: FieldRule[] = [
  { id: 'weightKg', requirement: 'required', min: 0, max: 1000 },
  { id: 'reps', requirement: 'required', min: 0, max: 1000 },
];
const duration: FieldRule[] = [
  { id: 'durationS', requirement: 'required', min: 1, max: 86400 },
];
const distanceDuration: FieldRule[] = [
  { id: 'durationS', requirement: 'any_of', min: 1, max: 86400 },
  { id: 'distanceM', requirement: 'any_of', min: 1, max: 1000000 },
];

function pick(name: string, fields = weightReps): PickedExercise {
  return {
    exerciseId: `ex-${name}`,
    name,
    image: null,
    type: 'weight_reps',
    custom: false,
    fields,
  };
}

function counter(): () => string {
  let next = 0;
  return () => `id-${String(next++)}`;
}

function draftWith(...names: string[]): Draft {
  return addExercises(
    createDraft('w-1', new Date('2026-11-25T10:00:00.000Z')),
    names.map((name) => pick(name)),
    counter(),
  );
}

const now = new Date('2026-11-25T10:20:00.000Z');

describe('draft structure', () => {
  it('starts empty with the start time', () => {
    const draft = createDraft('w-1', now);
    expect(draft).toMatchObject({
      id: 'w-1',
      startedAt: now.toISOString(),
      exercises: [],
    });
    expect(draftSchema.safeParse(draft).success).toBe(true);
  });

  it('adds picked exercises each with one empty set and a rule snapshot', () => {
    const draft = draftWith('Bench', 'Squat');
    expect(draft.exercises.map((item) => item.name)).toEqual([
      'Bench',
      'Squat',
    ]);
    expect(draft.exercises[0]?.sets).toHaveLength(1);
    expect(draft.exercises[0]?.sets[0]?.completedAt).toBeNull();
    expect(draft.exercises[0]?.fields).toEqual(weightReps);
  });

  it('allows the same exercise twice and caps the total', () => {
    const many = Array.from({ length: MAX_EXERCISES + 5 }, (_, index) =>
      pick(`e${String(index)}`),
    );
    const draft = addExercises(createDraft('w-1', now), many, counter());
    expect(draft.exercises).toHaveLength(MAX_EXERCISES);
    const twice = draftWith('Bench', 'Bench');
    expect(twice.exercises[0]?.id).not.toBe(twice.exercises[1]?.id);
  });

  it('removes and moves exercises', () => {
    const draft = draftWith('A', 'B', 'C');
    const [a, b, c] = draft.exercises;
    const moved = moveExercise(draft, c?.id ?? '', -1);
    expect(moved.exercises.map((item) => item.name)).toEqual(['A', 'C', 'B']);
    expect(moveExercise(draft, a?.id ?? '', -1)).toBe(draft);
    expect(moveExercise(draft, c?.id ?? '', 1)).toBe(draft);
    expect(
      removeExercise(draft, b?.id ?? '').exercises.map((item) => item.name),
    ).toEqual(['A', 'C']);
  });

  it('edits notes and meta', () => {
    const draft = draftWith('A');
    const id = draft.exercises[0]?.id ?? '';
    expect(setExerciseNotes(draft, id, 'slow').exercises[0]?.notes).toBe(
      'slow',
    );
    expect(setMeta(draft, { name: 'Push' }).name).toBe('Push');
  });
});

describe('sets', () => {
  it('adds, edits and removes a set', () => {
    const draft = draftWith('A');
    const exerciseId = draft.exercises[0]?.id ?? '';
    const added = addSet(draft, exerciseId, counter());
    expect(added.exercises[0]?.sets).toHaveLength(2);
    const second = added.exercises[0]?.sets[1];
    const edited = updateSet(added, exerciseId, second?.id ?? '', {
      weight: '50',
      kind: 'warmup',
    });
    expect(edited.exercises[0]?.sets[1]).toMatchObject({
      weight: '50',
      kind: 'warmup',
    });
    expect(
      removeSet(edited, exerciseId, second?.id ?? '').exercises[0]?.sets,
    ).toHaveLength(1);
  });

  it('does not add more sets than the limit', () => {
    let draft = draftWith('A');
    const exerciseId = draft.exercises[0]?.id ?? '';
    const next = counter();
    for (let index = 0; index < MAX_SETS + 3; index += 1) {
      draft = addSet(draft, exerciseId, next);
    }
    expect(draft.exercises[0]?.sets).toHaveLength(MAX_SETS);
  });
});

describe('isFilled', () => {
  const values = { weight: '', reps: '', duration: '', distance: '' };

  it('needs every required field', () => {
    expect(isFilled(weightReps, { ...values, weight: '50' })).toBe(false);
    expect(isFilled(weightReps, { ...values, weight: '50', reps: '5' })).toBe(
      true,
    );
    expect(isFilled(weightReps, { ...values, weight: '0', reps: '0' })).toBe(
      true,
    );
  });

  it('needs at least one of the any_of fields', () => {
    expect(isFilled(distanceDuration, values)).toBe(false);
    expect(isFilled(distanceDuration, { ...values, distance: '5' })).toBe(true);
    expect(isFilled(distanceDuration, { ...values, duration: '30' })).toBe(
      true,
    );
  });
});

describe('toggleSet', () => {
  function ids(draft: Draft): { exerciseId: string; setId: string } {
    return {
      exerciseId: draft.exercises[0]?.id ?? '',
      setId: draft.exercises[0]?.sets[0]?.id ?? '',
    };
  }

  it('completes a filled set and stamps the time', () => {
    const base = draftWith('A');
    const { exerciseId, setId } = ids(base);
    const filled = updateSet(base, exerciseId, setId, {
      weight: '60',
      reps: '8',
    });
    const result = toggleSet(filled, exerciseId, setId, now);
    expect(result.done).toBe(true);
    expect(result.draft.exercises[0]?.sets[0]?.completedAt).toBe(
      now.toISOString(),
    );
  });

  it('refuses to complete an empty set that has nothing to copy', () => {
    const base = draftWith('A');
    const { exerciseId, setId } = ids(base);
    const result = toggleSet(base, exerciseId, setId, now);
    expect(result.done).toBe(false);
    expect(result.draft).toBe(base);
  });

  it('fills the empty fields from the previous set when completing', () => {
    const base = draftWith('A');
    const { exerciseId, setId } = ids(base);
    let draft = updateSet(base, exerciseId, setId, {
      weight: '60',
      reps: '8',
    });
    draft = toggleSet(draft, exerciseId, setId, now).draft;
    draft = addSet(draft, exerciseId, counter());
    const second = draft.exercises[0]?.sets[1];
    const result = toggleSet(draft, exerciseId, second?.id ?? '', now);
    expect(result.done).toBe(true);
    expect(result.draft.exercises[0]?.sets[1]).toMatchObject({
      weight: '60',
      reps: '8',
    });
  });

  it('keeps what the user typed and only fills the gaps', () => {
    const base = draftWith('A');
    const { exerciseId, setId } = ids(base);
    let draft = updateSet(base, exerciseId, setId, {
      weight: '60',
      reps: '8',
    });
    draft = toggleSet(draft, exerciseId, setId, now).draft;
    draft = addSet(draft, exerciseId, counter());
    const second = draft.exercises[0]?.sets[1]?.id ?? '';
    draft = updateSet(draft, exerciseId, second, { weight: '65' });
    const result = toggleSet(draft, exerciseId, second, now);
    expect(result.draft.exercises[0]?.sets[1]).toMatchObject({
      weight: '65',
      reps: '8',
    });
  });

  it('reopens a completed set and keeps its values', () => {
    const base = draftWith('A');
    const { exerciseId, setId } = ids(base);
    const filled = updateSet(base, exerciseId, setId, {
      weight: '60',
      reps: '8',
    });
    const done = toggleSet(filled, exerciseId, setId, now).draft;
    const reopened = toggleSet(done, exerciseId, setId, now);
    expect(reopened.draft.exercises[0]?.sets[0]).toMatchObject({
      weight: '60',
      completedAt: null,
    });
  });

  it('ignores an unknown set', () => {
    const base = draftWith('A');
    expect(toggleSet(base, 'nope', 'nope', now)).toEqual({
      draft: base,
      done: false,
    });
  });

  it('works for duration based exercises', () => {
    const base = addExercises(
      createDraft('w-1', now),
      [pick('Plank', duration)],
      counter(),
    );
    const { exerciseId, setId } = ids(base);
    const filled = updateSet(base, exerciseId, setId, { duration: '1:00' });
    expect(toggleSet(filled, exerciseId, setId, now).done).toBe(true);
  });
});

describe('counters', () => {
  it('counts completed and unfinished sets', () => {
    const base = draftWith('A');
    const exerciseId = base.exercises[0]?.id ?? '';
    const setId = base.exercises[0]?.sets[0]?.id ?? '';
    let draft = updateSet(base, exerciseId, setId, { weight: '1', reps: '1' });
    draft = toggleSet(draft, exerciseId, setId, now).draft;
    draft = addSet(draft, exerciseId, counter());
    expect(completedSetCount(draft)).toBe(1);
    expect(unfinishedSetCount(draft)).toBe(1);
  });
});

describe('toWorkoutPayload', () => {
  it('converts the text values to the API units', () => {
    let draft = draftWith('A');
    const exerciseId = draft.exercises[0]?.id ?? '';
    const setId = draft.exercises[0]?.sets[0]?.id ?? '';
    draft = updateSet(draft, exerciseId, setId, {
      weight: '225',
      reps: '5',
      duration: '1:30',
      distance: '1,5',
    });
    draft = toggleSet(draft, exerciseId, setId, now).draft;
    draft = setMeta(draft, { name: '  Push  ', notes: '   ' });
    draft = setExerciseNotes(draft, exerciseId, ' slow ');
    const payload = toWorkoutPayload(draft, {
      units: 'lb',
      timeZone: 'Europe/Kyiv',
      endedAt: new Date('2026-11-25T11:00:00.000Z'),
    });
    expect(payload).toEqual({
      name: 'Push',
      notes: null,
      startedAt: '2026-11-25T10:00:00.000Z',
      endedAt: '2026-11-25T11:00:00.000Z',
      timeZone: 'Europe/Kyiv',
      exercises: [
        {
          exerciseId: 'ex-A',
          notes: 'slow',
          sets: [
            {
              kind: 'working',
              weightKg: 102.058,
              reps: 5,
              durationS: 90,
              distanceM: 1500,
              completedAt: now.toISOString(),
            },
          ],
        },
      ],
    });
  });

  it('sends nulls for empty values and keeps unfinished sets unfinished', () => {
    const draft = draftWith('A');
    const payload = toWorkoutPayload(draft, {
      units: 'kg',
      timeZone: 'UTC',
      endedAt: now,
    });
    expect(payload.exercises[0]?.sets[0]).toEqual({
      kind: 'working',
      weightKg: null,
      reps: null,
      durationS: null,
      distanceM: null,
      completedAt: null,
    });
  });
});

describe('acceptsInput', () => {
  it.each([
    ['weight', '82.5', true],
    ['weight', '-20', true],
    ['weight', '8a', false],
    ['reps', '12', true],
    ['reps', '1.5', false],
    ['reps', '-1', false],
    ['duration', '1:30', true],
    ['duration', '1:2:3', true],
    ['duration', '1:2:3:4', false],
    ['distance', '5,2', true],
    ['distance', '-1', false],
    ['weight', '1234567890', false],
  ] as const)('%s "%s" -> %s', (key, text, expected) => {
    expect(acceptsInput(key, text)).toBe(expected);
  });
});
