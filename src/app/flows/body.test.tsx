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
import type { Body, Goal, WeightEntry } from '@/entities/body/model/schemas';
import {
  fetchTarget,
  requestAutoTarget,
  setManualTarget,
} from '@/entities/nutrition/api/target.service';
import type { Target } from '@/entities/nutrition/model/schemas';
import {
  fetchCurrentUser,
  type CurrentUser,
} from '@/entities/user/api/current-user.service';
import { localDate } from '@/shared/lib/local-date';

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

vi.mock('@/entities/body/api/body.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/entities/body/api/body.service')
  >()),
  fetchBody: vi.fn(),
  saveBody: vi.fn(),
  fetchGoal: vi.fn(),
  saveGoal: vi.fn(),
  fetchLatestWeight: vi.fn(),
  fetchWeightLog: vi.fn(),
  saveWeight: vi.fn(),
  deleteWeight: vi.fn(),
}));

vi.mock('@/entities/nutrition/api/target.service', () => ({
  fetchTarget: vi.fn(),
  setManualTarget: vi.fn(),
  requestAutoTarget: vi.fn(),
}));

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
  language: 'en',
  units: 'kg',
  timeZone: 'Europe/Kyiv',
  avatar: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const today = localDate(new Date(), user.timeZone);

const body: Body = {
  sex: 'male',
  birthDate: '1990-05-17',
  heightCm: 180,
  activityLevel: 'moderate',
  updatedAt: '2026-11-27T10:00:00.000Z',
};

const goal: Goal = {
  type: 'lose',
  rateKgPerWeek: 0.5,
  targetWeightKg: null,
  effectiveFrom: '2026-11-27',
};

const entry: WeightEntry = {
  localDate: '2026-11-20',
  weightKg: 82.4,
  note: null,
  updatedAt: '2026-11-20T08:00:00.000Z',
};

