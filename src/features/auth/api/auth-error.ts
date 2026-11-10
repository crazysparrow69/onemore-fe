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

function readCodes(error: unknown): string[] {
  const codes: string[] = [];
  const direct = stringField(error, 'code');
  if (direct) {
    codes.push(direct);
  }
  if (isRecord(error)) {
    const nested = stringField(error.error, 'code');
    if (nested && nested !== direct) {
      codes.push(nested);
    }
  }
  return codes;
}

function readStatus(error: unknown): number | undefined {
  const status = numberField(error, 'status');
  if (status !== undefined) {
    return status;
  }
  return numberField(error, 'statusCode');
}

function isFetchFailureMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('network error')
  );
}

function isNetworkFailure(error: unknown): boolean {
  const status = readStatus(error);
  if (status === 0) {
    return true;
  }
  if (status !== undefined) {
    return false;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof Error && isFetchFailureMessage(error.message)) {
    return true;
  }
  const message = stringField(error, 'message');
  return message !== undefined && isFetchFailureMessage(message);
}

function fromCode(code: string): AuthError | undefined {
  if (
    code === 'INVALID_EMAIL_OR_PASSWORD' ||
    code === 'USER_NOT_FOUND' ||
    code === 'INVALID_PASSWORD' ||
    code === 'invalid_credentials'
  ) {
    return new AuthError('invalidCredentials');
  }
  if (
    code === 'USER_ALREADY_EXISTS' ||
    code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
    code === 'user_already_exists' ||
    code === 'email_exists'
  ) {
    return new AuthError('emailTaken');
  }
  if (
    code === 'PASSWORD_TOO_SHORT' ||
    code === 'PASSWORD_TOO_LONG' ||
    code === 'weak_password'
  ) {
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
  if (isNetworkFailure(error)) {
    return new AuthError('network');
  }
  for (const code of readCodes(error)) {
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
