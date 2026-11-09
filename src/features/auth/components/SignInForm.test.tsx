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

  it('keeps submit disabled until the form is valid', async () => {
    await renderSignIn();

    const submit = await screen.findByRole('button', { name: 'Sign in' });
    expect(submit).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.co' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'short' },
    });
    expect(submit).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'longpassword' },
    });
    await waitFor(() => {
      expect(submit).toHaveProperty('disabled', false);
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
    const submit = screen.getByRole('button', { name: 'Sign in' });
    await waitFor(() => {
      expect(submit).toHaveProperty('disabled', false);
    });
    fireEvent.click(submit);

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
    const submit = screen.getByRole('button', { name: 'Sign in' });
    await waitFor(() => {
      expect(submit).toHaveProperty('disabled', false);
    });
    fireEvent.click(submit);

    expect(await screen.findByText('Wrong email or password')).toBeTruthy();
  });
});
