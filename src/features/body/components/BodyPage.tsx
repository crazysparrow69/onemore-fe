import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  useBody,
  useGoal,
  useLatestWeight,
} from '@/entities/body/api/use-body';
import { useTarget } from '@/entities/nutrition/api/use-target';
import type { Units } from '@/entities/user/api/current-user.service';
import { useToday } from '@/entities/user/api/use-today';
import { BodyCard } from '@/features/body/components/BodyCard';
import { BodyScreen } from '@/features/body/components/BodyScreen';
import { GoalCard } from '@/features/body/components/GoalCard';
import { TargetCard } from '@/features/body/components/TargetCard';
import { WeightSummaryCard } from '@/features/body/components/WeightSummaryCard';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

function BodyOverview({ units }: { units: Units }) {
  const { t } = useTranslation();
  const today = useToday();
  const body = useBody();
  const goal = useGoal();
  const weight = useLatestWeight();
  const target = useTarget(today());

  const queries = [body, goal, weight, target];

  if (queries.some((query) => query.isError)) {
    return (
      <ErrorState
        message={t('body.loadError')}
        onRetry={() => {
          for (const query of queries) {
            void query.refetch();
          }
        }}
      />
    );
  }

  if (queries.some((query) => query.isPending)) {
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const missing = [
    body.data ? null : t('body.missingBody'),
    goal.data ? null : t('body.missingGoal'),
    weight.data ? null : t('body.missingWeight'),
  ].filter((name): name is string => name !== null);

  return (
    <div className="flex flex-col gap-4">
      {missing.length > 0 ? (
        <Card as="section">
          <Text as="h2" size="lg" weight="semibold">
            {t('body.setupPromptTitle')}
          </Text>
          <Text size="sm" tone="muted">
            {t('body.setupPromptHint')}
          </Text>
          <Text size="sm" weight="medium">
            {missing.join(' · ')}
          </Text>
          <Button asChild>
            <Link to="/body/setup">{t('body.setupAction')}</Link>
          </Button>
        </Card>
      ) : null}
      {target.data ? (
        <TargetCard
          target={target.data}
          body={body.data ?? null}
          units={units}
        />
      ) : null}
      {weight.data ? (
        <WeightSummaryCard latest={weight.data} units={units} />
      ) : null}
      {body.data ? <BodyCard body={body.data} /> : null}
      {goal.data ? <GoalCard goal={goal.data} units={units} /> : null}
    </div>
  );
}

function BodyPage() {
  const { t } = useTranslation();

  return (
    <BodyScreen title={t('body.title')} backTo="/profile">
      {(user) => <BodyOverview units={user.units} />}
    </BodyScreen>
  );
}

export { BodyPage };
