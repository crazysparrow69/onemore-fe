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
import { getSession } from '@/entities/user/api/auth.service';
import type { CurrentUser } from '@/entities/user/api/current-user.service';
import { fetchCurrentUser } from '@/entities/user/api/current-user.service';
import {
  createExercise,
  fetchExercise,
  fetchExerciseDictionaries,
  fetchExercises,
  updateExercise,
  type ExerciseDetails,
  type ExerciseDictionaries,
} from '@/entities/exercise/api/exercises.service';
import { ApiError } from '@/shared/api/error';

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
    fetchExercise: vi.fn(),
    fetchExerciseDictionaries: vi.fn(),
    createExercise: vi.fn(),
    updateExercise: vi.fn(),
  }),
);

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/shared/lib/toast', () => ({ toast: toastSpies }));

const user: CurrentUser = {
  id: 'user-1',
  email: 'ada@example.com',
  name: 'Ada',
  nickname: null,
  role: 'user',
  language: 'uk',
  units: 'kg',
  timeZone: 'Europe/Kyiv',
  avatar: null,
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
        { id: 'lats', label: 'Найширші', primaryOnly: false },
      ],
    },
    {
      id: 'other',
      label: 'Інше',
      muscles: [{ id: 'full_body', label: 'Все тіло', primaryOnly: true }],
    },
  ],
  equipment: [
    { id: 'none', label: 'Власна вага' },
    { id: 'machine', label: 'Тренажер' },
  ],
  types: [
    {
      id: 'weight_reps',
      label: 'Вага і повтори',
      example: 'Жим лежачи',
      fields: [],
    },
    { id: 'duration', label: 'Тривалість', example: 'Планка', fields: [] },
  ],
  categories: [],
  levels: [],
  forces: [],
  mechanics: [],
};

