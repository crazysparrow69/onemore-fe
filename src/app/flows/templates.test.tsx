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
import { getSession } from '@/entities/user/api/auth.service';
import {
  fetchCurrentUser,
  type CurrentUser,
} from '@/entities/user/api/current-user.service';
import {
  fetchExerciseDictionaries,
  fetchExercises,
  type ExerciseDictionaries,
  type ExerciseListItem,
} from '@/entities/exercise/api/exercises.service';
import {
  archiveTemplate,
  fetchTemplate,
  fetchTemplates,
  saveTemplate,
  type Template,
} from '@/features/templates/api/templates.service';
import { useEditorStore } from '@/features/templates/model/editor-store';
import {
  fetchPreviousSets,
  fetchWorkout,
  fetchWorkouts,
  saveWorkout,
  type WorkoutDetails,
} from '@/entities/training/api/workouts.service';
import { useDraftStore } from '@/entities/training/model/draft-store';

vi.mock('@/entities/user/api/auth.service', () => ({
  getSession: vi.fn(() => Promise.resolve({ email: 'ada@example.com' })),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithEmail: vi.fn(() => Promise.resolve()),
  signUpWithEmail: vi.fn(() => Promise.resolve()),
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  getAccessToken: vi.fn(() => Promise.resolve(null)),
  refreshAccessToken: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/entities/user/api/current-user.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/entities/user/api/current-user.service')
  >()),
  fetchCurrentUser: vi.fn(),
}));

vi.mock(
  '@/entities/exercise/api/exercises.service',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/entities/exercise/api/exercises.service')
    >()),
    fetchExercises: vi.fn(),
    fetchExerciseDictionaries: vi.fn(),
  }),
);

vi.mock('@/entities/training/api/workouts.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/entities/training/api/workouts.service')
  >()),
  saveWorkout: vi.fn(),
  fetchWorkouts: vi.fn(),
  fetchWorkout: vi.fn(),
  fetchPreviousSets: vi.fn(),
}));

vi.mock(
  '@/features/templates/api/templates.service',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/features/templates/api/templates.service')
    >()),
    saveTemplate: vi.fn(),
    fetchTemplates: vi.fn(),
    fetchTemplate: vi.fn(),
    archiveTemplate: vi.fn(),
  }),
);

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
  avatar: null,
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

