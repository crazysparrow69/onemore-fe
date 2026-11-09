import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '@/shared/api/client';
import { ApiError } from '@/shared/api/error';
import { fetchCurrentUser } from '@/features/auth/api/me.service';

const user = {
  id: 'user-1',
  email: 'a@b.co',
  name: 'Ada',
  role: 'user',
  language: 'en',
  timeZone: 'Europe/Kyiv',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const profile = { language: 'en' as const, timeZone: 'Europe/Kyiv' };

describe('fetchCurrentUser', () => {
  it('returns the user from GET /me', async () => {
    const put = vi.fn();
    const client: ApiClient = {
      get: vi.fn(() => Promise.resolve(user)),
      put,
    };

    await expect(fetchCurrentUser(client, profile)).resolves.toEqual(user);
    expect(put).not.toHaveBeenCalled();
  });

  it('creates the user with PUT when GET is 404', async () => {
    const put = vi.fn(() => Promise.resolve(user));
    const client: ApiClient = {
      get: vi.fn(() =>
        Promise.reject(new ApiError(404, 'USER_NOT_FOUND', 'User not found')),
      ),
      put,
    };

    await expect(fetchCurrentUser(client, profile)).resolves.toEqual(user);
    expect(put).toHaveBeenCalledWith('/me', profile);
  });
});
