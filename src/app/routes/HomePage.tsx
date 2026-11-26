import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import { useWorkoutList } from '@/features/workouts/api/use-workouts';
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

export function HomePage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const list = useWorkoutList();
  const last = list.data?.pages[0]?.items[0];

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-8">
      <Text as="h1" size="2xl" weight="semibold">
        {user.data?.name
          ? t('home.greeting', { name: user.data.name })
          : t('home.title')}
      </Text>

      <section className="flex flex-col gap-3">
        <Text as="h2" size="lg" weight="semibold">
          {t('home.lastWorkout')}
        </Text>

        {list.isPending ? (
          <Skeleton className="h-40 w-full rounded-xl" aria-hidden />
        ) : null}

        {list.isError ? (
          <div className="flex flex-col items-start gap-3">
            <Text tone="danger">{t('errors.generic.description')}</Text>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void list.refetch();
              }}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {last ? <WorkoutCard workout={last} /> : null}

        {list.data && !last ? (
          <div className="flex flex-col items-start gap-3 rounded-xl bg-card p-4">
            <div className="flex flex-col gap-1">
              <Text weight="medium">{t('home.emptyTitle')}</Text>
              <Text size="sm" tone="muted">
                {t('home.emptyHint')}
              </Text>
            </div>
            <Button asChild>
              <Link to="/training">{t('home.toTraining')}</Link>
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
