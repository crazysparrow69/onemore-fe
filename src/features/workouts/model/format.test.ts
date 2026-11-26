import { describe, expect, it } from 'vitest';
import {
  formatClock,
  formatWeight,
  fromLocalInput,
  kgToUnits,
  parseDecimal,
  parseDuration,
  parseInteger,
  toLocalInput,
  unitsToKg,
} from '@/features/workouts/model/format';

describe('weight units', () => {
  it('keeps kilograms and converts pounds with two digits', () => {
    expect(kgToUnits(100, 'kg')).toBe(100);
    expect(kgToUnits(100, 'lb')).toBe(220.46);
    expect(unitsToKg(225, 'lb')).toBe(102.058);
    expect(unitsToKg(80, 'kg')).toBe(80);
  });

  it('formats a weight in the language of the user', () => {
    expect(formatWeight(82.5, 'kg', 'en')).toBe('82.5');
    expect(formatWeight(82.5, 'kg', 'uk')).toBe('82,5');
  });
});

describe('parseDecimal', () => {
  it.each([
    ['82.5', 82.5],
    ['82,5', 82.5],
    ['-20', -20],
    ['.5', 0.5],
    ['10.', 10],
  ])('reads %s', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  it.each(['', '  ', 'abc', '1.2.3', '-', '1e3'])('rejects "%s"', (text) => {
    expect(parseDecimal(text)).toBeNull();
  });
});

describe('parseInteger', () => {
  it('reads whole numbers only', () => {
    expect(parseInteger(' 12 ')).toBe(12);
    expect(parseInteger('0')).toBe(0);
    expect(parseInteger('1.5')).toBeNull();
    expect(parseInteger('-1')).toBeNull();
    expect(parseInteger('')).toBeNull();
  });
});

describe('parseDuration', () => {
  it.each([
    ['45', 45],
    ['1:30', 90],
    ['1:00:00', 3600],
    ['0:05', 5],
  ])('reads %s as seconds', (text, expected) => {
    expect(parseDuration(text)).toBe(expected);
  });

  it.each(['', '1:2:3:4', 'a', '1:-2', '1.5'])('rejects "%s"', (text) => {
    expect(parseDuration(text)).toBeNull();
  });
});

describe('formatClock', () => {
  it('shows minutes and seconds, adds hours when needed', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('local date time input', () => {
  it('round trips through the local time', () => {
    const iso = '2026-11-25T10:30:00.000Z';
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
  });

  it('returns null for a broken value', () => {
    expect(fromLocalInput('')).toBeNull();
  });
});
