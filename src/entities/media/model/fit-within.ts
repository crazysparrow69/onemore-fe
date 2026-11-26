export interface Size {
  width: number;
  height: number;
}

export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): Size {
  const longest = Math.max(width, height);
  if (longest <= maxSide) {
    return { width, height };
  }
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
