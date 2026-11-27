import { describe, expect, it, vi } from 'vitest';
import {
  deleteWeight,
  fetchBody,
  fetchGoal,
  fetchLatestWeight,
  fetchWeightLog,
  saveBody,
  saveGoal,
  saveWeight,
} from '@/entities/body/api/body.service';
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

const body = {
  sex: 'male',
  birthDate: '1990-05-17',
  heightCm: 180,
  activityLevel: 'moderate',
  proteinGPerKg: null,
  fatSharePercent: null,
  updatedAt: '2026-11-27T10:00:00.000Z',
};

const goal = {
  type: 'lose',
  rateKgPerWeek: 0.5,
  targetWeightKg: 80,
  effectiveFrom: '2026-11-27',
};

const entry = {
  localDate: '2026-11-27',
  weightKg: 82.4,
  note: null,
  updatedAt: '2026-11-27T10:00:00.000Z',
};

describe('missing records', () => {
  it('turns the not found codes into null', async () => {
    const missing = (code: string) =>
      clientWith({
        get: vi.fn(() => Promise.reject(new ApiError(404, code, 'x'))),
      });

    await expect(
      fetchBody(missing('BODY_PROFILE_NOT_FOUND')),
    ).resolves.toBeNull();
    await expect(fetchGoal(missing('GOAL_NOT_FOUND'))).resolves.toBeNull();
    await expect(
      fetchLatestWeight(missing('WEIGHT_NOT_FOUND')),
    ).resolves.toBeNull();
  });

  it('rethrows every other error', async () => {
    const client = clientWith({
      get: vi.fn(() =>
        Promise.reject(new ApiError(500, 'INTERNAL_ERROR', 'x')),
      ),
    });

    await expect(fetchBody(client)).rejects.toBeInstanceOf(ApiError);
  });

  it('does not hide a 404 with another code', async () => {
    const client = clientWith({
      get: vi.fn(() => Promise.reject(new ApiError(404, 'NOT_FOUND', 'x'))),
    });

    await expect(fetchGoal(client)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('reads', () => {
  it('parses the body, the goal and the weight log', async () => {
    const get = vi.fn((path: string) => {
      if (path === '/body') {
        return Promise.resolve(body);
      }
      if (path === '/goals/current') {
        return Promise.resolve(goal);
      }
      return Promise.resolve({ items: [entry] });
    });
    const client = clientWith({ get });

    await expect(fetchBody(client)).resolves.toMatchObject({ heightCm: 180 });
    await expect(fetchGoal(client)).resolves.toMatchObject({ type: 'lose' });
    await expect(fetchWeightLog({ to: '2026-11-26' }, client)).resolves.toEqual(
      [entry],
    );
    expect(get).toHaveBeenLastCalledWith('/weight', {
      limit: 30,
      from: undefined,
      to: '2026-11-26',
    });
  });

  it('rejects a response of the wrong shape', async () => {
    const client = clientWith({
      get: vi.fn(() => Promise.resolve({ sex: 'robot' })),
    });

    await expect(fetchBody(client)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});

describe('writes', () => {
  it('sends today with the body and the goal', async () => {
    const put = vi.fn((path: string) =>
      Promise.resolve(path === '/body' ? body : goal),
    );
    const client = clientWith({ put });

    await saveBody(
      {
        sex: 'male',
        birthDate: '1990-05-17',
        heightCm: 180,
        activityLevel: 'moderate',
        proteinGPerKg: 1.4,
        fatSharePercent: null,
      },
      '2026-11-27',
      client,
    );
    await saveGoal(
      { type: 'lose', rateKgPerWeek: 0.5, targetWeightKg: null },
      '2026-11-27',
      client,
    );

    expect(put).toHaveBeenNthCalledWith(1, '/body', {
      sex: 'male',
      birthDate: '1990-05-17',
      heightCm: 180,
      activityLevel: 'moderate',
      proteinGPerKg: 1.4,
      fatSharePercent: null,
      today: '2026-11-27',
    });
    expect(put).toHaveBeenNthCalledWith(2, '/goals/current', {
      type: 'lose',
      rateKgPerWeek: 0.5,
      targetWeightKg: null,
      today: '2026-11-27',
    });
  });

  it('keys the weight by its date', async () => {
    const put = vi.fn(() => Promise.resolve(entry));
    const del = vi.fn(() => Promise.resolve());
    const client = clientWith({ put, delete: del });

    await saveWeight(
      '2026-11-20',
      { weightKg: 82.4, note: 'morning' },
      '2026-11-27',
      client,
    );
    await deleteWeight('2026-11-20', '2026-11-27', client);

    expect(put).toHaveBeenCalledWith('/weight/2026-11-20', {
      weightKg: 82.4,
      note: 'morning',
      today: '2026-11-27',
    });
    expect(del).toHaveBeenCalledWith('/weight/2026-11-20?today=2026-11-27');
  });
});
