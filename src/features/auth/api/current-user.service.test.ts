import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '@/shared/api/client';
import { ApiError } from '@/shared/api/error';
import {
  defaultAccountProfile,
  fetchCurrentUser,
  patchCurrentUser,
} from '@/features/auth/api/current-user.service';

const user = {
  id: 'user-1',
  email: 'a@b.co',
  name: 'Ada',
  nickname: 'ada',
  role: 'user',
  language: 'en',
  units: 'kg',
  timeZone: 'Europe/Kyiv',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const profile = {
  language: 'en' as const,
  units: 'kg' as const,
  timeZone: 'Europe/Kyiv',
};

function clientWith(overrides: Partial<ApiClient>): ApiClient {
  return {
    get: vi.fn(() => Promise.reject(new Error('unexpected GET'))),
    post: vi.fn(() => Promise.reject(new Error('unexpected POST'))),
    put: vi.fn(() => Promise.reject(new Error('unexpected PUT'))),
    patch: vi.fn(() => Promise.reject(new Error('unexpected PATCH'))),
    delete: vi.fn(() => Promise.reject(new Error('unexpected DELETE'))),
    ...overrides,
  };
}

describe('fetchCurrentUser', () => {
  it('returns the user from GET /me', async () => {
    const put = vi.fn();
    const client = clientWith({
      get: vi.fn(() => Promise.resolve(user)),
      put,
    });

    await expect(fetchCurrentUser(client, profile)).resolves.toEqual(user);
    expect(put).not.toHaveBeenCalled();
  });

  it('creates the user with PUT when GET is 404', async () => {
    const put = vi.fn(() => Promise.resolve(user));
    const client = clientWith({
      get: vi.fn(() =>
        Promise.reject(new ApiError(404, 'USER_NOT_FOUND', 'User not found')),
      ),
      put,
    });

    await expect(fetchCurrentUser(client, profile)).resolves.toEqual(user);
    expect(put).toHaveBeenCalledWith('/me', profile);
  });

  it('rejects a response that does not match the contract', async () => {
    const client = clientWith({
      get: vi.fn(() => Promise.resolve({ ...user, units: 'stone' })),
    });

    await expect(fetchCurrentUser(client, profile)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});

describe('patchCurrentUser', () => {
  it('sends only the given fields and returns the saved user', async () => {
    const saved = { ...user, units: 'lb' };
    const patch = vi.fn(() => Promise.resolve(saved));

    await expect(
      patchCurrentUser({ units: 'lb' }, clientWith({ patch })),
    ).resolves.toEqual(saved);
    expect(patch).toHaveBeenCalledWith('/me', { units: 'lb' });
  });

  it('passes an API error through, such as a taken nickname', async () => {
    const taken = new ApiError(
      409,
      'NICKNAME_TAKEN',
      'Nickname is already used',
    );
    const client = clientWith({ patch: vi.fn(() => Promise.reject(taken)) });

    await expect(patchCurrentUser({ nickname: 'ada' }, client)).rejects.toBe(
      taken,
    );
  });
});

describe('defaultAccountProfile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses Ukrainian for a Ukrainian browser, English otherwise, and kg', () => {
    vi.stubGlobal('navigator', { language: 'uk-UA' });
    expect(defaultAccountProfile()).toMatchObject({
      language: 'uk',
      units: 'kg',
    });

    vi.stubGlobal('navigator', { language: 'de-DE' });
    expect(defaultAccountProfile().language).toBe('en');
  });

  it('takes the time zone from the browser', () => {
    expect(defaultAccountProfile().timeZone).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });
});
