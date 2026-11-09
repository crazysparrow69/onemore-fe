import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';
import { RouteErrorPage } from '@/app/routes/RouteErrorPage';

async function renderApp(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const appRouter = createAppRouter(history);
  await appRouter.load();
  render(<App router={appRouter} />);
}

describe('router', () => {
  it('renders the home heading', async () => {
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
