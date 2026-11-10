import { QueryClient } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
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
  return history;
}

describe('router', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(null);
  });

  it('sends a guest from home to sign in', async () => {
    const history = await renderApp('/');

    await waitFor(() => {
      expect(history.location.pathname).toBe('/sign-in');
    });
  });

  it('sends a signed-in user from sign in to home', async () => {
    vi.mocked(getSession).mockResolvedValue({ email: 'a@b.co' });
    const history = await renderApp('/sign-in');

    await waitFor(() => {
      expect(history.location.pathname).toBe('/');
    });
  });

  it('keeps a signed-in user on home', async () => {
    vi.mocked(getSession).mockResolvedValue({ email: 'a@b.co' });
    const history = await renderApp('/');

    await waitFor(() => {
      expect(history.location.pathname).toBe('/');
    });
  });

  it('renders not found and a link home', async () => {
    const history = await renderApp('/missing');

    await waitFor(() => {
      expect(history.location.pathname).toBe('/missing');
    });
    expect(screen.getByRole('link')).toHaveProperty('pathname', '/');
  });

  it('renders the generic error without the error message', async () => {
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

    expect(await screen.findByRole('button')).toBeTruthy();
    expect(screen.queryByText('secret boom')).toBeNull();
  });
});
