import { describe, expect, it, vi } from 'vitest';
import { AuthError, toAuthError } from '@/features/auth/api/auth-error';

describe('toAuthError', () => {
  it('keeps an AuthError as-is', () => {
    const error = new AuthError('googleFailed');
    expect(toAuthError(error, 'generic')).toBe(error);
  });

  it('maps credential codes, including a nested body', () => {
    expect(
      toAuthError({ code: 'INVALID_EMAIL_OR_PASSWORD' }, 'generic').code,
    ).toBe('invalidCredentials');
    expect(toAuthError({ code: 'USER_NOT_FOUND' }, 'generic').code).toBe(
      'invalidCredentials',
    );
    expect(
      toAuthError({ error: { code: 'INVALID_PASSWORD' } }, 'generic').code,
    ).toBe('invalidCredentials');
    expect(
      toAuthError(
        {
          code: 'invalid_credentials',
          status: 401,
          error: { code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 },
        },
        'generic',
      ).code,
    ).toBe('invalidCredentials');
  });

  it('maps taken emails and password length', () => {
    expect(toAuthError({ code: 'USER_ALREADY_EXISTS' }, 'generic').code).toBe(
      'emailTaken',
    );
    expect(toAuthError({ code: 'PASSWORD_TOO_LONG' }, 'generic').code).toBe(
      'passwordTooShort',
    );
    expect(
      toAuthError(
        {
          code: 'validation_failed',
          status: 400,
          error: { code: 'PASSWORD_TOO_SHORT' },
        },
        'generic',
      ).code,
    ).toBe('passwordTooShort');
    expect(toAuthError({ code: 'user_already_exists' }, 'generic').code).toBe(
      'emailTaken',
    );
  });

  it('maps transport and server failures by status', () => {
    expect(toAuthError({ status: 0 }, 'generic').code).toBe('network');
    expect(toAuthError(new TypeError('Failed to fetch'), 'generic').code).toBe(
      'network',
    );
    expect(
      toAuthError(
        new Error('NetworkError when attempting to fetch resource.'),
        'generic',
      ).code,
    ).toBe('network');
    expect(toAuthError({ status: 500 }, 'invalidCredentials').code).toBe(
      'generic',
    );
  });

  it('hides whether an account exists on sign-in failures', () => {
    expect(toAuthError({ status: 401 }, 'generic').code).toBe(
      'invalidCredentials',
    );
    expect(toAuthError({ status: 422 }, 'invalidCredentials').code).toBe(
      'invalidCredentials',
    );
    expect(toAuthError({ status: 422 }, 'generic').code).toBe('generic');
  });

  it('uses the fallback when nothing matches', () => {
    expect(toAuthError({ code: 'SOMETHING_ELSE' }, 'googleFailed').code).toBe(
      'googleFailed',
    );
  });

  it('keeps an http error when the browser is offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(
      toAuthError({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' }, 'generic')
        .code,
    ).toBe('invalidCredentials');
  });

  it('treats an offline browser with no response as a network failure', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(toAuthError(new Error('boom'), 'generic').code).toBe('network');
  });
});
