import { describe, expect, it } from 'vitest';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  signInSchema,
  signUpSchema,
} from '@/features/auth/model/schema';

const password = 'a'.repeat(PASSWORD_MIN_LENGTH);

describe('signInSchema', () => {
  it('accepts a valid email and an 8 character password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.co', password }).success).toBe(
      true,
    );
  });

  it('rejects a 7 character password and a 129 character password', () => {
    expect(
      signInSchema.safeParse({
        email: 'a@b.co',
        password: 'a'.repeat(PASSWORD_MIN_LENGTH - 1),
      }).success,
    ).toBe(false);
    expect(
      signInSchema.safeParse({
        email: 'a@b.co',
        password: 'a'.repeat(PASSWORD_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it('accepts a 128 character password', () => {
    expect(
      signInSchema.safeParse({
        email: 'a@b.co',
        password: 'a'.repeat(PASSWORD_MAX_LENGTH),
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(
      signInSchema.safeParse({ email: 'not-an-email', password }).success,
    ).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('requires a username and trims it', () => {
    expect(
      signUpSchema.safeParse({ email: 'a@b.co', password, username: '   ' })
        .success,
    ).toBe(false);

    const parsed = signUpSchema.safeParse({
      email: 'a@b.co',
      password,
      username: '  ada  ',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.username).toBe('ada');
    }
  });
});
