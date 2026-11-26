import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';
import { getSession } from '@/features/auth/api/auth.service';
import {
  fetchCurrentUser,
  type CurrentUser,
} from '@/features/auth/api/current-user.service';
import {
  fetchExerciseDictionaries,
  fetchExercises,
  type ExerciseDictionaries,
  type ExerciseListItem,
} from '@/features/exercises/api/exercises.service';
import {
  deleteWorkout,
  fetchWorkout,
  fetchWorkouts,
  saveWorkout,
  type WorkoutDetails,
} from '@/features/workouts/api/workouts.service';
import { useDraftStore } from '@/features/workouts/model/draft-store';

vi.mock('@/features/auth/api/auth.service', () => ({
  getSession: vi.fn(() => Promise.resolve({ email: 'ada@example.com' })),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithEmail: vi.fn(() => Promise.resolve()),
  signUpWithEmail: vi.fn(() => Promise.resolve()),
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  getAccessToken: vi.fn(() => Promise.resolve(null)),
  refreshAccessToken: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/features/auth/api/current-user.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/auth/api/current-user.service')
  >()),
  fetchCurrentUser: vi.fn(),
}));

vi.mock(
  '@/features/exercises/api/exercises.service',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/features/exercises/api/exercises.service')
    >()),
    fetchExercises: vi.fn(),
    fetchExerciseDictionaries: vi.fn(),
  }),
);

vi.mock('@/features/workouts/api/workouts.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/workouts/api/workouts.service')
  >()),
  saveWorkout: vi.fn(),
  fetchWorkouts: vi.fn(),
  fetchWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
}));

const user: CurrentUser = {
  id: 'user-1',
  email: 'ada@example.com',
  name: 'Ada',
  nickname: null,
  role: 'user',
  language: 'en',
  units: 'kg',
  timeZone: 'Europe/Kyiv',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const dictionaries: ExerciseDictionaries = {
  locale: 'en',
  muscleGroups: [
    {
      id: 'upper_body',
      label: 'Upper body',
      muscles: [{ id: 'chest', label: 'Chest', primaryOnly: false }],
    },
  ],
  equipment: [{ id: 'barbell', label: 'Barbell' }],
  types: [
    {
      id: 'weight_reps',
      label: 'Weight and reps',
      example: 'Bench press',
      fields: [
        { id: 'weightKg', requirement: 'required', min: 0, max: 1000 },
        { id: 'reps', requirement: 'required', min: 0, max: 1000 },
      ],
    },
  ],
  categories: [],
  levels: [],
  forces: [],
  mechanics: [],
};

const bench: ExerciseListItem = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Bench press',
  type: 'weight_reps',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'barbell',
  image: null,
  custom: false,
};

const saved: WorkoutDetails = {
  id: '019a0000-0000-7000-8000-000000000000',
  name: 'Evening workout',
  notes: null,
  startedAt: '2026-11-25T10:00:00.000Z',
  endedAt: '2026-11-25T11:00:00.000Z',
  localDate: '2026-11-25',
  timeZone: 'Europe/Kyiv',
  summary: { durationS: 3600, volumeKg: 480, setCount: 1, exerciseCount: 1 },
  exercises: [
    {
      id: 'se-1',
      exerciseId: bench.id,
      name: 'Bench press',
      image: null,
      type: 'weight_reps',
      custom: false,
      notes: null,
      sets: [
        {
          kind: 'working',
          weightKg: 60,
          reps: 8,
          durationS: null,
          distanceM: null,
          completedAt: '2026-11-25T10:20:00.000Z',
        },
      ],
    },
  ],
};

async function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createAppRouter(history, client);
  await router.load();
  render(<App router={router} queryClient={client} />);
  return history;
}

