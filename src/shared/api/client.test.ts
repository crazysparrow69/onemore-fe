import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '@/shared/api/client';
import { ApiError } from '@/shared/api/error';
import { fetchCurrentUser } from '@/features/auth/api/me.service';

function response(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse<unknown> {
  return {
    data,
    status,
    statusText: '',
    headers: {},
    config,
  };
}

function fail(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): Promise<AxiosResponse> {
  return Promise.reject(
    new AxiosError(
      'Request failed',
      AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response(config, status, data),
    ),
  );
}

function authorization(config: InternalAxiosRequestConfig): string | undefined {
  const value = AxiosHeaders.from(config.headers).get('Authorization');
  return typeof value === 'string' ? value : undefined;
}

function requestUrl(config: InternalAxiosRequestConfig): string {
  const base = config.baseURL ?? '';
  const url = config.url ?? '';
  if (base.endsWith('/') && url.startsWith('/')) {
    return `${base.slice(0, -1)}${url}`;
  }
  return `${base}${url}`;
}

function callAt(
  calls: InternalAxiosRequestConfig[],
  index: number,
): InternalAxiosRequestConfig {
  const config = calls[index];
  if (!config) {
    throw new Error(`missing request ${String(index)}`);
  }
  return config;
}

describe('createApiClient', () => {
  it('sends a bearer token and returns the JSON body', async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = (config) => {
      calls.push(config);
      return Promise.resolve(response(config, 200, { id: 'user-1' }));
    };
    const client = createApiClient({
      adapter,
      getAccessToken: () => Promise.resolve('token-1'),
      refreshAccessToken: () => Promise.resolve('token-2'),
      onUnauthorized: vi.fn(),
    });

    await expect(client.get('/me')).resolves.toEqual({ id: 'user-1' });
    expect(calls).toHaveLength(1);
    expect(requestUrl(callAt(calls, 0))).toBe('/api/me');
    expect(authorization(callAt(calls, 0))).toBe('Bearer token-1');
  });

  it('retries once after 401 and then signs out', async () => {
    const authorizations: string[] = [];
    const adapter: AxiosAdapter = (config) => {
      authorizations.push(authorization(config) ?? '');
      return fail(config, 401, {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    };
    const refreshAccessToken = vi.fn(() => Promise.resolve('token-2'));
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      adapter,
      getAccessToken: () => Promise.resolve('token-1'),
      refreshAccessToken,
      onUnauthorized,
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(authorizations).toEqual(['Bearer token-1', 'Bearer token-2']);
  });

  it('does not sign out when the retry succeeds', async () => {
    let attempts = 0;
    const adapter: AxiosAdapter = (config) => {
      attempts += 1;
      if (attempts === 1) {
        return fail(config, 401, {
          statusCode: 401,
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });
      }
      return Promise.resolve(response(config, 200, { id: 'user-1' }));
    };
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      adapter,
      getAccessToken: () => Promise.resolve('token-1'),
      refreshAccessToken: () => Promise.resolve('token-2'),
      onUnauthorized,
    });

    await expect(client.get('/me')).resolves.toEqual({ id: 'user-1' });
    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(attempts).toBe(2);
  });

  it('parses the backend error shape', async () => {
    const client = createApiClient({
      adapter: (config) =>
        fail(config, 400, {
          statusCode: 400,
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          details: [{ path: 'timeZone', message: 'Invalid' }],
        }),
      getAccessToken: () => Promise.resolve('token-1'),
      refreshAccessToken: () => Promise.resolve(null),
      onUnauthorized: vi.fn(),
    });

    const error = await client
      .put('/me', { language: 'ru' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.details).toEqual([{ path: 'timeZone', message: 'Invalid' }]);
    }
  });

  it('keeps the error code when the body omits statusCode', async () => {
    const client = createApiClient({
      adapter: (config) =>
        fail(config, 404, {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        }),
      getAccessToken: () => Promise.resolve('token-1'),
      refreshAccessToken: () => Promise.resolve(null),
      onUnauthorized: vi.fn(),
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      status: 404,
      code: 'USER_NOT_FOUND',
      message: 'User not found',
    });
  });

  it('bootstraps the current user from a 404 body without statusCode', async () => {
    const user = {
      id: 'user-1',
      email: 'a@b.co',
      name: 'Ada',
      role: 'user',
      language: 'en',
      timeZone: 'Europe/Kyiv',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const client = createApiClient({
      adapter: (config) => {
        if (config.method?.toLowerCase() === 'put') {
          return Promise.resolve(response(config, 200, user));
        }
        return fail(config, 404, {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      },
      getAccessToken: () => Promise.resolve('token-1'),
      refreshAccessToken: () => Promise.resolve(null),
      onUnauthorized: vi.fn(),
    });

    await expect(
      fetchCurrentUser(client, { language: 'en', timeZone: 'Europe/Kyiv' }),
    ).resolves.toEqual(user);
  });

  it('maps a missing response to a network error', async () => {
    const client = createApiClient({
      adapter: (config) =>
        Promise.reject(
          new AxiosError('Network Error', AxiosError.ERR_NETWORK, config),
        ),
      getAccessToken: () => Promise.resolve('token-1'),
      refreshAccessToken: () => Promise.resolve(null),
      onUnauthorized: vi.fn(),
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });
});
