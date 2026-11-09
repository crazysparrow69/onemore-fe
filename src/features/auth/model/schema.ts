import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MAX_LENGTH = 64;

const email = z.email({ error: 'validation.email' });

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: 'validation.passwordMin' })
  .max(PASSWORD_MAX_LENGTH, { error: 'validation.passwordMax' });

export const signInSchema = z.object({
  email,
  password,
});

export const signUpSchema = z.object({
  email,
  password,
  username: z
    .string()
    .trim()
    .min(1, { error: 'validation.username' })
    .max(USERNAME_MAX_LENGTH, { error: 'validation.username' }),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
