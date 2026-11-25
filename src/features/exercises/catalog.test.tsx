import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';
import { getSession } from '@/features/auth/api/auth.service';
import type { CurrentUser } from '@/features/auth/api/current-user.service';
import { fetchCurrentUser } from '@/features/auth/api/current-user.service';
import {
  deleteExercise,
  fetchExercise,
  fetchExerciseDictionaries,
  fetchExercises,
  type ExerciseDetails,
  type ExerciseDictionaries,
  type ExerciseListItem,
} from '@/features/exercises/api/exercises.service';
import { ApiError } from '@/shared/api/error';

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
    fetchExercise: vi.fn(),
    fetchExerciseDictionaries: vi.fn(),
    deleteExercise: vi.fn(),
  }),
);

const user: CurrentUser = {
  id: 'user-1',
  email: 'ada@example.com',
  name: 'Ada',
  nickname: null,
  role: 'user',
  language: 'uk',
  units: 'kg',
  timeZone: 'Europe/Kyiv',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const dictionaries: ExerciseDictionaries = {
  locale: 'uk',
  muscleGroups: [
    {
      id: 'upper_body',
      label: 'Верх тіла',
      muscles: [
        { id: 'chest', label: 'Груди', primaryOnly: false },
        { id: 'triceps', label: 'Трицепс', primaryOnly: false },
      ],
    },
  ],
  equipment: [
    { id: 'none', label: 'Власна вага' },
    { id: 'barbell', label: 'Штанга' },
    { id: 'dumbbell', label: 'Гантелі' },
  ],
  types: [],
  categories: [{ id: 'strength', label: 'Силові' }],
  levels: [{ id: 'beginner', label: 'Початківець' }],
  forces: [],
  mechanics: [],
};

const bench: ExerciseListItem = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Жим штанги лежачи',
  type: 'weight_reps',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'barbell',
  image: 'exercises/bench/0.webp',
  custom: false,
};

