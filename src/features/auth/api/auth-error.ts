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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringField(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
}

function numberField(value: unknown, key: string): number | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const field = value[key];
  return typeof field === 'number' ? field : undefined;
}

function readCode(error: unknown): string | undefined {
  const direct = stringField(error, 'code');
  if (direct) {
    return direct;
  }
  if (!isRecord(error)) {
    return undefined;
  }
  return stringField(error.error, 'code');
}

function readStatus(error: unknown): number | undefined {
  const status = numberField(error, 'status');
  if (status !== undefined) {
    return status;
  }
  return numberField(error, 'statusCode');
}

function fromCode(code: string): AuthError | undefined {
  if (
    code === 'INVALID_EMAIL_OR_PASSWORD' ||
    code === 'USER_NOT_FOUND' ||
    code === 'INVALID_PASSWORD'
  ) {
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
  const known = knownCode(code);
  if (!known) {
    return undefined;
  }
  return new AuthError(known);
}

function fromStatus(
  status: number | undefined,
  fallback: AuthErrorCode,
): AuthError | undefined {
  if (status === 0) {
    return new AuthError('network');
  }
  if (status !== undefined && status >= 500) {
    return new AuthError('generic');
  }
  if (status === 401 || status === 403) {
    return new AuthError('invalidCredentials');
  }
  if (
    status !== undefined &&
    status >= 400 &&
    status < 500 &&
    fallback === 'invalidCredentials'
  ) {
    return new AuthError('invalidCredentials');
  }
  return undefined;
}

export function toAuthError(
  error: unknown,
  fallback: AuthErrorCode,
): AuthError {
  if (error instanceof AuthError) {
    return error;
  }
  const code = readCode(error);
  if (code) {
    const coded = fromCode(code);
    if (coded) {
      return coded;
    }
  }
  const byStatus = fromStatus(readStatus(error), fallback);
  if (byStatus) {
    return byStatus;
  }
  return new AuthError(fallback);
}
