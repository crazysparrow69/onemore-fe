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
import {
  fetchCurrentUser,
  type CurrentUser,
} from '@/entities/user/api/current-user.service';
import { fetchWorkouts } from '@/entities/training/api/workouts.service';
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

vi.mock('@/entities/training/api/workouts.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/entities/training/api/workouts.service')
  >()),
  fetchWorkouts: vi.fn(),
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

function tab(name: string) {
  return within(
    screen.getByRole('navigation', { name: 'Main menu' }),
  ).getByRole('link', { name });
}

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

describe('tab bar', () => {
  beforeEach(() => {
    localStorage.clear();
    useDraftStore.setState({ ownerId: null, draft: null });
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(fetchWorkouts).mockResolvedValue({
      items: [],
      total: 0,
      nextOffset: null,
    });
  });

  it('shows the tabs on home and marks home as current', async () => {
    await renderAt('/');
    const nav = await screen.findByRole('navigation', { name: 'Main menu' });

    await waitFor(() => {
      expect(tab('Home').getAttribute('aria-current')).toBe('page');
    });
    expect(nav.querySelectorAll('a')).toHaveLength(3);
    expect(tab('Training').getAttribute('aria-current')).toBeNull();
  });

  it('switches to another tab', async () => {
    const history = await renderAt('/');

    await screen.findByRole('navigation', { name: 'Main menu' });
    fireEvent.click(tab('Training'));

    await waitFor(() => {
      expect(history.location.pathname).toBe('/training');
    });
    await waitFor(() => {
      expect(tab('Training').getAttribute('aria-current')).toBe('page');
    });
  });

  it.each(['/profile', '/profile/edit', '/settings', '/exercises'])(
    'keeps the profile tab current on %s',
    async (path) => {
      await renderAt(path);

      await waitFor(() => {
        expect(tab('Profile').getAttribute('aria-current')).toBe('page');
      });
    },
  );

  it.each(['/workout', '/exercises/new', '/missing'])(
    'hides the tabs on %s',
    async (path) => {
      useDraftStore.getState().start(user.id);
      const history = await renderAt(path);

      await waitFor(() => {
        expect(history.location.pathname).toBe(path);
      });
      await screen.findByRole('main');
      expect(
        screen.queryByRole('navigation', { name: 'Main menu' }),
      ).toBeNull();
    },
  );

  it('shows the active workout bar above the tabs', async () => {
    useDraftStore.getState().start(user.id);
    await renderAt('/profile');

    const bar = await screen.findByRole('link', {
      name: /Workout in progress/,
    });
    const nav = await screen.findByRole('navigation', { name: 'Main menu' });

    expect(bar.compareDocumentPosition(nav)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
