import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useGoal } from '@/entities/body/api/use-body';
import type { Units } from '@/entities/user/api/current-user.service';
import { BodyScreen } from '@/features/body/components/BodyScreen';
import { GoalForm } from '@/features/body/components/GoalForm';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton } from '@/shared/ui/skeleton';

function GoalEdit({ units }: { units: Units }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goal = useGoal();

  if (goal.isError) {
    return (
      <ErrorState
        message={t('body.loadError')}
        onRetry={() => {
          void goal.refetch();
        }}
      />
    );
  }

  if (goal.isPending) {
    return <Skeleton className="h-64 w-full rounded-xl" aria-hidden />;
  }

  return (
    <GoalForm
      goal={goal.data}
      units={units}
      submitLabel={t('body.save')}
      onSaved={() => {
        void navigate({ to: '/body' });
      }}
    />
  );
}

function GoalEditPage() {
  const { t } = useTranslation();

  return (
    <BodyScreen title={t('body.editGoalTitle')} backTo="/body">
      {(user) => <GoalEdit units={user.units} />}
    </BodyScreen>
  );
}

export { GoalEditPage };
