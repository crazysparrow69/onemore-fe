import { describe, expect, it } from 'vitest';
import { profileSchema, settingsSchema } from '@/features/account/model/schema';

describe('profileSchema', () => {
  it('lower-cases and trims the nickname and trims the name', () => {
    expect(
      profileSchema.parse({ name: '  Ada ', nickname: ' Ada_L ' }),
    ).toEqual({ name: 'Ada', nickname: 'ada_l' });
  });

  it('allows an empty name and an empty nickname', () => {
    expect(profileSchema.safeParse({ name: '', nickname: '' }).success).toBe(
      true,
    );
  });

  it.each(['ab', 'a'.repeat(21), 'with space', 'dash-ed', 'юзер'])(
    'rejects the nickname %j',
    (nickname) => {
      const result = profileSchema.safeParse({ name: '', nickname });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('validation.nickname');
    },
  );

  it('rejects a name longer than 100 characters', () => {
    const result = profileSchema.safeParse({
      name: 'a'.repeat(101),
      nickname: '',
    });
    expect(result.error?.issues[0]?.message).toBe('validation.nameMax');
  });
});

describe('settingsSchema', () => {
  it('accepts a supported language, units and a time zone', () => {
    expect(
      settingsSchema.safeParse({
        language: 'uk',
        units: 'lb',
        timeZone: 'Europe/Kyiv',
      }).success,
    ).toBe(true);
  });

  it('rejects an unknown language, unknown units and an empty zone', () => {
    const ok = { language: 'en', units: 'kg', timeZone: 'UTC' };
    expect(settingsSchema.safeParse({ ...ok, language: 'ru' }).success).toBe(
      false,
    );
    expect(settingsSchema.safeParse({ ...ok, units: 'stone' }).success).toBe(
      false,
    );
    expect(settingsSchema.safeParse({ ...ok, timeZone: '' }).success).toBe(
      false,
    );
  });
});