const details: ExerciseDetails = {
  ...bench,
  imageKeys: ['exercises/bench/0.webp', 'exercises/bench/1.webp'],
  category: 'strength',
  force: null,
  mechanic: null,
  level: 'beginner',
  instructions: ['Ляжте на лаву', 'Опустіть штангу до грудей'],
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

function lastListCall(): unknown[] | undefined {
  return vi
    .mocked(fetchExercises)
    .mock.calls.filter(([, , limit]) => limit !== 1)
    .at(-1);
}

describe('exercise catalog', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue({ email: 'ada@example.com' });
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(fetchExerciseDictionaries).mockResolvedValue(dictionaries);
    vi.mocked(fetchExercises).mockImplementation((_filters, _offset, limit) =>
      Promise.resolve({
        items: limit === 1 ? [] : [bench],
        total: limit === 1 ? 7 : 1,
        nextOffset: null,
      }),
    );
    vi.mocked(fetchExercise).mockResolvedValue(details);
  });

  it('lists exercises with their primary muscles', async () => {
    await renderAt('/exercises');

    expect(await screen.findByText('Жим штанги лежачи')).toBeTruthy();
    expect(await screen.findByText('Груди')).toBeTruthy();
    expect(screen.getByText('Усі вправи')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Усе обладнання' })).toBeTruthy();
    expect(screen.getByRole('button', { name: "Усі м'язи" })).toBeTruthy();
  });

  it('puts the search text into the URL and asks the backend', async () => {
    const history = await renderAt('/exercises');
    await screen.findByText('Жим штанги лежачи');

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'жим' },
    });

    await waitFor(() => {
      expect(history.location.search).toContain('q=');
    });
    await waitFor(() => {
      expect(lastListCall()?.[0]).toEqual({
        q: 'жим',
        muscle: [],
        equipment: [],
        mine: false,
      });
    });
    expect(await screen.findByText('Знайдено: 1')).toBeTruthy();
  });

  it('applies several equipment values chosen in the sheet', async () => {
    const history = await renderAt('/exercises');
    await screen.findByText('Жим штанги лежачи');

    fireEvent.click(screen.getByRole('button', { name: 'Усе обладнання' }));
    const sheet = await screen.findByRole('dialog');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Штанга' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Гантелі' }));

    const show = await within(sheet).findByRole('button', {
      name: 'Показати 7 результатів',
    });
    fireEvent.click(show);

    await waitFor(() => {
      expect(history.location.search).toContain('barbell%2Cdumbbell');
    });
    await waitFor(() => {
      expect(lastListCall()?.[0]).toEqual({
        q: '',
        muscle: [],
        equipment: ['barbell', 'dumbbell'],
        mine: false,
      });
    });
    expect(
      await screen.findByRole('button', { name: 'Обладнання: 2' }),
    ).toBeTruthy();
  });

  it('keeps the draft out of the URL when the sheet is closed without applying', async () => {
    const history = await renderAt('/exercises');
    await screen.findByText('Жим штанги лежачи');

    fireEvent.click(screen.getByRole('button', { name: "Усі м'язи" }));
    const sheet = await screen.findByRole('dialog');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Груди' }));
    fireEvent.keyDown(sheet, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(history.location.search).not.toContain('chest');
  });

  it('clears the filters from the empty state', async () => {
    vi.mocked(fetchExercises).mockResolvedValue({
      items: [],
      total: 0,
      nextOffset: null,
    });
    const history = await renderAt('/exercises?equipment=cable');

    expect(await screen.findByText('Вправ не знайдено')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Очистити фільтри' }));

    await waitFor(() => {
      expect(history.location.search).toBe('');
    });
  });

  it('ignores unknown ids in the URL', async () => {
    await renderAt('/exercises?muscle=wings&equipment=cable');

    await screen.findByText('Жим штанги лежачи');
    expect(lastListCall()?.[0]).toEqual({
      q: '',
      muscle: [],
      equipment: ['cable'],
      mine: false,
    });
  });

  it('shows the exercise card with muscles, chips and steps', async () => {
    await renderAt(`/exercises/${bench.id}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: bench.name }),
    ).toBeTruthy();
    expect(await screen.findByText('Основні: Груди')).toBeTruthy();
    expect(screen.getByText('Другорядні: Трицепс')).toBeTruthy();
    expect(screen.getByText('Штанга')).toBeTruthy();
    expect(screen.getByText('Початківець')).toBeTruthy();
    expect(screen.getByText('Ляжте на лаву')).toBeTruthy();
    expect(screen.getByText('Опустіть штангу до грудей')).toBeTruthy();
  });

  it('shows a not found message for a missing exercise', async () => {
    vi.mocked(fetchExercise).mockRejectedValue(
      new ApiError(404, 'EXERCISE_NOT_FOUND', 'Not found'),
    );

    await renderAt(`/exercises/${bench.id}`);

    expect(await screen.findByText('Вправу не знайдено')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'До списку вправ' })).toBeTruthy();
  });

  it('marks my own exercises and offers to create one', async () => {
    vi.mocked(fetchExercises).mockResolvedValue({
      items: [{ ...bench, id: 'own-1', name: 'Жим у хамері', custom: true }],
      total: 1,
      nextOffset: null,
    });

    await renderAt('/exercises');

    expect(await screen.findByText('Жим у хамері')).toBeTruthy();
    expect(screen.getByText('Своя · Груди')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Створити' }).getAttribute('href'),
    ).toBe('/exercises/new');
  });

  it('limits the list to my exercises with the chip', async () => {
    const history = await renderAt('/exercises');
    await screen.findByText('Жим штанги лежачи');

    const chip = screen.getByRole('button', { name: 'Мої вправи' });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(chip);

    await waitFor(() => {
      expect(history.location.search).toContain('mine=true');
    });
    await waitFor(() => {
      expect(lastListCall()?.[0]).toEqual({
        q: '',
        muscle: [],
        equipment: [],
        mine: true,
      });
    });
    expect(
      screen
        .getByRole('button', { name: 'Мої вправи' })
        .getAttribute('aria-pressed'),
    ).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Мої вправи' }));
    await waitFor(() => {
      expect(history.location.search).toBe('');
    });
  });

  it('says that I have no own exercises yet and offers to create one', async () => {
    vi.mocked(fetchExercises).mockResolvedValue({
      items: [],
      total: 0,
      nextOffset: null,
    });

    await renderAt('/exercises?mine=true');

    expect(
      await screen.findByText('У вас ще немає власних вправ'),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Очистити фільтри' }),
    ).toBeNull();
    expect(screen.getAllByRole('link', { name: 'Створити' })).toHaveLength(2);
  });

  it('offers to create an exercise named after a search with no results', async () => {
    vi.mocked(fetchExercises).mockResolvedValue({
      items: [],
      total: 0,
      nextOffset: null,
    });

    await renderAt('/exercises?q=хамер');

    const link = await screen.findByRole('link', { name: 'Створити «хамер»' });
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toBe(
      '/exercises/new?name=хамер',
    );
  });

  it('shows the menu only on my own exercise and deletes it after a confirmation', async () => {
    const own: ExerciseDetails = {
      ...details,
      id: 'own-1',
      name: 'Жим у хамері',
      custom: true,
      imageKeys: [],
      image: null,
    };
    vi.mocked(fetchExercise).mockResolvedValue(own);
    vi.mocked(deleteExercise).mockResolvedValue();

    const history = await renderAt('/exercises/own-1');

    fireEvent.click(await screen.findByRole('button', { name: 'Меню вправи' }));
    const menu = await screen.findByRole('dialog');
    expect(
      within(menu)
        .getByRole('link', { name: 'Редагувати' })
        .getAttribute('href'),
    ).toBe('/exercises/own-1/edit');
    fireEvent.click(within(menu).getByRole('button', { name: 'Видалити' }));

    const confirm = await screen.findByText('Видалити вправу?');
    expect(confirm).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Видалити',
      }),
    );

    await waitFor(() => {
      expect(vi.mocked(deleteExercise)).toHaveBeenCalledWith('own-1');
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/exercises');
    });
  });

  it('has no menu on a catalog exercise', async () => {
    await renderAt(`/exercises/${bench.id}`);

    await screen.findByRole('heading', { level: 1, name: bench.name });
    expect(screen.queryByRole('button', { name: 'Меню вправи' })).toBeNull();
  });

  it('sends a guest to sign in', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const history = await renderAt('/exercises');

    await waitFor(() => {
      expect(history.location.pathname).toBe('/sign-in');
    });
  });
});