describe('workouts', () => {
  beforeEach(() => {
    localStorage.clear();
    useDraftStore.setState({ ownerId: null, draft: null });
    vi.mocked(getSession).mockResolvedValue({ email: 'ada@example.com' });
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(fetchExerciseDictionaries).mockResolvedValue(dictionaries);
    vi.mocked(fetchExercises).mockImplementation((_filters, _offset, limit) =>
      Promise.resolve({
        items: limit === 1 ? [] : [bench],
        total: limit === 1 ? 0 : 1,
        nextOffset: null,
      }),
    );
    vi.mocked(saveWorkout).mockResolvedValue(saved);
    vi.mocked(fetchWorkout).mockResolvedValue(saved);
    vi.mocked(fetchWorkouts).mockResolvedValue({
      items: [],
      total: 0,
      nextOffset: null,
    });
    vi.mocked(deleteWorkout).mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('logs a workout from the home screen to the saved card', async () => {
    const history = await renderAt('/');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Start workout' }),
    );
    await waitFor(() => {
      expect(history.location.pathname).toBe('/workout');
    });

    fireEvent.click(await screen.findByRole('link', { name: 'Add exercise' }));
    fireEvent.click(await screen.findByRole('button', { name: /Bench press/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add (1)' }));

    await waitFor(() => {
      expect(history.location.pathname).toBe('/workout');
    });
    expect(await screen.findByText('Bench press')).toBeTruthy();

    fireEvent.change(screen.getByRole('textbox', { name: 'KG' }), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'REPS' }), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark set 1 as done' }));
    expect(
      screen.getByRole('button', { name: 'Mark set 1 as not done' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'Finish' }));
    await waitFor(() => {
      expect(history.location.pathname).toBe('/workout/finish');
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(history.location.pathname).toBe(`/workouts/${saved.id}`);
    });
    expect(saveWorkout).toHaveBeenCalledTimes(1);
    const [, payload] = vi.mocked(saveWorkout).mock.calls[0] ?? [];
    expect(payload).toMatchObject({
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      exercises: [
        {
          exerciseId: bench.id,
          sets: [{ kind: 'working', weightKg: 60, reps: 8 }],
        },
      ],
    });
    await waitFor(() => {
      expect(useDraftStore.getState().draft).toBeNull();
    });
    expect(await screen.findByText('Evening workout')).toBeTruthy();
  });

  it('keeps the draft when saving fails', async () => {
    vi.mocked(saveWorkout).mockRejectedValue(new Error('offline'));
    const history = await renderAt('/');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Start workout' }),
    );
    await screen.findByRole('link', { name: 'Add exercise' });
    useDraftStore.getState().addExercises([
      {
        exerciseId: bench.id,
        name: bench.name,
        image: null,
        type: bench.type,
        custom: false,
        fields: dictionaries.types[0]?.fields ?? [],
      },
    ]);
    const draft = useDraftStore.getState().draft;
    const exercise = draft?.exercises[0];
    const setId = exercise?.sets[0]?.id ?? '';
    useDraftStore
      .getState()
      .changeSet(exercise?.id ?? '', setId, { weight: '50', reps: '5' });
    useDraftStore.getState().toggleSet(exercise?.id ?? '', setId);

    history.push('/workout/finish');
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveWorkout).toHaveBeenCalled();
    });
    expect(history.location.pathname).toBe('/workout/finish');
    expect(useDraftStore.getState().draft).not.toBeNull();
  });

  it('shows an empty history', async () => {
    await renderAt('/workouts');
    expect(await screen.findByText('No workouts yet')).toBeTruthy();
  });

  it('lists the saved workouts', async () => {
    vi.mocked(fetchWorkouts).mockResolvedValue({
      items: [
        {
          ...saved,
          exercises: [
            {
              exerciseId: bench.id,
              name: 'Bench press',
              image: null,
              setCount: 1,
            },
          ],
        },
      ],
      total: 1,
      nextOffset: null,
    });
    await renderAt('/workouts');
    expect(await screen.findByText('Evening workout')).toBeTruthy();
    expect(screen.getByText(/Bench press/)).toBeTruthy();
  });

  it('deletes a workout from its card', async () => {
    const history = await renderAt(`/workouts/${saved.id}`);
    expect(await screen.findByText('Evening workout')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Workout menu' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteWorkout).toHaveBeenCalledWith(saved.id);
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/workouts');
    });
  });

  it('shows the active workout bar outside the workout screens', async () => {
    useDraftStore.getState().start(user.id);
    await renderAt('/exercises');
    expect(
      await screen.findByRole('link', { name: /Workout in progress/ }),
    ).toBeTruthy();
  });

  it('does not show a draft of another account', async () => {
    useDraftStore.getState().start('someone-else');
    await renderAt('/');
    expect(
      await screen.findByRole('button', { name: 'Start workout' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('link', { name: /Workout in progress/ }),
    ).toBeNull();
  });
});
