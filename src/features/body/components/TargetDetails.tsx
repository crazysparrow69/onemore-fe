import { useTranslation } from 'react-i18next';
import type { Body } from '@/entities/body/model/schemas';
import type { Target } from '@/entities/nutrition/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import { formatNumber, formatWeight } from '@/entities/training/model/format';
import { unitLabel } from '@/features/body/model/labels';
import { explainTarget } from '@/features/body/model/explain-target';
import { Stat } from '@/shared/ui/stat';
import { Text } from '@/shared/ui/text';

function signed(value: number, language: string): string {
  const sign = value < 0 ? '−' : '+';
  return `${sign}${formatNumber(Math.abs(value), language)}`;
}

function TargetDetails({
  target,
  body,
  units,
}: {
  target: Target;
  body: Body | null;
  units: Units;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const explained = explainTarget(target);
  const { inputs, chain, shares } = explained;
  const kcal = t('target.kcal');
  const perKg = t('body.gPerKg');
  const ownProtein = body?.proteinGPerKg ?? null;
  const ownFat = body?.fatSharePercent ?? null;

  return (
    <div className="flex flex-col gap-4">
      {inputs ? (
        <section className="flex flex-col gap-2">
          <Text weight="medium">{t('target.inputsTitle')}</Text>
          <dl className="grid grid-cols-2 gap-y-3">
            <Stat label={t('weight.title')} numeric>
              {formatWeight(inputs.weightKg, units, language)}{' '}
              {unitLabel(t, units)}
            </Stat>
            <Stat label={t('body.height')} numeric>
              {formatNumber(inputs.heightCm, language)} {t('body.cmShort')}
            </Stat>
            <Stat label={t('body.age')} numeric>
              {t('body.ageYears', { count: inputs.age })}
            </Stat>
            <Stat label={t('body.activity')}>
              {t(`body.activityLevels.${inputs.activityLevel}`)}
            </Stat>
            <Stat label={t('goal.title')}>
              {t(`goal.types.${inputs.goalType}`)}
              {inputs.rateKgPerWeek !== null
                ? `, ${t('goal.perWeek', {
                    value: formatWeight(inputs.rateKgPerWeek, units, language),
                    unit: unitLabel(t, units),
                  })}`
                : ''}
            </Stat>
          </dl>
        </section>
      ) : null}
      {chain ? (
        <section className="flex flex-col gap-2">
          <Text weight="medium">{t('target.stepsTitle')}</Text>
          <dl className="grid grid-cols-2 gap-y-3">
            <Stat label={t('target.bmr')} numeric>
              {formatNumber(chain.bmrKcal, language)} {kcal}
            </Stat>
            <Stat label={t('target.activityFactor')} numeric>
              × {formatNumber(chain.activityFactor, language)}
            </Stat>
            <Stat label={t('target.tdee')} numeric>
              = {formatNumber(chain.tdeeKcal, language)} {kcal}
            </Stat>
            <Stat label={t('target.goalAdjustment')} numeric>
              {signed(chain.adjustmentKcal, language)} {kcal}
            </Stat>
            <Stat label={t('target.title')} numeric valueSize="md">
              = {formatNumber(target.caloriesKcal, language)} {kcal}
            </Stat>
          </dl>
          {target.floorApplied ? (
            <Text size="sm" tone="muted">
              {t('target.floorNote')}
            </Text>
          ) : null}
        </section>
      ) : (
        <Text size="sm" tone="muted">
          {t('target.manualExplain')}
        </Text>
      )}
      <section className="flex flex-col gap-2">
        <Text weight="medium">{t('target.sharesTitle')}</Text>
        <dl className="grid grid-cols-3 gap-y-3">
          <Stat label={t('target.protein')} numeric>
            {shares.proteinPercent}%
          </Stat>
          <Stat label={t('target.fat')} numeric>
            {shares.fatPercent}%
          </Stat>
          <Stat label={t('target.carbs')} numeric>
            {shares.carbsPercent}%
          </Stat>
        </dl>
        {explained.proteinPerKg !== null ? (
          <Text size="sm" tone="muted" numeric>
            {t('target.proteinPerKg', {
              value: formatNumber(explained.proteinPerKg, language),
              unit: perKg,
            })}
          </Text>
        ) : null}
        {explained.proteinCapped ? (
          <Text size="sm" tone="muted">
            {t('target.proteinCapped')}
          </Text>
        ) : null}
        {ownProtein !== null || ownFat !== null ? (
          <Text size="sm" tone="muted">
            {t('target.ownMacros', {
              protein:
                ownProtein === null
                  ? t('body.automatic')
                  : `${formatNumber(ownProtein, language)} ${perKg}`,
              fat:
                ownFat === null
                  ? t('body.automatic')
                  : `${formatNumber(ownFat, language)}%`,
            })}
          </Text>
        ) : null}
        <Text size="sm" tone="muted">
          {t('target.macroRules')}
        </Text>
      </section>
      <Text size="xs" tone="muted">
        {t('target.disclaimer')}
      </Text>
    </div>
  );
}

export { TargetDetails };
