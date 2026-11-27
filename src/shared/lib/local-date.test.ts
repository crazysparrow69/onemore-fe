import { describe, expect, it } from 'vitest';
import { localDate, shiftLocalDate } from '@/shared/lib/local-date';

describe('localDate', () => {
  const instant = new Date('2026-03-10T23:30:00Z');

  it('gives the date in the given zone', () => {
    expect(localDate(instant, 'UTC')).toBe('2026-03-10');
    expect(localDate(instant, 'Europe/Kyiv')).toBe('2026-03-11');
    expect(localDate(instant, 'America/Los_Angeles')).toBe('2026-03-10');
  });

  it('pads month and day', () => {
    expect(localDate(new Date('2026-01-02T12:00:00Z'), 'UTC')).toBe(
      '2026-01-02',
    );
  });
});

describe('shiftLocalDate', () => {
  it('moves across month and year borders', () => {
    expect(shiftLocalDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftLocalDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftLocalDate('2024-02-28', 1)).toBe('2024-02-29');
  });
});
