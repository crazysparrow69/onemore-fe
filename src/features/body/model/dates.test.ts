import { describe, expect, it } from 'vitest';
import { ageOn, isCalendarDate } from '@/features/body/model/dates';

describe('isCalendarDate', () => {
  it('accepts real dates, including 29 February of a leap year', () => {
    expect(isCalendarDate('1990-05-17')).toBe(true);
    expect(isCalendarDate('2024-02-29')).toBe(true);
  });

  it.each(['', '1990-5-17', '1990-13-01', '2023-02-29', '1990-04-31', 'abc'])(
    'rejects %j',
    (value) => {
      expect(isCalendarDate(value)).toBe(false);
    },
  );
});

describe('ageOn', () => {
  it('counts whole years', () => {
    expect(ageOn('1990-05-17', '2026-05-16')).toBe(35);
    expect(ageOn('1990-05-17', '2026-05-17')).toBe(36);
    expect(ageOn('1990-05-17', '2026-12-31')).toBe(36);
  });
});