const own: ExerciseDetails = {
  id: 'own-1',
  name: 'Жим у хамері',
  type: 'weight_reps',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'machine',
  image: null,
  custom: true,
  imageKeys: [],
  photoId: null,
  category: null,
  force: null,
  mechanic: null,
  level: null,
  instructions: ['Сядьте', 'Вижміть'],
  typeLocked: false,
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

async function choose(row: RegExp, option: RegExp) {
  fireEvent.click(await screen.findByRole('button', { name: row }));
  const sheet = await screen.findByRole('dialog');
  fireEvent.click(within(sheet).getByRole('button', { name: option }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
}

function saveButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Зберегти' });
}

describe('own exercise form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({ email: 'ada@example.com' });
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(fetchExerciseDictionaries).mockResolvedValue(dictionaries);
    vi.mocked(fetchExercises).mockResolvedValue({
      items: [],
      total: 0,
      nextOffset: null,
    });
    vi.mocked(fetchExercise).mockResolvedValue(own);
    vi.mocked(createExercise).mockResolvedValue(own);
    vi.mocked(updateExercise).mockResolvedValue(own);
  });

  it('keeps Save disabled until the name, the type and a primary muscle are set', async () => {
    await renderAt('/exercises/new');

    const name = await screen.findByLabelText('Назва');
    await waitFor(() => {
      expect(saveButton().hasAttribute('disabled')).toBe(true);
    });

    fireEvent.change(name, { target: { value: 'Жим у хамері' } });
    expect(saveButton().hasAttribute('disabled')).toBe(true);
    await choose(/Тип вправи/, /Вага і повтори/);
    expect(saveButton().hasAttribute('disabled')).toBe(true);
    await choose(/Основний м'яз/, /Груди/);

    expect(saveButton().hasAttribute('disabled')).toBe(false);
  });

  it('starts with the name taken from the search', async () => {
    await renderAt('/exercises/new?name=Хамер');

    expect(
      (await screen.findByLabelText<HTMLInputElement>('Назва')).value,
    ).toBe('Хамер');
  });

  it('sends the whole input and opens the card of the new exercise', async () => {
    const history = await renderAt('/exercises/new');

    fireEvent.change(await screen.findByLabelText('Назва'), {
      target: { value: '  Жим у хамері ' },
    });
    await choose(/Обладнання/, /Тренажер/);
    await choose(/Тип вправи/, /Вага і повтори/);
    await choose(/Основний м'яз/, /Груди/);
    fireEvent.change(screen.getByLabelText(/Техніка виконання/), {
      target: { value: 'Сядьте\n\nВижміть\n' },
    });
    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(vi.mocked(createExercise)).toHaveBeenCalledWith({
        name: '  Жим у хамері ',
        type: 'weight_reps',
        primaryMuscles: ['chest'],
        secondaryMuscles: [],
        equipment: 'machine',
        instructions: ['Сядьте', 'Вижміть'],
        photoId: null,
      });
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/exercises/own-1');
    });
    expect(toastSpies.success).toHaveBeenCalledWith('Вправу збережено');
  });

  it('offers only anatomical muscles as secondary ones and not the primary one', async () => {
    await renderAt('/exercises/new');
    await choose(/Основний м'яз/, /Груди/);

    fireEvent.click(
      await screen.findByRole('button', { name: /Допоміжні м'язи/ }),
    );
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).queryByRole('button', { name: /Груди/ })).toBeNull();
    expect(
      within(sheet).queryByRole('button', { name: /Все тіло/ }),
    ).toBeNull();
    expect(within(sheet).queryByText('Інше')).toBeNull();
    fireEvent.click(within(sheet).getByRole('button', { name: /Трицепс/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: /Найширші/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Готово' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(screen.getByText('Трицепс, Найширші')).toBeTruthy();
  });

  it('drops a secondary muscle that becomes the primary one', async () => {
    await renderAt('/exercises/new');
    await choose(/Основний м'яз/, /Груди/);
    fireEvent.click(
      await screen.findByRole('button', { name: /Допоміжні м'язи/ }),
    );
    const sheet = await screen.findByRole('dialog');
    fireEvent.click(within(sheet).getByRole('button', { name: /Трицепс/ }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Готово' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    await choose(/Основний м'яз/, /Трицепс/);

    expect(screen.queryByText('Трицепс, Найширші')).toBeNull();
    expect(
      within(screen.getByRole('button', { name: /Допоміжні м'язи/ })).getByText(
        'Немає',
      ),
    ).toBeTruthy();
  });

  it('shows the fields the backend rejected', async () => {
    vi.mocked(createExercise).mockRejectedValue(
      new ApiError(400, 'VALIDATION_FAILED', 'Validation failed', [
        { path: 'name', message: 'too short' },
        { path: 'instructions.2', message: 'too long' },
      ]),
    );
    await renderAt('/exercises/new');
    fireEvent.change(await screen.findByLabelText('Назва'), {
      target: { value: 'Ж' },
    });
    await choose(/Тип вправи/, /Вага і повтори/);
    await choose(/Основний м'яз/, /Груди/);

    fireEvent.click(saveButton());

    expect(
      await screen.findByText('Назва має містити від 2 до 80 символів'),
    ).toBeTruthy();
    expect(
      screen.getByText('Не більше 20 кроків, до 500 символів у кожному'),
    ).toBeTruthy();
    expect(toastSpies.error).toHaveBeenCalledWith('Перевірте виділені поля');
  });

  it('tells about the limit of own exercises', async () => {
    vi.mocked(createExercise).mockRejectedValue(
      new ApiError(409, 'EXERCISE_LIMIT_REACHED', 'limit'),
    );
    await renderAt('/exercises/new?name=Хамер');
    await choose(/Тип вправи/, /Вага і повтори/);
    await choose(/Основний м'яз/, /Груди/);

    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(toastSpies.error).toHaveBeenCalledWith(
        'Досягнуто ліміт у 500 власних вправ',
      );
    });
  });

  it('leaves without a question when nothing changed', async () => {
    const history = await renderAt('/exercises/new');

    fireEvent.click(await screen.findByRole('button', { name: 'Скасувати' }));

    await waitFor(() => {
      expect(history.location.pathname).toBe('/exercises');
    });
  });

  it('asks before discarding changes and can keep editing', async () => {
    const history = await renderAt('/exercises/new');
    fireEvent.change(await screen.findByLabelText('Назва'), {
      target: { value: 'Хамер' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('Відкинути зміни?')).toBeTruthy();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Продовжити' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(history.location.pathname).toBe('/exercises/new');

    fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Відкинути',
      }),
    );
    await waitFor(() => {
      expect(history.location.pathname).toBe('/exercises');
    });
    expect(vi.mocked(createExercise)).not.toHaveBeenCalled();
  });

  it('fills the form of an own exercise and saves it with PUT', async () => {
    const history = await renderAt('/exercises/own-1/edit');

    const name = await screen.findByLabelText<HTMLInputElement>('Назва');
    expect(name.value).toBe('Жим у хамері');
    expect(await screen.findByText('Тренажер')).toBeTruthy();
    expect(screen.getByText('Вага і повтори')).toBeTruthy();
    expect(screen.getByText('Трицепс')).toBeTruthy();
    expect(
      screen.getByLabelText<HTMLTextAreaElement>(/Техніка виконання/).value,
    ).toBe('Сядьте\nВижміть');
    expect(saveButton().hasAttribute('disabled')).toBe(false);

    fireEvent.change(name, { target: { value: 'Жим у хамері 2' } });
    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(vi.mocked(updateExercise)).toHaveBeenCalledWith('own-1', {
        name: 'Жим у хамері 2',
        type: 'weight_reps',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps'],
        equipment: 'machine',
        instructions: ['Сядьте', 'Вижміть'],
        photoId: null,
      });
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/exercises/own-1');
    });
  });

  it('refuses to edit a catalog exercise', async () => {
    vi.mocked(fetchExercise).mockResolvedValue({ ...own, custom: false });

    await renderAt('/exercises/own-1/edit');

    expect(
      await screen.findByText('Цю вправу не можна редагувати'),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Назва')).toBeNull();
  });

  it('sends a guest to sign in', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const history = await renderAt('/exercises/new');

    await waitFor(() => {
      expect(history.location.pathname).toBe('/sign-in');
    });
  });
});

describe('exercise form copy', () => {
  it('has the same keys in English and Ukrainian', async () => {
    const en = (await import('@/shared/i18n/locales/en.json')).default;
    const uk = (await import('@/shared/i18n/locales/uk.json')).default;

    expect(Object.keys(en.exerciseForm).sort()).toEqual(
      Object.keys(uk.exerciseForm).sort(),
    );
  });
});
