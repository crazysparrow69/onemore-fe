import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';

vi.mock('@/features/auth/api/auth.service', () => ({
  getSession: vi.fn(() => Promise.resolve({ email: 'a@b.co' })),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithEmail: vi.fn(() => Promise.resolve()),
  signUpWithEmail: vi.fn(() => Promise.resolve()),
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  getAccessToken: vi.fn(() => Promise.resolve(null)),
  refreshAccessToken: vi.fn(() => Promise.resolve(null)),
}));

describe('App', () => {
  it('renders the app heading', async () => {
    const history = createMemoryHistory({ initialEntries: ['/'] });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const appRouter = createAppRouter(history, client);
    await appRouter.load();
    render(<App router={appRouter} queryClient={client} />);

    expect(
      await screen.findByRole('heading', { name: 'onemore' }),
    ).toBeTruthy();
  });
});
