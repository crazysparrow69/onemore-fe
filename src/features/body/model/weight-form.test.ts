import { describe, expect, it } from 'vitest';
import {
  weightDefaults,
  weightFormSchema,
  weightToKg,
} from '@/features/body/model/weight-form';

const today = '2026-11-27';

describe('weightFormSchema', () => {
  it('keeps kilograms as they are', () => {
    const schema = weightFormSchema('kg', today);

    expect(
      schema.parse({ date: '2026-11-20', weight: '82,4', note: ' morning ' }),
    ).toEqual({ date: '2026-11-20', weightKg: 82.4, note: 'morning' });
  });

  it('converts pounds to kilograms with three decimals', () => {
    const schema = weightFormSchema('lb', today);

    const parsed = schema.parse({ date: today, weight: '180', note: '' });

    expect(parsed.weightKg).toBe(81.647);
    expect(parsed.note).toBeNull();
  });

  it('checks the range after the conversion', () => {
    const lb = weightFormSchema('lb', today);
    const kg = weightFormSchema('kg', today);

    expect(lb.safeParse({ date: today, weight: '44', note: '' }).success).toBe(
      false,
    );
    expect(lb.safeParse({ date: today, weight: '45', note: '' }).success).toBe(
      true,
    );
    expect(
      kg.safeParse({ date: today, weight: '19.9', note: '' }).success,
    ).toBe(false);
    expect(kg.safeParse({ date: today, weight: '400', note: '' }).success).toBe(
      true,
    );
    expect(
      kg.safeParse({ date: today, weight: '400.1', note: '' }).success,
    ).toBe(false);
  });

  it('rejects text, an empty value and a future date', () => {
    const schema = weightFormSchema('kg', today);

    expect(
      schema.safeParse({ date: today, weight: 'x', note: '' }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ date: today, weight: '', note: '' }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ date: '2026-11-28', weight: '80', note: '' }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ date: '1999-12-31', weight: '80', note: '' }).success,
    ).toBe(false);
  });

  it('limits the note to 200 characters', () => {
    const schema = weightFormSchema('kg', today);

    expect(
      schema.safeParse({ date: today, weight: '80', note: 'a'.repeat(201) })
        .success,
    ).toBe(false);
  });
});

describe('weightToKg', () => {
  it('returns null outside the range', () => {
    expect(weightToKg('10', 'kg')).toBeNull();
    expect(weightToKg('80', 'kg')).toBe(80);
  });
});

describe('weightDefaults', () => {
  it('starts with today and an empty weight', () => {
    expect(weightDefaults(null, 'kg', today)).toEqual({
      date: today,
      weight: '',
      note: '',
    });
  });

  it('shows a saved entry in the units of the user', () => {
    expect(
      weightDefaults(
        {
          localDate: '2026-11-20',
          weightKg: 81.647,
          note: null,
          updatedAt: '2026-11-20T08:00:00.000Z',
        },
        'lb',
        today,
      ),
    ).toEqual({ date: '2026-11-20', weight: '180', note: '' });
  });
});
