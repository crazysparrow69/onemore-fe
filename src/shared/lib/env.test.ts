import { describe, expect, it } from 'vitest';
import { ENV_KEYS, loadValidatedEnv, validateEnv } from '@/shared/lib/env';

const valid = { PORT: '3000' };

describe('validateEnv', () => {
  it('accepts a valid PORT and converts it to a number', () => {
    expect(validateEnv(valid)).toEqual({ PORT: 3000 });
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

  it('treats an undefined value as missing', () => {
    expect(() => loadValidatedEnv({ PORT: undefined })).toThrow(
      /PORT: is required/,
    );
  });
});
