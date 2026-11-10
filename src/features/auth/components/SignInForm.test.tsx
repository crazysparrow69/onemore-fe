import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';
import { AuthError } from '@/features/auth/api/auth-error';
import { getSession, signInWithEmail } from '@/features/auth/api/auth.service';

vi.mock('@/features/auth/api/auth.service', () => ({
  getSession: vi.fn(() => Promise.resolve(null)),
  signInWithEmail: vi.fn(() => Promise.resolve()),
  signUpWithEmail: vi.fn(() => Promise.resolve()),
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  getAccessToken: vi.fn(() => Promise.resolve(null)),
  refreshAccessToken: vi.fn(() => Promise.resolve(null)),
}));

async function renderSignIn() {
  const history = createMemoryHistory({ initialEntries: ['/sign-in'] });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const appRouter = createAppRouter(history, client);
  await appRouter.load();
  render(<App router={appRouter} queryClient={client} />);
}

describe('SignInForm', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(signInWithEmail).mockReset();
  });

  it('shows field errors only after submit and clears them when fixed', async () => {
    await renderSignIn();

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'not-an-email' },
    });
    expect(screen.queryByText('Enter a valid email address')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(
      screen.getByText('Password must be at least 8 characters'),
    ).toBeTruthy();
    expect(signInWithEmail).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.co' },
    });
    await waitFor(() => {
      expect(screen.queryByText('Enter a valid email address')).toBeNull();
    });
  });

  it('submits the email and password', async () => {
    vi.mocked(signInWithEmail).mockResolvedValue(undefined);
    await renderSignIn();

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'a@b.co' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'longpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalledWith(
        {
          email: 'a@b.co',
          password: 'longpassword',
        },
        expect.anything(),
      );
    });
  });

  it('shows an error toast when sign-in fails', async () => {
    vi.mocked(signInWithEmail).mockRejectedValue(
      new AuthError('invalidCredentials'),
    );
    await renderSignIn();

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'a@b.co' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'longpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText(
        'The email or password you entered is incorrect. Please double-check and try again.',
      ),
    ).toBeTruthy();
  });
});
