import { describe, expect, it } from 'vitest';
import { fitWithin } from '@/entities/media/model/fit-within';

describe('fitWithin', () => {
  it('keeps a size that already fits', () => {
    expect(fitWithin(400, 300, 512)).toEqual({ width: 400, height: 300 });
    expect(fitWithin(512, 512, 512)).toEqual({ width: 512, height: 512 });
  });

  it('scales the longest side down to the limit and keeps the ratio', () => {
    expect(fitWithin(4000, 3000, 1000)).toEqual({ width: 1000, height: 750 });
    expect(fitWithin(3000, 4000, 1000)).toEqual({ width: 750, height: 1000 });
  });

  it('never returns a zero side', () => {
    expect(fitWithin(10_000, 1, 100)).toEqual({ width: 100, height: 1 });
  });
});
