import { describe, expect, it } from 'vitest';
import { uuidV7 } from '@/shared/lib/uuid';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidV7', () => {
  it('has the version and variant bits', () => {
    expect(uuidV7()).toMatch(UUID_V7);
  });

  it('embeds the time in the first 48 bits', () => {
    const id = uuidV7(0x0198b2c01234);
    expect(id.replace(/-/g, '').slice(0, 12)).toBe('0198b2c01234');
  });

  it('sorts by time and does not repeat', () => {
    const first = uuidV7(1_700_000_000_000);
    const second = uuidV7(1_700_000_000_001);
    expect(first < second).toBe(true);
    expect(uuidV7()).not.toBe(uuidV7());
  });
});
