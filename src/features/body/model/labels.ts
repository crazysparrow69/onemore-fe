import type { TFunction } from 'i18next';
import type { Units } from '@/entities/user/api/current-user.service';

export function unitLabel(t: TFunction, units: Units): string {
  return t(units === 'lb' ? 'settings.unitsLb' : 'settings.unitsKg');
}
