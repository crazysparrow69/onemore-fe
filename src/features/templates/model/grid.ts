export function setGridTemplate(fieldCount: number): string {
  return `2.75rem repeat(${String(fieldCount)}, minmax(0, 1fr))`;
}
