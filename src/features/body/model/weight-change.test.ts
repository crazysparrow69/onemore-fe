import { describe, expect, it } from 'vitest';
import type { WeightEntry } from '@/entities/body/model/schemas';
import { weightChangeKg } from '@/features/body/model/weight-change';

function entry(localDate: string, weightKg: number): WeightEntry {
  return {
    localDate,
    weightKg,
    note: null,
    updatedAt: `${localDate}T08:00:00Z`,
  };
}

describe('weightChangeKg', () => {
  it('compares the newest entry with the oldest one in the window', () => {
    expect(
      weightChangeKg([
        entry('2026-11-27', 81.2),
        entry('2026-11-20', 82),
        entry('2026-11-01', 82.4),
      ]),
    ).toBe(-1.2);
  });

  it('has nothing to compare with fewer than two dates', () => {
    expect(weightChangeKg([])).toBeNull();
    expect(weightChangeKg([entry('2026-11-27', 81.2)])).toBeNull();
  });

  it('shows a gain as a positive number', () => {
    expect(
      weightChangeKg([entry('2026-11-27', 83), entry('2026-11-10', 82.5)]),
    ).toBe(0.5);
  });
});
