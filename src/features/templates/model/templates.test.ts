import { describe, expect, it } from 'vitest';
import {
  addExercises,
  addSet,
  canSave,
  createEditor,
  editorFromTemplate,
  editorFromWorkout,
  isDirty,
  moveExercise,
  removeSet,
  setExerciseRest,
  setName,
  toPayload,
  updateSet,
  type EditorSource,
} from '@/features/templates/model/editor';
import { changeLabel, copyName } from '@/features/templates/model/summary';
import { computeTemplateUpdate } from '@/features/templates/model/update-from-workout';
import {
  draftFromTemplate,
  placeholderValue,
  toggleSet,
  toWorkoutPayload,
  updateSet as updateDraftSet,
  applyPrevious,
  removeExercise as removeDraftExercise,
  type FieldRule,
} from '@/entities/training/model/draft';

const fields: FieldRule[] = [
  { id: 'weightKg', requirement: 'required', min: 0, max: 1000 },
  { id: 'reps', requirement: 'required', min: 0, max: 1000 },
];
const fieldsOf = (): FieldRule[] => fields;

function counter(): () => string {
  let next = 0;
  return () => `id-${String(next++)}`;
}

const source: EditorSource & { id: string } = {
  id: 'tpl-1',
  name: 'Push day',
  notes: null,
  exercises: [
    {
      exerciseId: 'bench',
      name: 'Bench press',
      image: null,
      type: 'weight_reps',
      custom: false,
      notes: 'slow',
      restSeconds: 90,
      sets: [
        {
          kind: 'warmup',
          weightKg: 40,
          reps: 10,
          durationS: null,
          distanceM: null,
        },
        {
          kind: 'working',
          weightKg: 60,
          reps: 8,
          durationS: null,
          distanceM: null,
        },
      ],
    },
    {
      exerciseId: 'ohp',
      name: 'Overhead press',
      image: null,
      type: 'weight_reps',
      custom: false,
      notes: null,
      restSeconds: null,
      sets: [
        {
          kind: 'working',
          weightKg: 30,
          reps: 10,
          durationS: null,
          distanceM: null,
        },
      ],
    },
  ],
};

describe('template editor model', () => {
  it('starts clean and needs a name and an exercise to be saved', () => {
    let editor = createEditor('t-1', 'kg');
    expect(isDirty(editor)).toBe(false);
    expect(canSave(editor)).toBe(false);
    editor = setName(editor, 'Legs');
    expect(isDirty(editor)).toBe(true);
    expect(canSave(editor)).toBe(false);
    editor = addExercises(
      editor,
      [
        {
          exerciseId: 'squat',
          name: 'Squat',
          image: null,
          type: 'weight_reps',
          custom: false,
          fields,
        },
      ],
      counter(),
    );
    expect(canSave(editor)).toBe(true);
    expect(editor.exercises[0]?.sets).toHaveLength(1);
  });

  it('converts values to metric units in the payload', () => {
    const newId = counter();
    let editor = createEditor('t-1', 'lb');
    editor = setName(editor, '  Legs ');
    editor = addExercises(
      editor,
      [
        {
          exerciseId: 'squat',
          name: 'Squat',
          image: null,
          type: 'weight_reps',
          custom: false,
          fields,
        },
      ],
      newId,
    );
    const exercise = editor.exercises[0];
    const setId = exercise?.sets[0]?.id ?? '';
    editor = updateSet(editor, exercise?.id ?? '', setId, {
      weight: '225',
      reps: '5',
    });
    editor = setExerciseRest(editor, exercise?.id ?? '', 120);
    expect(toPayload(editor)).toEqual({
      name: 'Legs',
      notes: null,
      exercises: [
        {
          exerciseId: 'squat',
          notes: null,
          restSeconds: 120,
          sets: [
            {
              kind: 'working',
              weightKg: 102.058,
              reps: 5,
              durationS: null,
              distanceM: null,
            },
          ],
        },
      ],
    });
  });

  it('is not dirty right after loading an existing program and tracks edits', () => {
    const newId = counter();
    let editor = editorFromTemplate('tpl-1', source, 'kg', fieldsOf, newId);
    expect(editor.mode).toBe('edit');
    expect(isDirty(editor)).toBe(false);
    expect(editor.exercises[0]?.sets[1]?.weight).toBe('60');
    const first = editor.exercises[0]?.id ?? '';
    editor = moveExercise(editor, first, 1);
    expect(isDirty(editor)).toBe(true);
    editor = moveExercise(editor, first, -1);
    expect(isDirty(editor)).toBe(false);
  });

  it('copies the last set when adding a set and keeps at least one set', () => {
    const newId = counter();
    let editor = editorFromTemplate('tpl-1', source, 'kg', fieldsOf, newId);
    const ohp = editor.exercises[1]?.id ?? '';
    editor = addSet(editor, ohp, newId);
    expect(editor.exercises[1]?.sets.map((set) => set.weight)).toEqual([
      '30',
      '30',
    ]);
    const [, second] = editor.exercises[1]?.sets ?? [];
    editor = removeSet(editor, ohp, second?.id ?? '');
    const [only] = editor.exercises[1]?.sets ?? [];
    editor = removeSet(editor, ohp, only?.id ?? '');
    expect(editor.exercises[1]?.sets).toHaveLength(1);
  });

  it('builds a new program from a workout that is not yet saved', () => {
    const editor = editorFromWorkout('t-9', source, 'kg', fieldsOf, counter());
    expect(editor.mode).toBe('new');
    expect(editor.templateId).toBe('t-9');
    expect(isDirty(editor)).toBe(true);
    expect(canSave(editor)).toBe(true);
  });
});

