import { describe, expect, it, vi } from 'vitest';
import {
  exerciseImageUrl,
  fetchExercise,
  fetchExerciseDictionaries,
  fetchExercises,
} from '@/features/exercises/api/exercises.service';
import { ApiError } from '@/shared/api/error';
import type { ApiClient } from '@/shared/api/client';

const item = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Bench press',
  type: 'weight_reps',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'barbell',
  image: 'exercises/bench/0.webp',
};

function clientWith(get: ApiClient['get']): ApiClient {
  return { get, put: vi.fn(), patch: vi.fn() };
}

describe('fetchExercises', () => {
  it('sends the filters as comma-separated params', async () => {
    const get = vi.fn(() =>
      Promise.resolve({ items: [item], total: 1, nextOffset: null }),
    );

    const result = await fetchExercises(
      { q: 'press', muscle: ['chest', 'triceps'], equipment: ['barbell'] },
      50,
      25,
      clientWith(get),
    );

    expect(get).toHaveBeenCalledWith('/exercises', {
      q: 'press',
      muscle: 'chest,triceps',
      equipment: 'barbell',
      offset: 50,
      limit: 25,
    });
    expect(result.items).toEqual([item]);
  });

  it('leaves empty filters out', async () => {
    const get = vi.fn(() =>
      Promise.resolve({ items: [], total: 0, nextOffset: null }),
    );

    await fetchExercises(
      { q: '', muscle: [], equipment: [] },
      0,
      undefined,
      clientWith(get),
    );

    expect(get).toHaveBeenCalledWith('/exercises', {
      q: undefined,
      muscle: undefined,
      equipment: undefined,
      offset: 0,
      limit: 50,
    });
  });

  it('rejects a malformed response', async () => {
    const client = clientWith(() => Promise.resolve({ items: 'nope' }));

    await expect(
      fetchExercises({ q: '', muscle: [], equipment: [] }, 0, 50, client),
    ).rejects.toMatchObject({ status: 500, code: 'INVALID_RESPONSE' });
  });
});

describe('fetchExercise', () => {
  it('requests one exercise and parses the details', async () => {
    const details = {
      ...item,
      imageKeys: ['exercises/bench/0.webp', 'exercises/bench/1.webp'],
      category: 'strength',
      force: 'push',
      mechanic: 'compound',
      level: 'beginner',
      instructions: ['Lie down', 'Press'],
    };
    const get = vi.fn(() => Promise.resolve(details));

    await expect(fetchExercise(item.id, clientWith(get))).resolves.toEqual(
      details,
    );
    expect(get).toHaveBeenCalledWith(`/exercises/${item.id}`);
  });

  it('passes an API error through', async () => {
    const error = new ApiError(404, 'EXERCISE_NOT_FOUND', 'Not found');
    const client = clientWith(() => Promise.reject(error));

    await expect(fetchExercise(item.id, client)).rejects.toBe(error);
  });
});

describe('fetchExerciseDictionaries', () => {
  it('rejects a response without the groups', async () => {
    const client = clientWith(() => Promise.resolve({ locale: 'en' }));

    await expect(fetchExerciseDictionaries(client)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});

describe('exerciseImageUrl', () => {
  it('turns an image key into a public path', () => {
    expect(exerciseImageUrl('exercises/bench/0.webp')).toBe(
      '/exercises/bench/0.webp',
    );
  });
});
