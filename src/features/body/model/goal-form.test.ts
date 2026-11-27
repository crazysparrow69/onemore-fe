import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RATE,
  goalDefaults,
  goalFormSchema,
  nearestRate,
} from '@/features/body/model/goal-form';

describe('goalFormSchema', () => {
  it('sends the rate in kilograms for losing and gaining', () => {
    const schema = goalFormSchema('kg');

    expect(
      schema.parse({ type: 'lose', rate: '0.5', targetWeight: '' }),
    ).toEqual({ type: 'lose', rateKgPerWeek: 0.5, targetWeightKg: null });
    expect(
      schema.parse({ type: 'gain', rate: '0.25', targetWeight: '90' }),
    ).toEqual({ type: 'gain', rateKgPerWeek: 0.25, targetWeightKg: 90 });
  });

  it('converts pounds per week and the target weight', () => {
    const schema = goalFormSchema('lb');

    expect(
      schema.parse({ type: 'lose', rate: '1', targetWeight: '176' }),
    ).toEqual({ type: 'lose', rateKgPerWeek: 0.454, targetWeightKg: 79.832 });
  });

  it('has no rate for maintaining and recomposition', () => {
    const schema = goalFormSchema('kg');

    expect(
      schema.parse({ type: 'maintain', rate: '0.5', targetWeight: '' }),
    ).toEqual({ type: 'maintain', rateKgPerWeek: null, targetWeightKg: null });
    expect(
      schema.parse({ type: 'recomp', rate: '1', targetWeight: '' }),
    ).toEqual({ type: 'recomp', rateKgPerWeek: null, targetWeightKg: null });
  });

  it('rejects a target weight out of range and a missing rate', () => {
    const schema = goalFormSchema('kg');

    expect(
      schema.safeParse({ type: 'lose', rate: '0.5', targetWeight: '10' })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({ type: 'lose', rate: '', targetWeight: '' }).success,
    ).toBe(false);
  });
});

describe('nearestRate', () => {
  it('finds the preset closest to the saved rate', () => {
    expect(nearestRate(0.5, 'kg')).toBe('0.5');
    expect(nearestRate(0.3, 'kg')).toBe('0.25');
    expect(nearestRate(0.454, 'lb')).toBe('1');
    expect(nearestRate(0.907, 'lb')).toBe('2');
  });
});

describe('goalDefaults', () => {
  it('starts with losing weight at the default rate', () => {
    expect(goalDefaults(null, 'kg')).toEqual({
      type: 'lose',
      rate: DEFAULT_RATE.kg,
      targetWeight: '',
    });
  });

  it('shows the saved goal in the units of the user', () => {
    expect(
      goalDefaults(
        {
          type: 'gain',
          rateKgPerWeek: 0.454,
          targetWeightKg: 90.718,
          effectiveFrom: '2026-11-27',
        },
        'lb',
      ),
    ).toEqual({ type: 'gain', rate: '1', targetWeight: '200' });
  });
});
