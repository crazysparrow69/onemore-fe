import { describe, expect, it } from 'vitest';
import { manualTargetSchema } from '@/features/body/model/target-form';

describe('manualTargetSchema', () => {
  it('accepts whole calories from 1000 to 6000', () => {
    expect(manualTargetSchema.parse({ calories: '2500' })).toBe(2500);
    expect(manualTargetSchema.parse({ calories: '1000' })).toBe(1000);
    expect(manualTargetSchema.parse({ calories: '6000' })).toBe(6000);
  });

  it.each(['', '999', '6001', '2500.5', 'abc', '-2000'])(
    'rejects %j',
    (calories) => {
      expect(manualTargetSchema.safeParse({ calories }).success).toBe(false);
    },
  );
});
