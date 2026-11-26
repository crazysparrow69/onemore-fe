import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import { useWorkoutList } from '@/features/workouts/api/use-workouts';
import type { WorkoutListItem } from '@/features/workouts/api/workouts.service';
import {
  dateLabel,
  durationLabel,
  volumeLabel,
} from '@/features/workouts/model/display';
import { LoadMore } from '@/shared/ui/load-more';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

const SHOWN_EXERCISES = 3;

function WorkoutCard({ workout }: { workout: WorkoutListItem }) {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const units = user.data?.units ?? 'kg';
  const rest = workout.exercises.length - SHOWN_EXERCISES;

  return (
    <li>
      <Link
        to="/workouts/$workoutId"
        params={{ workoutId: workout.id }}
        className="flex flex-col gap-3 rounded-xl bg-card p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="flex flex-col">
          <span className="truncate text-lg font-semibold">{workout.name}</span>
          <span className="text-sm text-muted-foreground">
            {dateLabel(workout.localDate, i18n.language)}
          </span>
        </span>
        <dl className="grid grid-cols-3 text-sm">
          <div>
            <dt className="text-muted-foreground">
              {t('workout.totalDuration')}
            </dt>
            <dd className="font-medium">
              {durationLabel(workout.summary.durationS, t)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              {t('workout.totalVolume')}
            </dt>
            <dd className="font-medium">
              {volumeLabel(workout.summary.volumeKg, units, i18n.language, t)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('workout.totalSets')}</dt>
            <dd className="font-medium">{workout.summary.setCount}</dd>
          </div>
        </dl>
        <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
          {workout.exercises
            .slice(0, SHOWN_EXERCISES)
            .map((exercise, index) => (
              <li key={`${exercise.exerciseId}-${String(index)}`}>
                {t('workout.setsCount', { count: exercise.setCount })}{' '}
                {exercise.name}
              </li>
            ))}
          {rest > 0 ? (
            <li>{t('workout.moreExercises', { count: rest })}</li>
          ) : null}
        </ul>
      </Link>
    </li>
  );
}

function WorkoutHistoryPage() {
  const { t } = useTranslation();
  const list = useWorkoutList();
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center bg-background px-4 pt-4 pb-3">
        <Link
          to="/"
          aria-label={t('common.back')}
          className="inline-flex size-10 items-center justify-center rounded-full bg-secondary outline-none hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <Text as="h1" size="lg" weight="semibold" className="text-center">
          {t('workout.historyTitle')}
        </Text>
        <span />
      </header>

      <section className="flex flex-1 flex-col gap-3 px-4 pb-8">
        {list.isPending ? (
          <div className="flex flex-col gap-3" aria-hidden>
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : null}

        {list.isError ? (
          <div className="flex flex-col items-start gap-3 py-4">
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

        {list.data && items.length === 0 ? (
          <div className="flex flex-col gap-1 py-6">
            <Text weight="medium">{t('workout.historyEmpty')}</Text>
            <Text tone="muted">{t('workout.historyEmptyHint')}</Text>
          </div>
        ) : null}

        {items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {items.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </ul>
        ) : null}

        {list.isFetchingNextPage ? (
          <Skeleton className="h-40 w-full rounded-xl" aria-hidden />
        ) : null}
        {list.hasNextPage && !list.isFetchingNextPage ? (
          <LoadMore
            onVisible={() => {
              void list.fetchNextPage();
            }}
          />
        ) : null}
      </section>
    </main>
  );
}

export { WorkoutHistoryPage };
