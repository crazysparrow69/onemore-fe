import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError } from '@/features/auth/api/auth-error';
import {
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from '@/features/auth/api/auth.service';

const auth = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/shared/lib/client-env', () => ({
  neonAuthUrl: () => 'https://auth.example.test/neondb/auth',
}));

vi.mock('@neon/neon-js/auth/vanilla/adapters', () => ({
  BetterAuthVanillaAdapter: () => ({}),
}));

vi.mock('@neon/neon-js/auth', () => ({
  createInternalNeonAuth: () => ({
    adapter: {
      signIn: { email: auth.signInEmail, social: vi.fn() },
      signUp: { email: auth.signUpEmail },
      signOut: auth.signOut,
      getSession: vi.fn(),
    },
    getJWTToken: vi.fn(),
  }),
}));

const credentials = { email: 'a@b.co', password: 'wrong-password' };

async function authCode(run: () => Promise<void>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AuthError) {
      return error.code;
    }
    throw error;
  }
  throw new Error('expected an auth error');
}

describe('auth.service', () => {
  beforeEach(() => {
    auth.signInEmail.mockReset();
    auth.signUpEmail.mockReset();
    auth.signOut.mockReset();
  });

  it('maps a returned invalid-password body to invalid credentials', async () => {
    auth.signInEmail.mockResolvedValue({
      data: null,
      error: {
        code: 'INVALID_EMAIL_OR_PASSWORD',
        status: 401,
        message: 'Invalid email or password',
      },
    });

    await expect(authCode(() => signInWithEmail(credentials))).resolves.toBe(
      'invalidCredentials',
    );
  });

  it('maps a thrown invalid-password error to invalid credentials', async () => {
    auth.signInEmail.mockRejectedValue({
      status: 401,
      code: 'invalid_credentials',
      message: 'Invalid email or password',
      error: {
        code: 'INVALID_EMAIL_OR_PASSWORD',
        message: 'Invalid email or password',
        status: 401,
      },
    });

    await expect(authCode(() => signInWithEmail(credentials))).resolves.toBe(
      'invalidCredentials',
    );
  });

  it('maps a thrown 401 without a code to invalid credentials', async () => {
    auth.signInEmail.mockRejectedValue({ status: 401 });

    await expect(authCode(() => signInWithEmail(credentials))).resolves.toBe(
      'invalidCredentials',
    );
  });

  it('maps a fetch failure to a network error', async () => {
    auth.signInEmail.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(authCode(() => signInWithEmail(credentials))).resolves.toBe(
      'network',
    );
  });

  it('maps a server failure to a generic error', async () => {
    auth.signInEmail.mockRejectedValue({ status: 500 });

    await expect(authCode(() => signInWithEmail(credentials))).resolves.toBe(
      'generic',
    );
  });

  it('maps a thrown taken-email error on sign-up', async () => {
    auth.signUpEmail.mockRejectedValue({
      status: 409,
      code: 'user_already_exists',
      error: { code: 'USER_ALREADY_EXISTS', status: 409 },
    });

    await expect(
      authCode(() => signUpWithEmail({ ...credentials, username: 'ada' })),
    ).resolves.toBe('emailTaken');
  });

  it('maps a thrown short-password error on sign-up', async () => {
    auth.signUpEmail.mockRejectedValue({
      status: 400,
      code: 'weak_password',
      error: { code: 'PASSWORD_TOO_SHORT', status: 400 },
    });

    await expect(
      authCode(() => signUpWithEmail({ ...credentials, username: 'ada' })),
    ).resolves.toBe('passwordTooShort');
  });

  it('maps sign-out failures without calling them network errors', async () => {
    auth.signOut.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(authCode(() => signOut())).resolves.toBe('network');

    auth.signOut.mockRejectedValueOnce({ status: 500 });
    await expect(authCode(() => signOut())).resolves.toBe('generic');

    auth.signOut.mockRejectedValueOnce(new Error('boom'));
    await expect(authCode(() => signOut())).resolves.toBe('generic');
  });
});
