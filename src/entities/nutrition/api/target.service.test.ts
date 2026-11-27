import { describe, expect, it, vi } from 'vitest';
import {
  fetchTarget,
  requestAutoTarget,
  setManualTarget,
} from '@/entities/nutrition/api/target.service';
import type { ApiClient } from '@/shared/api/client';
import { ApiError } from '@/shared/api/error';

function clientWith(overrides: Partial<ApiClient>): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

const target = {
  effectiveFrom: '2026-11-27',
  source: 'auto',
  caloriesKcal: 2400,
  proteinG: 160,
  fatG: 70,
  carbsG: 280,
  bmrKcal: 1800,
  tdeeKcal: 2790,
  floorApplied: false,
  inputs: {
    sex: 'male',
    age: 36,
    heightCm: 180,
    weightKg: 82.4,
    activityLevel: 'moderate',
    goalType: 'lose',
    rateKgPerWeek: 0.5,
  },
};

describe('target service', () => {
  it('asks for the target on a date', async () => {
    const get = vi.fn(() => Promise.resolve(target));

    await expect(
      fetchTarget('2026-11-27', clientWith({ get })),
    ).resolves.toMatchObject({ caloriesKcal: 2400 });
    expect(get).toHaveBeenCalledWith('/nutrition/target', {
      date: '2026-11-27',
    });
  });

  it('returns null while there is no target yet', async () => {
    const client = clientWith({
      get: vi.fn(() =>
        Promise.reject(new ApiError(404, 'TARGET_NOT_FOUND', 'x')),
      ),
    });

    await expect(fetchTarget('2026-11-27', client)).resolves.toBeNull();
  });

  it('accepts a manual target without the formula parts', async () => {
    const put = vi.fn(() =>
      Promise.resolve({
        ...target,
        source: 'manual',
        bmrKcal: null,
        tdeeKcal: null,
        inputs: null,
      }),
    );

    const saved = await setManualTarget(
      2500,
      '2026-11-27',
      clientWith({ put }),
    );

    expect(saved.source).toBe('manual');
    expect(put).toHaveBeenCalledWith('/nutrition/target/manual', {
      caloriesKcal: 2500,
      today: '2026-11-27',
    });
  });

  it('goes back to the formula', async () => {
    const put = vi.fn(() => Promise.resolve(target));

    await requestAutoTarget('2026-11-27', clientWith({ put }));

    expect(put).toHaveBeenCalledWith('/nutrition/target/auto', {
      today: '2026-11-27',
    });
  });
});
