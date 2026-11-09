import { QueryClient } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';
import { RouteErrorPage } from '@/app/routes/RouteErrorPage';
import { getSession } from '@/features/auth/api/auth.service';

vi.mock('@/features/auth/api/auth.service', () => ({
  getSession: vi.fn(() => Promise.resolve(null)),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithEmail: vi.fn(() => Promise.resolve()),
  signUpWithEmail: vi.fn(() => Promise.resolve()),
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  getAccessToken: vi.fn(() => Promise.resolve(null)),
  refreshAccessToken: vi.fn(() => Promise.resolve(null)),
}));

async function renderApp(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const appRouter = createAppRouter(history, client);
  await appRouter.load();
  render(<App router={appRouter} queryClient={client} />);
}

describe('router', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(null);
  });

  it('sends a guest from home to sign in', async () => {
    await renderApp('/');

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeTruthy();
  });

  it('sends a signed-in user from sign in to home', async () => {
    vi.mocked(getSession).mockResolvedValue({ email: 'a@b.co' });
    await renderApp('/sign-in');

    expect(
      await screen.findByRole('heading', { name: 'onemore' }),
    ).toBeTruthy();
  });

  it('renders the home heading for a signed-in user', async () => {
    vi.mocked(getSession).mockResolvedValue({ email: 'a@b.co' });
    await renderApp('/');

    expect(
      await screen.findByRole('heading', { name: 'onemore' }),
    ).toBeTruthy();
  });

  it('renders not found and a link home', async () => {
    await renderApp('/missing');

    expect(
      await screen.findByRole('heading', { name: 'Page not found' }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveProperty(
      'pathname',
      '/',
    );
  });

  it('renders the generic error and retry without the error message', async () => {
    const rootRoute = createRootRoute({
      errorComponent: RouteErrorPage,
    });
    const failingRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      loader: () => {
        throw new Error('secret boom');
      },
      component: () => null,
    });
    const history = createMemoryHistory({ initialEntries: ['/'] });
    const appRouter = createRouter({
      routeTree: rootRoute.addChildren([failingRoute]),
      history,
    });

    try {
      await appRouter.load();
    } catch {
      // The loader error is shown by the route error component.
    }

    render(<RouterProvider router={appRouter} />);

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.queryByText('secret boom')).toBeNull();
  });
});
