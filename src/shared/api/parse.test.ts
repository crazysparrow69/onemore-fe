import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { apiErrorKey, ApiError, hasErrorCode } from '@/shared/api/error';
import { parseResponse, resourcePath } from '@/shared/api/parse';

describe('parseResponse', () => {
  const schema = z.object({ id: z.string() });

  it('returns the parsed value', () => {
    expect(parseResponse(schema, { id: 'a', extra: 1 })).toEqual({ id: 'a' });
  });

  it('turns a malformed body into INVALID_RESPONSE', () => {
    expect(() => parseResponse(schema, { id: 1 })).toThrow(
      expect.objectContaining({ code: 'INVALID_RESPONSE', status: 500 }),
    );
  });
});

describe('resourcePath', () => {
  it('encodes the id', () => {
    expect(resourcePath('/workouts', 'a/b c')).toBe('/workouts/a%2Fb%20c');
  });
});

describe('api error helpers', () => {
  const error = new ApiError(409, 'EXERCISE_CHANGED', 'x');

  it('checks the code of an api error only', () => {
    expect(hasErrorCode(error, 'EXERCISE_CHANGED')).toBe(true);
    expect(hasErrorCode(error, 'OTHER')).toBe(false);
    expect(hasErrorCode(new Error('x'), 'EXERCISE_CHANGED')).toBe(false);
  });

  it('maps codes to keys with a fallback', () => {
    const keys = { EXERCISE_CHANGED: 'changed' } as const;

    expect(apiErrorKey(error, keys, 'generic')).toBe('changed');
    expect(apiErrorKey(new ApiError(500, 'X', 'x'), keys, 'generic')).toBe(
      'generic',
    );
    expect(apiErrorKey('boom', keys, 'generic')).toBe('generic');
  });
});
