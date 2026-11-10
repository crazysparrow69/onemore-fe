import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import { fireEvent, render, waitFor } from '@testing-library/react';
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

describe('SignInForm', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(signInWithEmail).mockReset();
  });

  it('shows field errors only after submit and clears them when fixed', async () => {
    await renderSignIn();
    await waitFor(() => {
      expect(input('input[type="email"]')).toBeInstanceOf(HTMLInputElement);
    });

    fireEvent.change(input('input[type="email"]'), {
      target: { value: 'not-an-email' },
    });
    expect(
      input('input[type="email"]').getAttribute('aria-invalid'),
    ).toBeNull();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(input('input[type="email"]').getAttribute('aria-invalid')).toBe(
        'true',
      );
      expect(input('input[type="password"]').getAttribute('aria-invalid')).toBe(
        'true',
      );
    });
    expect(signInWithEmail).not.toHaveBeenCalled();

    fireEvent.change(input('input[type="email"]'), {
      target: { value: 'a@b.co' },
    });
    await waitFor(() => {
      expect(
        input('input[type="email"]').getAttribute('aria-invalid'),
      ).toBeNull();
    });
  });

  it('submits the email and password', async () => {
    vi.mocked(signInWithEmail).mockResolvedValue(undefined);
    await renderSignIn();
    await waitFor(() => {
      expect(input('input[type="email"]')).toBeInstanceOf(HTMLInputElement);
    });

    fireEvent.change(input('input[type="email"]'), {
      target: { value: 'a@b.co' },
    });
    fireEvent.change(input('input[type="password"]'), {
      target: { value: 'longpassword' },
    });
    fireEvent.click(submitButton());

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
    await waitFor(() => {
      expect(input('input[type="email"]')).toBeInstanceOf(HTMLInputElement);
    });

    fireEvent.change(input('input[type="email"]'), {
      target: { value: 'a@b.co' },
    });
    fireEvent.change(input('input[type="password"]'), {
      target: { value: 'longpassword' },
    });
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(document.querySelector('[data-sonner-toast]')).toBeTruthy();
    });
  });
});
