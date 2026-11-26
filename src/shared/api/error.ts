export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return isApiError(error) && error.code === code;
}

export function apiErrorKey<K extends string>(
  error: unknown,
  keys: Readonly<Record<string, K>>,
  fallback: K,
): K {
  return isApiError(error) ? (keys[error.code] ?? fallback) : fallback;
}
