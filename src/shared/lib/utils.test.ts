import { describe, expect, it } from 'vitest';
import { cn } from '@/shared/lib/utils';

describe('cn', () => {
  it('merges conflicting classes and drops falsy values', () => {
    expect(cn('px-2', 'px-4', false, undefined, 'text-sm')).toBe(
      'px-4 text-sm',
    );
  });
});
