import { describe, expect, it, vi } from 'vitest';
import {
  createExercise,
  deleteExercise,
  exerciseImageUrl,
  fetchExercise,
  fetchExerciseDictionaries,
  fetchExercises,
  updateExercise,
  type ExerciseInput,
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
  custom: false,
};

function clientWith(get: ApiClient['get']): ApiClient {
  return {
    get,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
}

describe('fetchExercises', () => {
  it('sends the filters as comma-separated params', async () => {
    const get = vi.fn(() =>
      Promise.resolve({ items: [item], total: 1, nextOffset: null }),
    );

    const result = await fetchExercises(
      {
        q: 'press',
        muscle: ['chest', 'triceps'],
        equipment: ['barbell'],
        mine: true,
      },
      50,
      25,
      clientWith(get),
    );

    expect(get).toHaveBeenCalledWith('/exercises', {
      q: 'press',
      muscle: 'chest,triceps',
      equipment: 'barbell',
      mine: 'true',
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
      { q: '', muscle: [], equipment: [], mine: false },
      0,
      undefined,
      clientWith(get),
    );

    expect(get).toHaveBeenCalledWith('/exercises', {
      q: undefined,
      muscle: undefined,
      equipment: undefined,
      mine: undefined,
      offset: 0,
      limit: 50,
    });
  });

  it('rejects a malformed response', async () => {
    const client = clientWith(() => Promise.resolve({ items: 'nope' }));

    await expect(
      fetchExercises(
        { q: '', muscle: [], equipment: [], mine: false },
        0,
        50,
        client,
      ),
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
      typeLocked: false,
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

describe('creating, replacing and deleting an own exercise', () => {
  const input: ExerciseInput = {
    name: 'Hammer press',
    type: 'weight_reps',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    equipment: 'machine',
    instructions: ['Press'],
  };
  const details = {
    ...item,
    id: '22222222-2222-4222-8222-222222222222',
    custom: true,
    imageKeys: [],
    category: null,
    force: null,
    mechanic: null,
    level: null,
    instructions: ['Press'],
    typeLocked: false,
  };

  it('posts the input and parses the created exercise', async () => {
    const post = vi.fn(() => Promise.resolve(details));
    const client = { ...clientWith(vi.fn()), post };

    await expect(createExercise(input, client)).resolves.toEqual(details);
    expect(post).toHaveBeenCalledWith('/exercises', input);
  });

  it('puts the input to the exercise url', async () => {
    const put = vi.fn(() => Promise.resolve(details));
    const client = { ...clientWith(vi.fn()), put };

    await expect(updateExercise(details.id, input, client)).resolves.toEqual(
      details,
    );
    expect(put).toHaveBeenCalledWith(`/exercises/${details.id}`, input);
  });

  it('rejects a malformed created exercise', async () => {
    const client = {
      ...clientWith(vi.fn()),
      post: vi.fn(() => Promise.resolve({ id: 1 })),
    };

    await expect(createExercise(input, client)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('sends DELETE to the exercise url', async () => {
    const remove = vi.fn(() => Promise.resolve());
    const client = { ...clientWith(vi.fn()), delete: remove };

    await deleteExercise(details.id, client);

    expect(remove).toHaveBeenCalledWith(`/exercises/${details.id}`);
  });

  it('passes API errors through', async () => {
    const client = {
      ...clientWith(vi.fn()),
      post: vi.fn(() =>
        Promise.reject(new ApiError(409, 'EXERCISE_LIMIT_REACHED', 'limit')),
      ),
    };

    await expect(createExercise(input, client)).rejects.toMatchObject({
      code: 'EXERCISE_LIMIT_REACHED',
    });
  });
});
