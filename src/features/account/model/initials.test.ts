import { describe, expect, it } from 'vitest';
import { initials } from '@/features/account/model/initials';

const base = { name: null, nickname: null, email: 'zed@example.com' };

describe('initials', () => {
  it('takes the first letters of the first two words of the name', () => {
    expect(initials({ ...base, name: 'Ada Lovelace' })).toBe('AL');
    expect(initials({ ...base, name: '  ada   king  lovelace ' })).toBe('AK');
  });

  it('uses one letter for a one-word name', () => {
    expect(initials({ ...base, name: 'Ada' })).toBe('A');
  });

  it('works for Cyrillic names', () => {
    expect(initials({ ...base, name: 'сергій петренко' })).toBe('СП');
  });

  it('falls back to the nickname, then to the email', () => {
    expect(initials({ ...base, nickname: 'bob_7' })).toBe('B');
    expect(initials(base)).toBe('Z');
  });

  it('treats a blank name as missing', () => {
    expect(initials({ ...base, name: '   ', nickname: 'kay' })).toBe('K');
  });
});
