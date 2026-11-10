import { createInternalNeonAuth } from '@neon/neon-js/auth';
import {
  BetterAuthVanillaAdapter,
  type BetterAuthVanillaAdapterInstance,
} from '@neon/neon-js/auth/vanilla/adapters';
import { neonAuthUrl } from '@/shared/lib/client-env';
import {
  AuthError,
  toAuthError,
  type AuthErrorCode,
} from '@/features/auth/api/auth-error';

export interface AuthSession {
  email: string;
}

type AuthNeon = ReturnType<
  typeof createInternalNeonAuth<BetterAuthVanillaAdapterInstance>
>;
type AuthClient = AuthNeon['adapter'];

let neonAuth: AuthNeon | undefined;

function getNeonAuth(): AuthNeon {
  neonAuth ??= createInternalNeonAuth(neonAuthUrl(), {
    adapter: BetterAuthVanillaAdapter({
      fetchOptions: { credentials: 'include' },
    }),
  });
  return neonAuth;
}

function getClient(): AuthClient {
  return getNeonAuth().adapter;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

type AuthFallback = AuthErrorCode | ((error: unknown) => AuthErrorCode);

function httpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  if ('status' in error && typeof error.status === 'number') {
    return error.status;
  }
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  return undefined;
}

function signInFallback(error: unknown): AuthErrorCode {
  const status = httpStatus(error);
  if (status !== undefined && status >= 400 && status < 500) {
    return 'invalidCredentials';
  }
  return 'generic';
}

async function call<T>(
  run: () => Promise<T>,
  fallback: AuthFallback,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const code = typeof fallback === 'function' ? fallback(error) : fallback;
    throw toAuthError(error, code);
  }
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  username: string;
}): Promise<void> {
  await call(async () => {
    const result = await getClient().signUp.email({
      email: input.email,
      password: input.password,
      name: input.username,
    });
    if (result.error) {
      throw toAuthError(result.error, 'generic');
    }
  }, 'generic');
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
}): Promise<void> {
  await call(async () => {
    const result = await getClient().signIn.email({
      email: input.email,
      password: input.password,
    });
    if (result.error) {
      throw toAuthError(result.error, 'invalidCredentials');
    }
  }, signInFallback);
}

export async function signInWithGoogle(): Promise<void> {
  const callbackURL = `${window.location.origin}/auth/callback`;
  try {
    const result = await getClient().signIn.social({
      provider: 'google',
      callbackURL,
      newUserCallbackURL: callbackURL,
      errorCallbackURL: `${window.location.origin}/sign-in`,
      disableRedirect: true,
    });
    if (result.error) {
      throw toAuthError(result.error, 'googleFailed');
    }
    const url = isRecord(result.data) ? result.data.url : undefined;
    if (typeof url !== 'string' || url.length === 0) {
      throw new AuthError('googleFailed');
    }
    window.location.assign(url);
  } catch (error) {
    if (isAbort(error)) {
      return;
    }
    throw toAuthError(error, 'googleFailed');
  }
}

export async function signOut(): Promise<void> {
  await call(async () => {
    const result = await getClient().signOut();
    if (result.error) {
      throw toAuthError(result.error, 'generic');
    }
  }, 'generic');
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const result = await getClient().getSession();
    const email = result.data?.user.email;
    if (result.error || typeof email !== 'string' || email.length === 0) {
      return null;
    }
    return { email };
  } catch {
    return null;
  }
}

function normalizeJwt(token: string | null): string | null {
  return token !== null && token.split('.').length === 3 ? token : null;
}

async function readToken(): Promise<string | null> {
  try {
    return normalizeJwt(await getNeonAuth().getJWTToken());
  } catch {
    return null;
  }
}

export function getAccessToken(): Promise<string | null> {
  return readToken().catch(() => null);
}

export function refreshAccessToken(): Promise<string | null> {
  return readToken().catch(() => null);
}
