import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  useBody,
  useGoal,
  useLatestWeight,
} from '@/entities/body/api/use-body';
import type { Units } from '@/entities/user/api/current-user.service';
import { BodyForm } from '@/features/body/components/BodyForm';
import { BodyScreen } from '@/features/body/components/BodyScreen';
import { GoalForm } from '@/features/body/components/GoalForm';
import { WeightForm } from '@/features/body/components/WeightForm';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

const STEPS = 3;

function SetupSteps({ units }: { units: Units }) {
  const { t } = useTranslation();
  const body = useBody();
  const goal = useGoal();
  const weight = useLatestWeight();
  const queries = [body, goal, weight];

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
    return <Skeleton className="h-64 w-full rounded-xl" aria-hidden />;
  }

  if (body.data && goal.data && weight.data) {
    return <Navigate to="/body" replace />;
  }

  const step = !body.data ? 1 : !goal.data ? 2 : 3;
  const titles = [t('body.stepBody'), t('body.stepGoal'), t('body.stepWeight')];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Text size="sm" tone="muted">
          {t('body.setupHint')}
        </Text>
        <Text size="sm" tone="muted" numeric>
          {t('body.setupStep', { current: step, total: STEPS })}
        </Text>
        <Text as="h2" size="lg" weight="semibold">
          {titles[step - 1]}
        </Text>
      </div>
      {step === 1 ? (
        <BodyForm key="body" body={null} submitLabel={t('body.next')} />
      ) : null}
      {step === 2 ? (
        <GoalForm
          key="goal"
          goal={null}
          units={units}
          submitLabel={t('body.next')}
        />
      ) : null}
      {step === 3 ? (
        <WeightForm key="weight" entry={null} units={units} />
      ) : null}
    </div>
  );
}

function BodySetupPage() {
  const { t } = useTranslation();

  return (
    <BodyScreen title={t('body.setupTitle')} backTo="/profile">
      {(user) => <SetupSteps units={user.units} />}
    </BodyScreen>
  );
}

export { BodySetupPage };
