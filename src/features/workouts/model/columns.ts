import type { Units } from '@/features/auth/api/current-user.service';
import type { FieldRule } from '@/features/workouts/model/draft';

export function columnTemplate(fields: readonly FieldRule[]): string {
  return `2.75rem repeat(${String(fields.length)}, minmax(0, 1fr)) 2.75rem`;
}

export function columnLabelKey(
  rule: FieldRule,
  units: Units,
):
  | 'workout.col.weightKg'
  | 'workout.col.weightLb'
  | 'workout.col.signedKg'
  | 'workout.col.signedLb'
  | 'workout.col.reps'
  | 'workout.col.durationS'
  | 'workout.col.distanceM' {
  if (rule.id === 'weightKg') {
    const signed = rule.min < 0;
    if (units === 'lb') {
      return signed ? 'workout.col.signedLb' : 'workout.col.weightLb';
    }
    return signed ? 'workout.col.signedKg' : 'workout.col.weightKg';
  }
  return `workout.col.${rule.id}`;
}
