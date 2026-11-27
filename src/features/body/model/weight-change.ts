import type { WeightEntry } from '@/entities/body/model/schemas';

export function weightChangeKg(entries: readonly WeightEntry[]): number | null {
  const latest = entries[0];
  const oldest = entries.at(-1);
  if (!latest || !oldest || latest.localDate === oldest.localDate) {
    return null;
  }
  return Math.round((latest.weightKg - oldest.weightKg) * 1000) / 1000;
}
