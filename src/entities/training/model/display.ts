import type { TFunction } from 'i18next';
import type { Units } from '@/entities/user/api/current-user.service';
import type { WorkoutSet } from '@/entities/training/api/workouts.service';
import {
  formatClock,
  formatNumber,
  formatWeight,
} from '@/entities/training/model/format';

export function durationLabel(seconds: number, t: TFunction): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${String(minutes)} ${t('workout.minutesShort')}`;
  }
  return rest === 0
    ? `${String(hours)} ${t('workout.hoursShort')}`
    : `${String(hours)} ${t('workout.hoursShort')} ${String(rest)} ${t('workout.minutesShort')}`;
}

export function volumeLabel(
  volumeKg: number,
  units: Units,
  language: string,
  t: TFunction,
): string {
  return `${formatWeight(volumeKg, units, language)} ${t(units === 'lb' ? 'settings.unitsLb' : 'settings.unitsKg')}`;
}

export function setLabel(
  set: Pick<WorkoutSet, 'weightKg' | 'reps' | 'durationS' | 'distanceM'>,
  options: { units: Units; language: string; t: TFunction },
): string {
  const { units, language, t } = options;
  const unit = t(units === 'lb' ? 'settings.unitsLb' : 'settings.unitsKg');
  const weight =
    set.weightKg === null
      ? null
      : `${formatWeight(set.weightKg, units, language)} ${unit}`;
  const main =
    weight !== null && set.reps !== null
      ? `${weight} × ${String(set.reps)}`
      : (weight ??
        (set.reps === null
          ? null
          : `${String(set.reps)} ${t('workout.repsShort')}`));
  const extras = [
    set.distanceM === null
      ? null
      : `${formatNumber(set.distanceM / 1000, language)} ${t('workout.kmShort')}`,
    set.durationS === null ? null : formatClock(set.durationS),
  ];
  return [main, ...extras]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

export function dateLabel(localDate: string, language: string): string {
  const [year, month, day] = localDate.split('-').map(Number);
  return new Intl.DateTimeFormat(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

export function timeLabel(
  iso: string,
  timeZone: string,
  language: string,
): string {
  return new Intl.DateTimeFormat(language, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

export function setMark(
  kind: WorkoutSet['kind'],
  workingNumber: number,
  t: TFunction,
): string {
  switch (kind) {
    case 'warmup':
      return t('workout.warmupMark');
    case 'drop':
      return t('workout.dropMark');
    case 'failure':
      return t('workout.failureMark');
    case 'working':
      return String(workingNumber);
  }
}

export function workingNumbers(
  sets: readonly { kind: WorkoutSet['kind'] }[],
): number[] {
  let count = 0;
  return sets.map((set) => {
    if (set.kind === 'working') {
      count += 1;
    }
    return count;
  });
}