const program: Template = {
  id: '019a1000-0000-7000-8000-000000000000',
  name: 'Push day',
  notes: null,
  createdAt: '2026-11-20T10:00:00.000Z',
  updatedAt: '2026-11-20T10:00:00.000Z',
  lastPerformedAt: null,
  exercises: [
    {
      exerciseId: bench.id,
      name: 'Bench press',
      image: null,
      type: 'weight_reps',
      custom: false,
      archived: false,
      notes: null,
      restSeconds: 90,
      sets: [
        {
          kind: 'working',
          weightKg: 60,
          reps: 8,
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
  ],
};

const savedWorkout: WorkoutDetails = {
  id: '019a0000-0000-7000-8000-000000000000',
  name: 'Push day',
  notes: null,
  templateId: program.id,
  startedAt: '2026-11-26T10:00:00.000Z',
  endedAt: '2026-11-26T11:00:00.000Z',
  localDate: '2026-11-26',
  timeZone: 'Europe/Kyiv',
  summary: { durationS: 3600, volumeKg: 480, setCount: 1, exerciseCount: 1 },
  exercises: [],
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

async function clickWhenEnabled(name: string) {
  const button = await screen.findByRole('button', { name });
  await waitFor(() => {
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
  fireEvent.click(button);
}

describe('programs', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useDraftStore.setState({ ownerId: null, draft: null });
    useEditorStore.setState({ ownerId: null, editor: null });
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
    vi.mocked(fetchTemplates).mockResolvedValue({ items: [program] });
    vi.mocked(fetchTemplate).mockResolvedValue(program);
    vi.mocked(saveTemplate).mockImplementation((id) =>
      Promise.resolve({ ...program, id }),
    );
    vi.mocked(archiveTemplate).mockResolvedValue();
    vi.mocked(saveWorkout).mockResolvedValue(savedWorkout);
    vi.mocked(fetchWorkout).mockResolvedValue(savedWorkout);
    vi.mocked(fetchWorkouts).mockResolvedValue({
      items: [],
      total: 0,
      nextOffset: null,
    });
    vi.mocked(fetchPreviousSets).mockResolvedValue({ items: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the empty state', async () => {
    vi.mocked(fetchTemplates).mockResolvedValue({ items: [] });
    await renderAt('/training');
    expect(await screen.findByText('No programs yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New program' })).toBeTruthy();
  });

  it('lists programs with their exercises', async () => {
    await renderAt('/training');
    expect(await screen.findByText('Push day')).toBeTruthy();
    expect(screen.getByText('Bench press')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start program' })).toBeTruthy();
  });

  it('starts a workout from a program with the targets as hints', async () => {
    const history = await renderAt('/training');
    await clickWhenEnabled('Start program');
    await waitFor(() => {
      expect(history.location.pathname).toBe('/workout');
    });
    const draft = useDraftStore.getState().draft;
    expect(draft?.template?.id).toBe(program.id);
    expect(draft?.exercises[0]?.sets).toHaveLength(2);
    expect(draft?.exercises[0]?.restSeconds).toBe(90);

    const weights = await screen.findAllByRole('textbox', { name: 'KG' });
    expect(weights).toHaveLength(2);
    expect(weights[0]?.getAttribute('placeholder')).toBe('60');
    expect((weights[0] as HTMLInputElement).value).toBe('');
  });

  it('asks what to do when a workout is already in progress', async () => {
    useDraftStore.getState().start(user.id);
    const history = await renderAt('/training');
    await clickWhenEnabled('Start program');
    const dialog = await screen.findByRole('dialog');
    expect(useDraftStore.getState().draft?.template).toBeFalsy();

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel and start' }),
    );
    await waitFor(() => {
      expect(history.location.pathname).toBe('/workout');
    });
    expect(useDraftStore.getState().draft?.template?.id).toBe(program.id);
  });

  it('archives a program from its menu', async () => {
    await renderAt('/training');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Menu of program "Push day"' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(archiveTemplate).toHaveBeenCalledWith(program.id);
    });
  });

  it('shows the program page with its sets', async () => {
    await renderAt(`/programs/${program.id}`);
    expect(await screen.findByText('Push day')).toBeTruthy();
    expect(screen.getAllByText('60 kg × 8')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Start program' })).toBeTruthy();
  });

  it('creates a program through the editor', async () => {
    const history = await renderAt('/training');
    await clickWhenEnabled('New program');
    await waitFor(() => {
      expect(history.location.pathname).toBe('/programs/new');
    });

    const save = await screen.findByRole('button', { name: 'Save' });
    expect((save as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByRole('textbox', { name: 'Program name' }), {
      target: { value: 'Legs' },
    });
    fireEvent.click(screen.getByRole('link', { name: 'Add exercise' }));
    fireEvent.click(await screen.findByRole('button', { name: /Bench press/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add (1)' }));
    await waitFor(() => {
      expect(history.location.pathname).toBe('/programs/new');
    });

    fireEvent.change(await screen.findByRole('textbox', { name: /KG/ }), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /REPS/ }), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveTemplate).toHaveBeenCalledTimes(1);
    });
    const [id, payload] = vi.mocked(saveTemplate).mock.calls[0] ?? [];
    expect(id).toBeTruthy();
    expect(payload).toEqual({
      name: 'Legs',
      notes: null,
      exercises: [
        {
          exerciseId: bench.id,
          notes: null,
          restSeconds: null,
          sets: [
            {
              kind: 'working',
              weightKg: 70,
              reps: 5,
              durationS: null,
              distanceM: null,
            },
          ],
        },
      ],
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe(`/programs/${String(id)}`);
    });
    await waitFor(() => {
      expect(useEditorStore.getState().editor).toBeNull();
    });
  });

  it('keeps the editor open when saving fails', async () => {
    vi.mocked(saveTemplate).mockRejectedValue(new Error('offline'));
    const history = await renderAt('/training');
    await clickWhenEnabled('New program');
    fireEvent.change(
      await screen.findByRole('textbox', { name: 'Program name' }),
      {
        target: { value: 'Legs' },
      },
    );
    useEditorStore.getState().addExercises([
      {
        exerciseId: bench.id,
        name: bench.name,
        image: null,
        type: bench.type,
        custom: false,
        fields: dictionaries.types[0]?.fields ?? [],
      },
    ]);
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(saveTemplate).toHaveBeenCalled();
    });
    expect(history.location.pathname).toBe('/programs/new');
    expect(useEditorStore.getState().editor).not.toBeNull();
  });

  it('edits an existing program', async () => {
    const history = await renderAt(`/programs/${program.id}/edit`);
    const name = await screen.findByRole('textbox', { name: 'Program name' });
    expect((name as HTMLInputElement).value).toBe('Push day');
    fireEvent.change(name, { target: { value: 'Push A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(saveTemplate).toHaveBeenCalledWith(
        program.id,
        expect.objectContaining({ name: 'Push A' }),
      );
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe(`/programs/${program.id}`);
    });
  });

  it('asks before discarding unsaved changes', async () => {
    const history = await renderAt(`/programs/${program.id}/edit`);
    const name = await screen.findByRole('textbox', { name: 'Program name' });
    fireEvent.change(name, { target: { value: 'Push A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard' }));
    await waitFor(() => {
      expect(history.location.pathname).toBe(`/programs/${program.id}`);
    });
    expect(saveTemplate).not.toHaveBeenCalled();
  });

  async function finishProgramWorkout(weight: string) {
    const history = await renderAt('/training');
    await clickWhenEnabled('Start program');
    await screen.findAllByRole('textbox', { name: 'KG' });
    const draft = useDraftStore.getState().draft;
    const exercise = draft?.exercises[0];
    for (const [index, set] of (exercise?.sets ?? []).entries()) {
      useDraftStore.getState().changeSet(exercise?.id ?? '', set.id, {
        weight: index === 0 ? weight : '60',
        reps: '8',
      });
      useDraftStore
        .getState()
        .toggleSet(exercise?.id ?? '', set.id, user.units);
    }
    history.push('/workout/finish');
    return history;
  }

  it('offers to update the program after a changed workout', async () => {
    const history = await finishProgramWorkout('65');
    const toggle = await screen.findByRole('switch', {
      name: /Update program/,
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByText(/new weights or reps/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveTemplate).toHaveBeenCalledTimes(1);
    });
    const [id, payload] = vi.mocked(saveTemplate).mock.calls[0] ?? [];
    expect(id).toBe(program.id);
    expect(payload?.exercises[0]?.sets[0]?.weightKg).toBe(65);
    await waitFor(() => {
      expect(history.location.pathname).toBe(`/workouts/${savedWorkout.id}`);
    });
    expect(vi.mocked(saveWorkout).mock.calls[0]?.[1]).toMatchObject({
      templateId: program.id,
    });
  });

  it('leaves the program alone when the switch stays off', async () => {
    await finishProgramWorkout('65');
    await screen.findByRole('switch', { name: /Update program/ });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(saveWorkout).toHaveBeenCalled();
    });
    expect(saveTemplate).not.toHaveBeenCalled();
  });

  it('does not offer an update when the workout matched the program', async () => {
    await finishProgramWorkout('60');
    await screen.findByRole('button', { name: 'Save' });
    expect(screen.queryByRole('switch', { name: /Update program/ })).toBeNull();
  });

  it('still saves the workout when the program update fails', async () => {
    vi.mocked(saveTemplate).mockRejectedValue(new Error('offline'));
    const history = await finishProgramWorkout('65');
    fireEvent.click(
      await screen.findByRole('switch', { name: /Update program/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(history.location.pathname).toBe(`/workouts/${savedWorkout.id}`);
    });
    expect(saveWorkout).toHaveBeenCalledTimes(1);
  });

  it('saves a finished workout as a program', async () => {
    vi.mocked(fetchWorkout).mockResolvedValue({
      ...savedWorkout,
      exercises: [
        {
          id: 'se-1',
          exerciseId: bench.id,
          name: 'Bench press',
          image: null,
          type: 'weight_reps',
          custom: false,
          notes: null,
          restSeconds: 90,
          sets: [
            {
              kind: 'working',
              weightKg: 60,
              reps: 8,
              durationS: null,
              distanceM: null,
              completedAt: '2026-11-26T10:20:00.000Z',
            },
          ],
        },
      ],
    });
    const history = await renderAt(`/workouts/${savedWorkout.id}`);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Workout menu' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Save as program' }),
    );
    await waitFor(() => {
      expect(history.location.pathname).toBe('/programs/new');
    });
    const name = await screen.findByRole('textbox', { name: 'Program name' });
    expect((name as HTMLInputElement).value).toBe('Push day');
    const weight = await screen.findByRole('textbox', { name: /KG/ });
    expect((weight as HTMLInputElement).value).toBe('60');
  });
});
