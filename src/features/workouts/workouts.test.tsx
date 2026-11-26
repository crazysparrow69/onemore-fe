import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import {
  act,
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
  fetchPreviousSets,
  fetchWorkout,
  fetchWorkouts,
  saveWorkout,
  type WorkoutDetails,
} from '@/features/workouts/api/workouts.service';
import { useDraftStore } from '@/features/workouts/model/draft-store';
import { playRestSignal } from '@/shared/lib/rest-signal';

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
  fetchPreviousSets: vi.fn(),
}));

vi.mock('@/shared/lib/rest-signal', () => ({
  playRestSignal: vi.fn(),
  unlockRestAudio: vi.fn(),
  restSoundEnabled: vi.fn(() => true),
  setRestSoundEnabled: vi.fn(),
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
  templateId: null,
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
      restSeconds: null,
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
    vi.mocked(fetchPreviousSets).mockResolvedValue({ items: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('logs a workout from the training tab to the saved card', async () => {
    const history = await renderAt('/training');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Start empty workout' }),
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
    const history = await renderAt('/training');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Start empty workout' }),
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
    useDraftStore.getState().toggleSet(exercise?.id ?? '', setId, 'kg');

    history.push('/workout/finish');
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveWorkout).toHaveBeenCalled();
    });
    expect(history.location.pathname).toBe('/workout/finish');
    expect(useDraftStore.getState().draft).not.toBeNull();
  });

  it('shows an empty history', async () => {
    await renderAt('/profile');
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
    await renderAt('/profile');
    expect(await screen.findByText('Evening workout')).toBeTruthy();
    expect(screen.getByText(/Bench press/)).toBeTruthy();
  });

  it('continues the draft from the training tab', async () => {
    useDraftStore.getState().start(user.id);
    await renderAt('/training');
    expect(
      await screen.findByRole('button', { name: 'Continue workout' }),
    ).toBeTruthy();
  });

  it('shows the last workout on home', async () => {
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
    await renderAt('/');
    expect(await screen.findByText('Last workout')).toBeTruthy();
    expect(await screen.findByText('Evening workout')).toBeTruthy();
  });

  it('points to the training tab when there is no workout yet', async () => {
    await renderAt('/');
    expect(await screen.findByText('No workouts yet')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Go to Training' }).getAttribute('href'),
    ).toBe('/training');
  });

  it('shows the user data and the exercises link on the profile', async () => {
    await renderAt('/profile');
    expect(await screen.findByText('Ada')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Exercises' }).getAttribute('href'),
    ).toBe('/exercises');
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
      expect(history.location.pathname).toBe('/profile');
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
    await renderAt('/training');
    expect(
      await screen.findByRole('button', { name: 'Start empty workout' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('link', { name: /Workout in progress/ }),
    ).toBeNull();
  });

  async function startWithBench() {
    useDraftStore.getState().start(user.id);
    useDraftStore.getState().addExercises([
      {
        exerciseId: bench.id,
        name: bench.name,
        image: null,
        type: 'weight_reps',
        custom: false,
        fields: [
          { id: 'weightKg', requirement: 'required', min: 0, max: 1000 },
          { id: 'reps', requirement: 'required', min: 0, max: 1000 },
        ],
      },
    ]);
    return renderAt('/workout');
  }

  it('shows what was lifted last time and copies it on tap', async () => {
    vi.mocked(fetchPreviousSets).mockResolvedValue({
      items: [
        {
          exerciseId: bench.id,
          workoutId: 'w-0',
          startedAt: '2026-11-20T10:00:00.000Z',
          localDate: '2026-11-20',
          restSeconds: null,
          sets: [
            {
              kind: 'working',
              weightKg: 60,
              reps: 12,
              durationS: null,
              distanceM: null,
            },
            {
              kind: 'working',
              weightKg: 80,
              reps: 10,
              durationS: null,
              distanceM: null,
            },
          ],
        },
      ],
    });
    await startWithBench();

    expect(await screen.findByText('60 kg × 12')).toBeTruthy();
    expect(screen.getByText('80 kg × 10')).toBeTruthy();
    expect(fetchPreviousSets).toHaveBeenCalledWith([bench.id]);
    expect(screen.getAllByRole('textbox', { name: 'KG' })).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /last time.*set 2/ }));
    const [, secondWeight] = screen.getAllByRole('textbox', { name: 'KG' });
    const [, secondReps] = screen.getAllByRole('textbox', { name: 'REPS' });
    expect((secondWeight as HTMLInputElement).value).toBe('80');
    expect((secondReps as HTMLInputElement).value).toBe('10');

    fireEvent.click(screen.getByRole('button', { name: 'Mark set 1 as done' }));
    const draft = useDraftStore.getState().draft;
    expect(draft?.exercises[0]?.sets[0]).toMatchObject({
      weight: '60',
      reps: '12',
    });
  });

  it('shows a dash when there is no history', async () => {
    await startWithBench();

    expect(await screen.findByText('—')).toBeTruthy();
    await waitFor(() => {
      expect(useDraftStore.getState().draft?.exercises[0]?.previous).toBeNull();
    });
  });

  it('starts the rest timer after a set and lets you skip it', async () => {
    await startWithBench();
    fireEvent.click(await screen.findByRole('button', { name: 'Rest: off' }));
    const sheet = await screen.findByRole('dialog');
    fireEvent.click(within(sheet).getByText('1:30'));
    expect(
      await screen.findByRole('button', { name: 'Rest: 1:30' }),
    ).toBeTruthy();

    fireEvent.change(screen.getByRole('textbox', { name: 'KG' }), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'REPS' }), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark set 1 as done' }));

    const panel = await screen.findByRole('timer');
    expect(within(panel).getByText('1:30')).toBeTruthy();

    fireEvent.click(within(panel).getByRole('button', { name: /Skip/ }));
    await waitFor(() => {
      expect(screen.queryByRole('timer')).toBeNull();
    });
  });

  it('signals when the rest time is over', async () => {
    await startWithBench();
    await screen.findByRole('button', { name: 'Rest: off' });

    act(() => {
      useDraftStore.setState((state) =>
        state.draft
          ? {
              draft: {
                ...state.draft,
                rest: {
                  endsAt: Date.now() - 500,
                  durationS: 60,
                  exerciseId: null,
                  setId: null,
                },
              },
            }
          : state,
      );
    });

    await waitFor(() => {
      expect(playRestSignal).toHaveBeenCalledTimes(1);
    });
    expect(useDraftStore.getState().draft?.rest).toBeNull();
  });

  it('stays quiet when the rest ended long ago', async () => {
    await startWithBench();
    await screen.findByRole('button', { name: 'Rest: off' });

    act(() => {
      useDraftStore.setState((state) =>
        state.draft
          ? {
              draft: {
                ...state.draft,
                rest: {
                  endsAt: Date.now() - 60_000,
                  durationS: 60,
                  exerciseId: null,
                  setId: null,
                },
              },
            }
          : state,
      );
    });

    await waitFor(() => {
      expect(useDraftStore.getState().draft?.rest).toBeNull();
    });
    expect(playRestSignal).not.toHaveBeenCalled();
  });
});
