import { describe, expect, it } from 'vitest';
import { bodyDefaults, bodyFormSchema } from '@/features/body/model/body-form';

const valid = {
  sex: 'female',
  birthDate: '1995-03-10',
  height: '168,5',
  activityLevel: 'active',
};

describe('bodyFormSchema', () => {
  const schema = bodyFormSchema('2026-11-27');

  it('turns the form into the API input', () => {
    expect(schema.parse(valid)).toEqual({
      sex: 'female',
      birthDate: '1995-03-10',
      heightCm: 168.5,
      activityLevel: 'active',
    });
  });

  it.each(['', 'abc', '99', '251', '-170'])(
    'rejects the height %j',
    (height) => {
      const result = schema.safeParse({ ...valid, height });
      expect(result.success).toBe(false);
    },
  );

  it('rejects a birth date that is not a date', () => {
    expect(schema.safeParse({ ...valid, birthDate: '' }).success).toBe(false);
    expect(
      schema.safeParse({ ...valid, birthDate: '1995-02-30' }).success,
    ).toBe(false);
  });

  it('keeps the age between 13 and 120', () => {
    expect(
      schema.safeParse({ ...valid, birthDate: '2014-11-28' }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...valid, birthDate: '2013-11-27' }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ ...valid, birthDate: '1905-11-27' }).success,
    ).toBe(false);
  });
});

describe('bodyDefaults', () => {
  it('is empty before the first save', () => {
    expect(bodyDefaults(null)).toEqual({
      sex: 'male',
      birthDate: '',
      height: '',
      activityLevel: 'light',
    });
  });

  it('shows the saved body', () => {
    expect(
      bodyDefaults({
        sex: 'female',
        birthDate: '1995-03-10',
        heightCm: 168.5,
        activityLevel: 'active',
        updatedAt: '2026-11-27T10:00:00.000Z',
      }),
    ).toEqual({
      sex: 'female',
      birthDate: '1995-03-10',
      height: '168.5',
      activityLevel: 'active',
    });
  });
});
