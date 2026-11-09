import type { TFunction } from 'i18next';

const VALIDATION_KEYS = [
  'validation.email',
  'validation.passwordMin',
  'validation.passwordMax',
  'validation.username',
  'validation.required',
] as const;

type ValidationKey = (typeof VALIDATION_KEYS)[number];

function isValidationKey(value: string): value is ValidationKey {
  for (const key of VALIDATION_KEYS) {
    if (key === value) {
      return true;
    }
  }
  return false;
}

export function fieldError(
  t: TFunction,
  message: string | undefined,
): string | undefined {
  if (!message || !isValidationKey(message)) {
    return undefined;
  }
  return t(message);
}
