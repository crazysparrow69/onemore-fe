import { describe, expect, it } from 'vitest';
import {
  matchPrevious,
  previousValues,
  type PreviousExercise,
  type PreviousSet,
} from '@/features/workouts/model/previous';

function set(kind: PreviousSet['kind'], weightKg: number, reps: number) {
  return { kind, weightKg, reps, durationS: null, distanceM: null };
}

const previous: PreviousExercise = {
  workoutId: 'w-0',
  startedAt: '2026-11-20T10:00:00.000Z',
  localDate: '2026-11-20',
  restSeconds: 90,
  sets: [
    set('warmup', 40, 12),
    set('working', 80, 10),
    set('working', 82.5, 8),
    set('drop', 60, 12),
  ],
};

describe('matchPrevious', () => {
  it('matches warm-ups with warm-ups and the rest by order', () => {
    const matched = matchPrevious(
      [
        { kind: 'warmup' },
        { kind: 'working' },
        { kind: 'working' },
        { kind: 'working' },
        { kind: 'working' },
      ],
      previous,
    );
    expect(matched.map((item) => item?.weightKg ?? null)).toEqual([
      40,
      80,
      82.5,
      60,
      null,
    ]);
  });

  it('does not borrow a working set for a second warm-up', () => {
    const matched = matchPrevious(
      [{ kind: 'warmup' }, { kind: 'warmup' }, { kind: 'working' }],
      previous,
    );
    expect(matched.map((item) => item?.weightKg ?? null)).toEqual([
      40,
      null,
      80,
    ]);
  });

  it.each([null, undefined])('returns nothing when history is %s', (value) => {
    expect(matchPrevious([{ kind: 'working' }], value)).toEqual([null]);
  });
});

describe('previousValues', () => {
  it('converts the stored metric values to input text in the user units', () => {
    const value = {
      kind: 'working' as const,
      weightKg: 100,
      reps: 5,
      durationS: 90,
      distanceM: 5123,
    };
    expect(previousValues(value, 'kg')).toEqual({
      weight: '100',
      reps: '5',
      duration: '1:30',
      distance: '5.123',
    });
    expect(previousValues(value, 'lb').weight).toBe('220.46');
  });

  it('leaves absent values empty', () => {
    expect(
      previousValues(
        {
          kind: 'working',
          weightKg: null,
          reps: 12,
          durationS: null,
          distanceM: null,
        },
        'kg',
      ),
    ).toEqual({ weight: '', reps: '12', duration: '', distance: '' });
  });
});
