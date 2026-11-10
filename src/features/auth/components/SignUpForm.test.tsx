import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import { fireEvent, render, waitFor } from '@testing-library/react';
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

async function renderSignUp() {
  const history = createMemoryHistory({ initialEntries: ['/sign-up'] });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const appRouter = createAppRouter(history, client);
  await appRouter.load();
  render(<App router={appRouter} queryClient={client} />);
}

function input(selector: string): HTMLInputElement {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing input ${selector}`);
  }
  return element;
}

function submitButton(): HTMLButtonElement {
  const element = document.querySelector('button[type="submit"]');
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error('Missing submit button');
  }
  return element;
}

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(signUpWithEmail).mockReset();
  });

  it('submits email, password and username, and toasts on failure', async () => {
    vi.mocked(signUpWithEmail).mockRejectedValue(new AuthError('emailTaken'));
    await renderSignUp();
    await waitFor(() => {
      expect(input('input[autocomplete="username"]')).toBeInstanceOf(
        HTMLInputElement,
      );
    });

    fireEvent.change(input('input[type="email"]'), {
      target: { value: 'a@b.co' },
    });
    fireEvent.change(input('input[type="password"]'), {
      target: { value: 'longpassword' },
    });
    fireEvent.change(input('input[autocomplete="username"]'), {
      target: { value: 'ada' },
    });

    fireEvent.click(submitButton());
    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalledWith(
        {
          email: 'a@b.co',
          password: 'longpassword',
          username: 'ada',
        },
        expect.anything(),
      );
      expect(document.querySelector('[data-sonner-toast]')).toBeTruthy();
    });
  });

  it('shows field errors only after submit and clears them when fixed', async () => {
    await renderSignUp();
    await waitFor(() => {
      expect(input('input[autocomplete="username"]')).toBeInstanceOf(
        HTMLInputElement,
      );
    });

    fireEvent.change(input('input[autocomplete="username"]'), {
      target: { value: '   ' },
    });
    expect(
      input('input[autocomplete="username"]').getAttribute('aria-invalid'),
    ).toBeNull();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(
        input('input[autocomplete="username"]').getAttribute('aria-invalid'),
      ).toBe('true');
    });
    expect(signUpWithEmail).not.toHaveBeenCalled();

    fireEvent.change(input('input[autocomplete="username"]'), {
      target: { value: 'ada' },
    });
    await waitFor(() => {
      expect(
        input('input[autocomplete="username"]').getAttribute('aria-invalid'),
      ).toBeNull();
    });
  });
});
