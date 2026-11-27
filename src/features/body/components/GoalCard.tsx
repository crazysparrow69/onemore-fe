import { Link } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Goal } from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import { formatWeight } from '@/entities/training/model/format';
import { unitLabel } from '@/features/body/model/labels';
import { Card } from '@/shared/ui/card';
import { IconButton } from '@/shared/ui/icon-button';
import { Text } from '@/shared/ui/text';

function GoalCard({ goal, units }: { goal: Goal; units: Units }) {
  const { t, i18n } = useTranslation();
  const unit = unitLabel(t, units);

  return (
    <Card as="section">
      <div className="flex items-center justify-between gap-3">
        <Text as="h2" size="lg" weight="semibold">
          {t('goal.title')}
        </Text>
        <IconButton asChild aria-label={t('body.edit')}>
          <Link to="/body/goal">
            <Pencil aria-hidden />
          </Link>
        </IconButton>
      </div>
      <Text weight="medium">{t(`goal.types.${goal.type}`)}</Text>
      {goal.rateKgPerWeek !== null ? (
        <Text size="sm" tone="muted" numeric>
          {t('goal.perWeek', {
            value: formatWeight(goal.rateKgPerWeek, units, i18n.language),
            unit,
          })}
        </Text>
      ) : null}
      {goal.targetWeightKg !== null ? (
        <Text size="sm" tone="muted" numeric>
          {t('goal.target', {
            value: formatWeight(goal.targetWeightKg, units, i18n.language),
            unit,
          })}
        </Text>
      ) : null}
    </Card>
  );
}

export { GoalCard };
