export const AUTH_ERROR_CODES = [
  'invalidCredentials',
  'emailTaken',
  'passwordTooShort',
  'network',
  'googleFailed',
  'generic',
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

function knownCode(code: string): AuthErrorCode | undefined {
  for (const known of AUTH_ERROR_CODES) {
    if (known === code) {
      return known;
    }
  }
  return undefined;
}

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
  }
}

export function isAuthFailure(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function toAuthError(
  error: unknown,
  fallback: AuthErrorCode,
): AuthError {
  if (error instanceof AuthError) {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (code === 'INVALID_EMAIL_OR_PASSWORD') {
      return new AuthError('invalidCredentials');
    }
    if (
      code === 'USER_ALREADY_EXISTS' ||
      code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
    ) {
      return new AuthError('emailTaken');
    }
    if (code === 'PASSWORD_TOO_SHORT' || code === 'PASSWORD_TOO_LONG') {
      return new AuthError('passwordTooShort');
    }
    if (typeof code === 'string') {
      const known = knownCode(code);
      if (known) {
        return new AuthError(known);
      }
    }
  }
  return new AuthError(fallback);
}
