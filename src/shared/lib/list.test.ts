import { describe, expect, it } from 'vitest';
import { blankToNull, mapById, moveById, takeRoom } from '@/shared/lib/list';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('mapById', () => {
  it('changes only the matching item', () => {
    const next = mapById(items, 'b', (item) => ({ id: `${item.id}!` }));

    expect(next).toEqual([{ id: 'a' }, { id: 'b!' }, { id: 'c' }]);
    expect(next[0]).toBe(items[0]);
  });
});

describe('moveById', () => {
  it('moves an item one step', () => {
    expect(moveById(items, 'a', 1).map((item) => item.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(moveById(items, 'c', -1).map((item) => item.id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('returns the same list when the move is impossible', () => {
    expect(moveById(items, 'a', -1)).toBe(items);
    expect(moveById(items, 'c', 1)).toBe(items);
    expect(moveById(items, 'zzz', 1)).toBe(items);
  });
});

describe('takeRoom', () => {
  it('keeps only what fits', () => {
    expect(takeRoom([1, 2, 3], 3, 4)).toEqual([1]);
    expect(takeRoom([1, 2, 3], 4, 4)).toEqual([]);
    expect(takeRoom([1, 2, 3], 9, 4)).toEqual([]);
  });
});

describe('blankToNull', () => {
  it('trims and nulls blanks', () => {
    expect(blankToNull('  hi ')).toBe('hi');
    expect(blankToNull('   ')).toBeNull();
  });
});