describe('start from a program', () => {
  it('prefills planned exercises with target placeholders and keeps the rest', () => {
    const draft = draftFromTemplate(
      'w-1',
      new Date('2026-11-26T10:00:00.000Z'),
      source,
      fieldsOf,
      counter(),
    );
    expect(draft.name).toBe('Push day');
    expect(draft.template?.id).toBe('tpl-1');
    const bench = draft.exercises[0];
    expect(bench?.planned).toBe(true);
    expect(bench?.restSeconds).toBe(90);
    expect(bench?.notes).toBe('slow');
    expect(bench?.sets.map((set) => set.kind)).toEqual(['warmup', 'working']);
    expect(bench?.sets[0]?.weight).toBe('');
    expect(bench ? placeholderValue(bench, 1, 'weight', 'kg') : '').toBe('60');
    expect(bench ? placeholderValue(bench, 1, 'reps', 'kg') : '').toBe('8');
  });

  it('shows targets in the user units', () => {
    const draft = draftFromTemplate(
      'w-1',
      new Date(),
      source,
      fieldsOf,
      counter(),
    );
    const bench = draft.exercises[0];
    expect(bench ? placeholderValue(bench, 1, 'weight', 'lb') : '').toBe(
      '132.28',
    );
  });

  it('prefers the target over last time and does not reshape planned sets', () => {
    const base = draftFromTemplate(
      'w-1',
      new Date(),
      source,
      fieldsOf,
      counter(),
    );
    const draft = applyPrevious(
      base,
      ['bench'],
      [
        {
          exerciseId: 'bench',
          workoutId: 'w-0',
          startedAt: '2026-11-20T10:00:00.000Z',
          localDate: '2026-11-20',
          restSeconds: 45,
          sets: [
            {
              kind: 'working',
              weightKg: 55,
              reps: 12,
              durationS: null,
              distanceM: null,
            },
          ],
        },
      ],
      counter(),
    );
    const bench = draft.exercises[0];
    expect(bench?.sets).toHaveLength(2);
    expect(bench?.restSeconds).toBe(90);
    expect(bench ? placeholderValue(bench, 1, 'weight', 'kg') : '').toBe('60');
  });

  it('sends the program id with the saved workout', () => {
    const draft = draftFromTemplate(
      'w-1',
      new Date('2026-11-26T10:00:00.000Z'),
      source,
      fieldsOf,
      counter(),
    );
    const payload = toWorkoutPayload(draft, {
      units: 'kg',
      timeZone: 'Europe/Kyiv',
      endedAt: new Date('2026-11-26T11:00:00.000Z'),
    });
    expect(payload.templateId).toBe('tpl-1');
  });
});

function finished() {
  const newId = counter();
  const base = draftFromTemplate(
    'w-1',
    new Date('2026-11-26T10:00:00.000Z'),
    source,
    fieldsOf,
    newId,
  );
  return base;
}

function complete(
  draft: ReturnType<typeof finished>,
  exerciseIndex: number,
  setIndex: number,
  values: { weight?: string; reps?: string },
  units: 'kg' | 'lb' = 'kg',
) {
  const exercise = draft.exercises[exerciseIndex];
  const set = exercise?.sets[setIndex];
  let next = updateDraftSet(draft, exercise?.id ?? '', set?.id ?? '', values);
  next = toggleSet(
    next,
    exercise?.id ?? '',
    set?.id ?? '',
    new Date('2026-11-26T10:30:00.000Z'),
    units,
  ).draft;
  return next;
}

