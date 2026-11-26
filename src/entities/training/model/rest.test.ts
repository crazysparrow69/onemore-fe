import { describe, expect, it } from 'vitest';
import {
  addExercises,
  createDraft,
  draftSchema,
  removeExercise,
  removeSet,
  toggleSet,
  updateSet,
  type Draft,
} from '@/entities/training/model/draft';
import {
  adjustRest,
  restLeftSeconds,
  setRestSeconds,
  skipRest,
  startRest,
} from '@/entities/training/model/rest';

const now = new Date('2026-11-25T10:20:00.000Z');
const fields = [
  {
    id: 'weightKg' as const,
    requirement: 'required' as const,
    min: 0,
    max: 1000,
  },
  { id: 'reps' as const, requirement: 'required' as const, min: 0, max: 1000 },
];

function started(): { draft: Draft; exerciseId: string; setId: string } {
  let next = 0;
  const draft = addExercises(
    createDraft('w-1', now),
    [
      {
        exerciseId: 'ex-A',
        name: 'A',
        image: null,
        type: 'weight_reps',
        custom: false,
        fields,
      },
    ],
    () => `id-${String(next++)}`,
  );
  const exercise = draft.exercises[0];
  return {
    draft,
    exerciseId: exercise?.id ?? '',
    setId: exercise?.sets[0]?.id ?? '',
  };
}

function filled() {
  const base = started();
  return {
    ...base,
    draft: updateSet(base.draft, base.exerciseId, base.setId, {
      weight: '60',
      reps: '8',
    }),
  };
}

describe('rest timer', () => {
  it('is off by default and does not start without a rest time', () => {
    const { draft, exerciseId, setId } = filled();
    expect(draft.exercises[0]?.restSeconds).toBeNull();
    const result = toggleSet(draft, exerciseId, setId, now);
    expect(result.draft.rest ?? null).toBeNull();
  });

  it('starts after a set is completed when the exercise has a rest time', () => {
    const base = filled();
    const draft = setRestSeconds(base.draft, base.exerciseId, 90);
    const result = toggleSet(draft, base.exerciseId, base.setId, now);
    expect(result.draft.rest).toEqual({
      endsAt: now.getTime() + 90_000,
      durationS: 90,
      exerciseId: base.exerciseId,
      setId: base.setId,
    });
  });

  it('is cancelled when the same set is unchecked', () => {
    const base = filled();
    let draft = setRestSeconds(base.draft, base.exerciseId, 90);
    draft = toggleSet(draft, base.exerciseId, base.setId, now).draft;
    draft = toggleSet(draft, base.exerciseId, base.setId, now).draft;
    expect(draft.rest).toBeNull();
  });

  it('is cancelled when its set or exercise is removed', () => {
    const base = filled();
    let draft = setRestSeconds(base.draft, base.exerciseId, 90);
    draft = toggleSet(draft, base.exerciseId, base.setId, now).draft;
    expect(removeSet(draft, base.exerciseId, base.setId).rest).toBeNull();
    expect(removeExercise(draft, base.exerciseId).rest).toBeNull();
  });

  it('is kept when another set is removed', () => {
    const base = filled();
    const draft = startRest(base.draft, 60, now);
    expect(removeSet(draft, base.exerciseId, 'other').rest).not.toBeNull();
  });

  it('can be started by hand and replaces the running one', () => {
    const first = startRest(started().draft, 60, now);
    const second = startRest(first, 120, now);
    expect(second.rest).toMatchObject({
      durationS: 120,
      exerciseId: null,
      setId: null,
    });
  });

  it('adjusts the end time and stops when nothing is left', () => {
    const draft = startRest(started().draft, 60, now);
    const longer = adjustRest(draft, 15, now);
    expect(longer.rest?.endsAt).toBe(now.getTime() + 75_000);
    expect(longer.rest?.durationS).toBe(75);
    const later = new Date(now.getTime() + 50_000);
    expect(adjustRest(draft, -15, later).rest).toBeNull();
  });

  it('is skipped', () => {
    const draft = startRest(started().draft, 60, now);
    expect(skipRest(draft).rest).toBeNull();
  });

  it('counts the seconds left up to the full second', () => {
    const rest = startRest(started().draft, 60, now).rest;
    if (!rest) {
      throw new Error('rest expected');
    }
    expect(restLeftSeconds(rest, now.getTime() + 500)).toBe(60);
    expect(restLeftSeconds(rest, now.getTime() + 59_100)).toBe(1);
    expect(restLeftSeconds(rest, now.getTime() + 61_000)).toBe(0);
  });

  it('survives the draft schema, and old drafts without the new fields still load', () => {
    const draft = startRest(
      setRestSeconds(started().draft, 'id-0', 90),
      60,
      now,
    );
    expect(draftSchema.safeParse(draft).success).toBe(true);
    const legacy = {
      id: 'w-1',
      startedAt: now.toISOString(),
      name: '',
      notes: '',
      exercises: [
        {
          id: 'e1',
          exerciseId: 'ex-A',
          name: 'A',
          image: null,
          type: 'weight_reps',
          custom: false,
          fields,
          notes: '',
          sets: [],
        },
      ],
    };
    expect(draftSchema.safeParse(legacy).success).toBe(true);
  });
});
