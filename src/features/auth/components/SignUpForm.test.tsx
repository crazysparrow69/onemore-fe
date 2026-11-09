import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';
import { AuthError } from '@/features/auth/api/auth-error';
import { getSession, signUpWithEmail } from '@/features/auth/api/auth.service';

vi.mock('@/features/auth/api/auth.service', () => ({
  getSession: vi.fn(() => Promise.resolve(null)),
  signInWithEmail: vi.fn(() => Promise.resolve()),
  signUpWithEmail: vi.fn(() => Promise.resolve()),
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  getAccessToken: vi.fn(() => Promise.resolve(null)),
  refreshAccessToken: vi.fn(() => Promise.resolve(null)),
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(signUpWithEmail).mockReset();
  });

  it('submits email, password and username, and toasts on failure', async () => {
    vi.mocked(signUpWithEmail).mockRejectedValue(new AuthError('emailTaken'));
    const history = createMemoryHistory({ initialEntries: ['/sign-up'] });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const appRouter = createAppRouter(history, client);
    await appRouter.load();
    render(<App router={appRouter} queryClient={client} />);

    const submit = await screen.findByRole('button', { name: 'Continue' });
    expect(submit).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.co' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'longpassword' },
    });
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'ada' },
    });
    await waitFor(() => {
      expect(submit).toHaveProperty('disabled', false);
    });

    fireEvent.click(submit);
    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalledWith(
        {
          email: 'a@b.co',
          password: 'longpassword',
          username: 'ada',
        },
        expect.anything(),
      );
    });
    expect(
      await screen.findByText('An account with this email already exists'),
    ).toBeTruthy();
  });
});
