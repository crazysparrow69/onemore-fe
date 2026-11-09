import { describe, expect, it } from 'vitest';
import { ENV_KEYS, loadValidatedEnv, validateEnv } from '@/shared/lib/env';

const valid = {
  PORT: '3000',
  API_URL: 'http://localhost:3001',
  VITE_NEON_AUTH_URL: 'https://auth.example.test/neondb/auth',
};

describe('validateEnv', () => {
  it('accepts a valid PORT and converts it to a number', () => {
    expect(validateEnv(valid)).toEqual({
      PORT: 3000,
      API_URL: 'http://localhost:3001',
      VITE_NEON_AUTH_URL: 'https://auth.example.test/neondb/auth',
    });
  });

  it('has no defaults: an empty environment reports every variable', () => {
    expect(() => validateEnv({})).toThrow(/^Invalid environment: /);
    for (const key of ENV_KEYS) {
      expect(() => validateEnv({})).toThrow(new RegExp(`${key}: is required`));
    }
  });

  it.each(ENV_KEYS)('throws when %s is missing', (key) => {
    const withoutKey = Object.fromEntries(
      Object.entries(valid).filter(([name]) => name !== key),
    );
    expect(() => validateEnv(withoutKey)).toThrow(
      new RegExp(`Invalid environment: ${key}: is required`),
    );
  });

  it('throws on an invalid PORT', () => {
    expect(() => validateEnv({ ...valid, PORT: 'nope' })).toThrow(
      /PORT: must be an integer between 1 and 65535/,
    );
    expect(() => validateEnv({ PORT: '70000' })).toThrow(/PORT:/);
    expect(() => validateEnv({ PORT: '' })).toThrow(/PORT:/);
  });

  it.each(['', 'not a url', 'ftp://localhost'])(
    'throws on an invalid API_URL (%j)',
    (value) => {
      expect(() => validateEnv({ ...valid, API_URL: value })).toThrow(
        /API_URL:/,
      );
    },
  );

  it.each(['', 'not a url', 'http://auth.example.test/auth'])(
    'throws on an invalid VITE_NEON_AUTH_URL (%j)',
    (value) => {
      expect(() =>
        validateEnv({ ...valid, VITE_NEON_AUTH_URL: value }),
      ).toThrow(/VITE_NEON_AUTH_URL:/);
    },
  );

  it('treats an undefined value as missing', () => {
    expect(() => loadValidatedEnv({ PORT: undefined })).toThrow(
      /PORT: is required/,
    );
  });
});
