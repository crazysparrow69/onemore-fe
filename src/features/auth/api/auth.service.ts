import { createAuthClient } from '@neon/neon-js/auth';
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

type AuthClient = ReturnType<
  typeof createAuthClient<BetterAuthVanillaAdapterInstance>
>;

let client: AuthClient | undefined;

function getClient(): AuthClient {
  client ??= createAuthClient(neonAuthUrl(), {
    adapter: BetterAuthVanillaAdapter({
      fetchOptions: { credentials: 'include' },
    }),
  });
  return client;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function call<T>(
  run: () => Promise<T>,
  fallback: AuthErrorCode,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(fallback);
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
  }, 'network');
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
  }, 'network');
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
    if (error instanceof AuthError) {
      throw error;
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
  }, 'network');
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

interface JwtReader {
  token(): Promise<unknown>;
}

function isJwtReader(client: object): client is JwtReader {
  return typeof Reflect.get(client, 'token') === 'function';
}

function jwtFrom(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('data' in value)) {
    return null;
  }
  const data = value.data;
  if (typeof data !== 'object' || data === null || !('token' in data)) {
    return null;
  }
  const token = data.token;
  return typeof token === 'string' && token.split('.').length === 3
    ? token
    : null;
}

async function readToken(): Promise<string | null> {
  const client = getClient();
  if (!isJwtReader(client)) {
    return null;
  }
  try {
    return jwtFrom(await client.token());
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