describe('computeTemplateUpdate', () => {
  it('returns null when the workout was not started from a program', () => {
    const draft = { ...finished(), template: null };
    expect(computeTemplateUpdate(draft, 'kg')).toBeNull();
  });

  it('returns null when everything was done exactly as planned', () => {
    let draft = finished();
    draft = complete(draft, 0, 0, { weight: '40', reps: '10' });
    draft = complete(draft, 0, 1, { weight: '60', reps: '8' });
    draft = complete(draft, 1, 0, { weight: '30', reps: '10' });
    expect(computeTemplateUpdate(draft, 'kg')).toBeNull();
  });

  it('makes completed values the new targets', () => {
    let draft = finished();
    draft = complete(draft, 0, 0, { weight: '40', reps: '10' });
    draft = complete(draft, 0, 1, { weight: '62.5', reps: '8' });
    draft = complete(draft, 1, 0, { weight: '30', reps: '10' });
    const update = computeTemplateUpdate(draft, 'kg');
    expect(update?.changes).toEqual([{ kind: 'values', name: 'Bench press' }]);
    expect(update?.payload.exercises[0]?.sets[1]?.weightKg).toBe(62.5);
    expect(update?.payload.exercises[0]?.notes).toBe('slow');
    expect(update?.payload.name).toBe('Push day');
  });

  it('keeps old targets for unfinished sets of planned exercises', () => {
    let draft = finished();
    draft = complete(draft, 0, 1, { weight: '65', reps: '8' });
    const update = computeTemplateUpdate(draft, 'kg');
    expect(update?.changes).toEqual([{ kind: 'values', name: 'Bench press' }]);
    expect(update?.payload.exercises).toHaveLength(2);
    expect(update?.payload.exercises[0]?.sets[0]?.weightKg).toBe(40);
    expect(update?.payload.exercises[1]?.sets[0]?.weightKg).toBe(30);
  });

  it('reports removed exercises', () => {
    const draft = removeDraftExercise(
      finished(),
      finished().exercises[1]?.id ?? '',
    );
    const base = finished();
    const update = computeTemplateUpdate(
      { ...draft, id: base.id, template: base.template },
      'kg',
    );
    expect(update?.changes).toEqual([
      { kind: 'removed', name: 'Overhead press' },
    ]);
    expect(update?.payload.exercises.map((e) => e.exerciseId)).toEqual([
      'bench',
    ]);
  });

  it('reports added exercises, set count and rest changes', () => {
    let draft = finished();
    draft = complete(draft, 0, 0, { weight: '40', reps: '10' });
    draft = complete(draft, 0, 1, { weight: '60', reps: '8' });
    draft = complete(draft, 1, 0, { weight: '30', reps: '10' });
    const bench = draft.exercises[0];
    draft = {
      ...draft,
      exercises: [
        {
          ...draft.exercises[0],
          restSeconds: 120,
          sets: [
            ...(bench?.sets ?? []),
            {
              id: 'extra',
              kind: 'working' as const,
              weight: '60',
              reps: '8',
              duration: '',
              distance: '',
              completedAt: '2026-11-26T10:30:00.000Z',
            },
          ],
        } as NonNullable<typeof bench>,
        ...draft.exercises.slice(1),
        {
          id: 'new',
          exerciseId: 'dips',
          name: 'Dips',
          image: null,
          type: 'weight_reps',
          custom: false,
          fields,
          notes: '',
          sets: [
            {
              id: 'dips-1',
              kind: 'working' as const,
              weight: '',
              reps: '12',
              duration: '',
              distance: '',
              completedAt: '2026-11-26T10:40:00.000Z',
            },
          ],
        },
      ],
    };
    const update = computeTemplateUpdate(draft, 'kg');
    expect(update?.changes).toEqual([
      { kind: 'rest', name: 'Bench press', from: 90, to: 120 },
      { kind: 'sets', name: 'Bench press', from: 2, to: 3 },
      { kind: 'added', name: 'Dips' },
    ]);
    expect(update?.payload.exercises).toHaveLength(3);
  });

  it('does not report a change for pounds finished as planned', () => {
    let draft = finished();
    draft = complete(draft, 0, 0, {}, 'lb');
    draft = complete(draft, 0, 1, {}, 'lb');
    draft = complete(draft, 1, 0, {}, 'lb');
    expect(computeTemplateUpdate(draft, 'lb')).toBeNull();
  });
});

describe('summary helpers', () => {
  it('shortens a name to fit the copy suffix', () => {
    expect(copyName('Push day', '(copy)', 80)).toBe('Push day (copy)');
    const long = 'x'.repeat(80);
    const copy = copyName(long, '(copy)', 80);
    expect(copy).toHaveLength(80);
    expect(copy.endsWith(' (copy)')).toBe(true);
  });

  it('describes changes', () => {
    const t = ((key: string, options?: Record<string, unknown>) =>
      `${key}:${JSON.stringify(options ?? {})}`) as never;
    expect(changeLabel({ kind: 'order' }, t)).toContain(
      'templates.update.order',
    );
    expect(
      changeLabel({ kind: 'rest', name: 'A', from: null, to: 90 }, t),
    ).toContain('"to":"1:30"');
  });
});
