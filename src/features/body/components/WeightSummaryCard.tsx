import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecentWeight } from '@/entities/body/api/use-body';
import type { WeightEntry } from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import { useToday } from '@/entities/user/api/use-today';
import { dateLabel } from '@/entities/training/model/display';
import { formatWeight } from '@/entities/training/model/format';
import { WeightEntrySheet } from '@/features/body/components/WeightEntrySheet';
import { unitLabel } from '@/features/body/model/labels';
import { WEIGHT_WINDOW_DAYS } from '@/features/body/model/rules';
import { weightChangeKg } from '@/features/body/model/weight-change';
import { shiftLocalDate } from '@/shared/lib/local-date';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Text } from '@/shared/ui/text';

function WeightSummaryCard({
  latest,
  units,
}: {
  latest: WeightEntry;
  units: Units;
}) {
  const { t, i18n } = useTranslation();
  const today = useToday();
  const [sheetOpen, setSheetOpen] = useState(false);
  const recent = useRecentWeight(shiftLocalDate(today(), -WEIGHT_WINDOW_DAYS));
  const change = recent.data ? weightChangeKg(recent.data) : null;
  const unit = unitLabel(t, units);

  return (
    <Card as="section">
      <div className="flex items-center justify-between gap-3">
        <Text as="h2" size="lg" weight="semibold">
          {t('weight.latest')}
        </Text>
        <Button asChild variant="link" size="none">
          <Link to="/weight">{t('weight.log')}</Link>
        </Button>
      </div>
      <Text size="3xl" weight="semibold" numeric>
        {formatWeight(latest.weightKg, units, i18n.language)} {unit}
      </Text>
      <Text size="sm" tone="muted">
        {t('weight.latestOn', {
          date: dateLabel(latest.localDate, i18n.language),
        })}
      </Text>
      {change !== null ? (
        <Text size="sm" tone="muted" numeric>
          {t('weight.change30', {
            value: `${change > 0 ? '+' : ''}${formatWeight(change, units, i18n.language)}`,
            unit,
          })}
        </Text>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          setSheetOpen(true);
        }}
      >
        {t('weight.add')}
      </Button>
      <WeightEntrySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entry={null}
        units={units}
      />
    </Card>
  );
}

export { WeightSummaryCard };
