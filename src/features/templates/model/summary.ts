import type { TFunction } from 'i18next';
import type { Template } from '@/features/templates/api/templates.service';
import type { TemplateChange } from '@/features/templates/model/update-from-workout';
import { formatClock } from '@/entities/training/model/format';

export function exercisesLine(template: Template): string {
  return template.exercises.map((exercise) => exercise.name).join(', ');
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function lastPerformedLabel(
  template: Template,
  now: Date,
  language: string,
  t: TFunction,
): string | null {
  if (template.lastPerformedAt === null) {
    return null;
  }
  const performed = new Date(template.lastPerformedAt);
  const startOfDay = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(performed)) / DAY_MS);
  if (days <= 0) {
    return t('templates.lastToday');
  }
  const relative = new Intl.RelativeTimeFormat(language, { numeric: 'always' });
  return t('templates.last', { when: relative.format(-days, 'day') });
}

export function copyName(name: string, suffix: string, max: number): string {
  const tail = ` ${suffix}`;
  return `${name.slice(0, Math.max(1, max - tail.length)).trimEnd()}${tail}`;
}

export function changeLabel(change: TemplateChange, t: TFunction): string {
  const rest = (seconds: number | null): string =>
    seconds === null ? t('workout.rest.offShort') : formatClock(seconds);
  switch (change.kind) {
    case 'added':
      return t('templates.update.added', { name: change.name });
    case 'removed':
      return t('templates.update.removed', { name: change.name });
    case 'order':
      return t('templates.update.order');
    case 'sets':
      return t('templates.update.sets', {
        name: change.name,
        from: change.from,
        to: change.to,
      });
    case 'values':
      return t('templates.update.values', { names: change.name });
    case 'rest':
      return t('templates.update.rest', {
        name: change.name,
        from: rest(change.from),
        to: rest(change.to),
      });
  }
}