const target: Target = {
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

function givenFilled(): void {
  vi.mocked(fetchBody).mockResolvedValue(body);
  vi.mocked(fetchGoal).mockResolvedValue(goal);
  vi.mocked(fetchLatestWeight).mockResolvedValue(entry);
  vi.mocked(fetchWeightLog).mockResolvedValue([entry]);
  vi.mocked(fetchTarget).mockResolvedValue(target);
}

describe('body, goal and weight', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(fetchBody).mockResolvedValue(null);
    vi.mocked(fetchGoal).mockResolvedValue(null);
    vi.mocked(fetchLatestWeight).mockResolvedValue(null);
    vi.mocked(fetchWeightLog).mockResolvedValue([]);
    vi.mocked(fetchTarget).mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('sets up the body, the goal and the first weight step by step', async () => {
    const history = await renderAt('/body/setup');

    fireEvent.change(await screen.findByLabelText('Birth date'), {
      target: { value: '1990-05-17' },
    });
    fireEvent.change(screen.getByLabelText('Height, cm'), {
      target: { value: '180' },
    });
    vi.mocked(saveBody).mockImplementation(() => Promise.resolve(body));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(saveBody).toHaveBeenCalledWith(
        {
          sex: 'male',
          birthDate: '1990-05-17',
          heightCm: 180,
          activityLevel: 'light',
        },
        today,
      );
    });

    vi.mocked(saveGoal).mockImplementation(() => Promise.resolve(goal));
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(saveGoal).toHaveBeenCalledWith(
        { type: 'lose', rateKgPerWeek: 0.5, targetWeightKg: null },
        today,
      );
    });

    fireEvent.change(await screen.findByLabelText('Weight, kg'), {
      target: { value: '82,4' },
    });
    vi.mocked(saveWeight).mockImplementation(() => {
      vi.mocked(fetchLatestWeight).mockResolvedValue(entry);
      vi.mocked(fetchTarget).mockResolvedValue(target);
      return Promise.resolve(entry);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveWeight).toHaveBeenCalledWith(
        today,
        { weightKg: 82.4, note: null },
        today,
      );
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/body');
    });
  });

  it('resumes the setup at the first missing step', async () => {
    vi.mocked(fetchBody).mockResolvedValue(body);
    vi.mocked(fetchGoal).mockResolvedValue(goal);

    await renderAt('/body/setup');

    expect(await screen.findByLabelText('Weight, kg')).toBeTruthy();
    expect(screen.queryByLabelText('Birth date')).toBeNull();
  });

  it('offers the setup while something is missing', async () => {
    vi.mocked(fetchBody).mockResolvedValue(body);

    await renderAt('/body');

    expect(
      (await screen.findByRole('link', { name: 'Set up' })).getAttribute(
        'href',
      ),
    ).toBe('/body/setup');
  });

  it('shows the target and the weight in the units of the user', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({ ...user, units: 'lb' });
    givenFilled();
    vi.mocked(fetchWeightLog).mockResolvedValue([entry]);

    await renderAt('/body');

    expect(await screen.findByText('2,400 kcal')).toBeTruthy();
    expect(screen.getByText('181.66 lb')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Set up' })).toBeNull();
  });

  it('keeps the profile tab current on the body pages', async () => {
    givenFilled();

    for (const path of ['/body', '/body/edit', '/body/goal', '/weight']) {
      await renderAt(path);
      await waitFor(() => {
        expect(
          within(screen.getByRole('navigation', { name: 'Main menu' }))
            .getByRole('link', { name: 'Profile' })
            .getAttribute('aria-current'),
        ).toBe('page');
      });
      cleanup();
    }
  });

  it('saves the body from its edit page and goes back to the overview', async () => {
    givenFilled();
    vi.mocked(saveBody).mockImplementation((input) =>
      Promise.resolve({ ...input, updatedAt: '2026-11-27T11:00:00.000Z' }),
    );
    const history = await renderAt('/body/edit');

    fireEvent.change(await screen.findByLabelText('Height, cm'), {
      target: { value: '181.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveBody).toHaveBeenCalledWith(
        {
          sex: 'male',
          birthDate: '1990-05-17',
          heightCm: 181.5,
          activityLevel: 'moderate',
        },
        today,
      );
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe('/body');
    });
  });

  it('does not send an invalid body', async () => {
    givenFilled();
    await renderAt('/body/edit');

    fireEvent.change(await screen.findByLabelText('Height, cm'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Height must be between 100 and 250 cm'),
    ).toBeTruthy();
    expect(saveBody).not.toHaveBeenCalled();
  });

  it('adds a weight in pounds and sends kilograms', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({ ...user, units: 'lb' });
    givenFilled();
    vi.mocked(saveWeight).mockResolvedValue(entry);
    await renderAt('/weight');

    fireEvent.click(await screen.findByRole('button', { name: 'Add weight' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Weight, lb'), {
      target: { value: '180' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveWeight).toHaveBeenCalledWith(
        today,
        { weightKg: 81.647, note: null },
        today,
      );
    });
  });

  it('keeps the date of an entry when it is edited', async () => {
    givenFilled();
    vi.mocked(saveWeight).mockResolvedValue(entry);
    await renderAt('/weight');

    fireEvent.click(await screen.findByRole('button', { name: /82\.4 kg/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Weight, kg'), {
      target: { value: '82' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveWeight).toHaveBeenCalledWith(
        entry.localDate,
        { weightKg: 82, note: null },
        today,
      );
    });
  });

  it('deletes an entry after a confirmation', async () => {
    givenFilled();
    vi.mocked(deleteWeight).mockResolvedValue();
    await renderAt('/weight');

    fireEvent.click(await screen.findByRole('button', { name: /82\.4 kg/ }));
    const sheet = await screen.findByRole('dialog');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Delete' }));

    const confirm = await screen.findByRole('dialog', {
      name: 'Delete this entry?',
    });
    expect(deleteWeight).not.toHaveBeenCalled();
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteWeight).toHaveBeenCalledWith(entry.localDate, today);
    });
  });

  it('sets own calories and goes back to the formula', async () => {
    givenFilled();
    vi.mocked(setManualTarget).mockImplementation((calories) => {
      vi.mocked(fetchTarget).mockResolvedValue({
        ...target,
        source: 'manual',
        caloriesKcal: calories,
        bmrKcal: null,
        tdeeKcal: null,
        inputs: null,
      });
      return Promise.resolve({ ...target, source: 'manual' });
    });
    vi.mocked(requestAutoTarget).mockImplementation(() => {
      vi.mocked(fetchTarget).mockResolvedValue(target);
      return Promise.resolve(target);
    });
    await renderAt('/body');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Change calories' }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Calories per day'), {
      target: { value: '2500' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(setManualTarget).toHaveBeenCalledWith(2500, today);
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Use the formula again' }),
    );
    await waitFor(() => {
      expect(requestAutoTarget).toHaveBeenCalledWith(today);
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Use the formula again' }),
      ).toBeNull();
    });
  });

  it('shows what is missing when the formula cannot run', async () => {
    givenFilled();
    vi.mocked(fetchTarget).mockResolvedValue({ ...target, source: 'manual' });
    const { ApiError } = await import('@/shared/api/error');
    vi.mocked(requestAutoTarget).mockRejectedValue(
      new ApiError(409, 'TARGET_INPUTS_MISSING', 'x'),
    );
    await renderAt('/body');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Use the formula again' }),
    );

    await waitFor(() => {
      expect(toastSpies.error).toHaveBeenCalledTimes(1);
    });
  });
});
