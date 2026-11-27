import type { TFunction } from 'i18next';

const VALIDATION_KEYS = [
  'validation.email',
  'validation.passwordMin',
  'validation.passwordMax',
  'validation.username',
  'validation.required',
  'validation.nameMax',
  'validation.nickname',
  'validation.nicknameTaken',
  'validation.date',
  'validation.age',
  'validation.height',
  'validation.weight',
  'validation.noteMax',
  'validation.calories',
  'validation.protein',
  'validation.fatShare',
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
