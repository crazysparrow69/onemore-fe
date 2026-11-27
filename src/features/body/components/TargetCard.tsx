import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUseAutoTarget } from '@/entities/nutrition/api/use-target';
import type { Target } from '@/entities/nutrition/model/schemas';
import { dateLabel } from '@/entities/training/model/display';
import { formatNumber } from '@/entities/training/model/format';
import { ManualTargetSheet } from '@/features/body/components/ManualTargetSheet';
import { hasErrorCode } from '@/shared/api/error';
import { toast } from '@/shared/lib/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Stat } from '@/shared/ui/stat';
import { Text } from '@/shared/ui/text';

function TargetCard({ target }: { target: Target }) {
  const { t, i18n } = useTranslation();
  const [manualOpen, setManualOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const autoTarget = useUseAutoTarget();
  const grams = t('target.gramsShort');
  const kcal = t('target.kcal');
  const hasDetails = target.bmrKcal !== null && target.tdeeKcal !== null;

  function backToAuto(): void {
    autoTarget.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('target.autoSaved'));
      },
      onError: (error) => {
        toast.error(
          hasErrorCode(error, 'TARGET_INPUTS_MISSING')
            ? t('target.inputsMissing')
            : t('errors.generic.description'),
        );
      },
    });
  }

  return (
    <Card as="section">
      <div className="flex items-center justify-between gap-3">
        <Text as="h2" size="lg" weight="semibold">
          {t('target.title')}
        </Text>
        <Badge>
          {target.source === 'auto' ? t('target.auto') : t('target.manual')}
        </Badge>
      </div>
      <Text as="p" size="3xl" weight="semibold" numeric>
        {formatNumber(target.caloriesKcal, i18n.language)} {kcal}
      </Text>
      <dl className="grid grid-cols-3">
        <Stat label={t('target.protein')} numeric>
          {formatNumber(target.proteinG, i18n.language)} {grams}
        </Stat>
        <Stat label={t('target.fat')} numeric>
          {formatNumber(target.fatG, i18n.language)} {grams}
        </Stat>
        <Stat label={t('target.carbs')} numeric>
          {formatNumber(target.carbsG, i18n.language)} {grams}
        </Stat>
      </dl>
      <Text size="sm" tone="muted">
        {t('target.since', {
          date: dateLabel(target.effectiveFrom, i18n.language),
        })}
      </Text>
      {target.floorApplied ? (
        <Text size="sm" tone="muted">
          {t('target.floorNote')}
        </Text>
      ) : null}
      {hasDetails ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="link"
            size="none"
            className="self-start"
            aria-expanded={detailsOpen}
            onClick={() => {
              setDetailsOpen((open) => !open);
            }}
          >
            {t('target.details')}
          </Button>
          {detailsOpen ? (
            <dl className="grid grid-cols-2">
              <Stat label={t('target.bmr')} numeric>
                {formatNumber(target.bmrKcal ?? 0, i18n.language)} {kcal}
              </Stat>
              <Stat label={t('target.tdee')} numeric>
                {formatNumber(target.tdeeKcal ?? 0, i18n.language)} {kcal}
              </Stat>
            </dl>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setManualOpen(true);
          }}
        >
          {t('target.changeManual')}
        </Button>
        {target.source === 'manual' ? (
          <Button
            type="button"
            variant="ghost"
            loading={autoTarget.isPending}
            onClick={backToAuto}
          >
            {t('target.backToAuto')}
          </Button>
        ) : null}
      </div>
      <ManualTargetSheet
        open={manualOpen}
        onOpenChange={setManualOpen}
        calories={target.caloriesKcal}
      />
    </Card>
  );
}

export { TargetCard };
