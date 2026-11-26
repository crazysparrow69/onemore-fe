export interface Identified {
  id: string;
}

export function mapById<T extends Identified>(
  items: readonly T[],
  id: string,
  change: (item: T, index: number) => T,
): T[] {
  return items.map((item, index) =>
    item.id === id ? change(item, index) : item,
  );
}

export function moveById<T extends Identified>(
  items: T[],
  id: string,
  direction: -1 | 1,
): T[] {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  const moved = items[index];
  if (moved === undefined || target < 0 || target >= items.length) {
    return items;
  }
  const next = items.filter((item) => item.id !== id);
  next.splice(target, 0, moved);
  return next;
}

export function takeRoom<T>(
  items: readonly T[],
  used: number,
  capacity: number,
): T[] {
  return items.slice(0, Math.max(0, capacity - used));
}

export function blankToNull(text: string): string | null {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}
