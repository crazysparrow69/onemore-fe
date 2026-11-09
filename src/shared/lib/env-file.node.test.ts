import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENV_KEYS } from './env.ts';

describe('.env.example', () => {
  it('lists exactly the schema keys, with PORT 3000', () => {
    const pairs = readFileSync('.env.example', 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)] as const;
      });

    expect(pairs.map(([key]) => key)).toEqual(ENV_KEYS);
    expect(Object.fromEntries(pairs)).toEqual({
      PORT: '3000',
      API_URL: 'http://localhost:3001',
      VITE_NEON_AUTH_URL:
        'https://example.neonauth.eu-central-1.aws.neon.tech/neondb/auth',
    });
  });
});
