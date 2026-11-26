import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Ellipsis, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseRow';
import {
  useDeleteWorkout,
  useWorkout,
} from '@/features/workouts/api/use-workouts';
import {
  dateLabel,
  durationLabel,
  setLabel,
  setMark,
  timeLabel,
  volumeLabel,
  workingNumbers,
} from '@/features/workouts/model/display';
import { ApiError } from '@/shared/api/error';
import { toast } from '@/shared/lib/toast';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

const route = getRouteApi('/workouts/$workoutId');

function WorkoutDetailsPage() {
  const { t, i18n } = useTranslation();
  const { workoutId } = route.useParams();
  const router = useRouter();
  const user = useCurrentUser();
  const workout = useWorkout(workoutId);
  const [menu, setMenu] = useState<'actions' | 'delete' | null>(null);
  const remove = useDeleteWorkout(workoutId);
  const units = user.data?.units ?? 'kg';
  const data = workout.data;
  const notFound =
    workout.error instanceof ApiError &&
    workout.error.code === 'WORKOUT_NOT_FOUND';

  function removeWorkout() {
    remove.mutate(undefined, {
      onSuccess: () => {
        setMenu(null);
        toast.success(t('workout.deleted'));
        void router.navigate({ to: '/profile', replace: true });
      },
      onError: () => {
        toast.error(t('errors.generic.description'));
      },
    });
  }

  function goBack() {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      void router.navigate({ to: '/profile' });
    }
  }

  return (
    <main className="flex flex-1 flex-col pb-8">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <IconButton aria-label={t('common.back')} onClick={goBack}>
          <ArrowLeft aria-hidden />
        </IconButton>
        {data ? (
          <IconButton
            aria-label={t('workout.detailsMenu')}
            onClick={() => {
              setMenu('actions');
            }}
          >
            <Ellipsis aria-hidden />
          </IconButton>
        ) : null}
      </header>

      {workout.isPending ? (
        <div className="flex flex-col gap-4 px-4" aria-hidden>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {workout.isError ? (
        <div className="flex flex-col items-start gap-3 px-4 py-4">
          <Text tone={notFound ? 'muted' : 'danger'}>
            {notFound ? t('workout.notFound') : t('errors.generic.description')}
          </Text>
          {notFound ? (
            <Button asChild variant="secondary">
              <Link to="/profile">{t('workout.toHistory')}</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void workout.refetch();
              }}
            >
              {t('common.retry')}
            </Button>
          )}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="flex flex-col gap-1 px-4">
            <Text as="h1" size="xl" weight="semibold">
              {data.name}
            </Text>
            <Text size="sm" tone="muted">
              {dateLabel(data.localDate, i18n.language)} ·{' '}
              {timeLabel(data.startedAt, data.timeZone, i18n.language)}
            </Text>
            {data.notes ? (
              <Text className="mt-2 whitespace-pre-wrap">{data.notes}</Text>
            ) : null}
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-border px-4 py-3 text-sm">
            <div>
              <dt className="text-muted-foreground">
                {t('workout.totalDuration')}
              </dt>
              <dd className="text-base font-medium">
                {durationLabel(data.summary.durationS, t)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t('workout.totalVolume')}
              </dt>
              <dd className="text-base font-medium">
                {volumeLabel(data.summary.volumeKg, units, i18n.language, t)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t('workout.totalSets')}
              </dt>
              <dd className="text-base font-medium">{data.summary.setCount}</dd>
            </div>
          </dl>

          <div className="flex flex-col divide-y divide-border">
            {data.exercises.map((exercise) => {
              const numbers = workingNumbers(exercise.sets);
              return (
                <section key={exercise.id} className="flex flex-col gap-3 p-4">
                  <header className="flex items-center gap-3">
                    <ExerciseThumb
                      image={exercise.image}
                      seed={exercise.exerciseId}
                      size="sm"
                    />
                    <Link
                      to="/exercises/$exerciseId"
                      params={{ exerciseId: exercise.exerciseId }}
                      className="min-w-0 flex-1 truncate text-lg font-semibold text-primary outline-none focus-visible:underline"
                    >
                      {exercise.name}
                    </Link>
                  </header>
                  {exercise.notes ? (
                    <Text
                      size="sm"
                      tone="muted"
                      className="whitespace-pre-wrap"
                    >
                      {exercise.notes}
                    </Text>
                  ) : null}
                  <ol className="flex flex-col gap-1.5">
                    {exercise.sets.map((set, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 text-base"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold">
                          {setMark(set.kind, numbers[index] ?? 0, t)}
                        </span>
                        <span className="tabular-nums">
                          {setLabel(set, { units, language: i18n.language, t })}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        </>
      ) : null}

      <BottomSheet
        compact
        open={menu === 'actions'}
        onOpenChange={(open) => {
          setMenu(open ? 'actions' : null);
        }}
        title={t('workout.detailsMenu')}
      >
        <button
          type="button"
          onClick={() => {
            setMenu('delete');
          }}
          className="flex w-full items-center gap-3 py-3 text-left text-base text-destructive outline-none focus-visible:bg-accent"
        >
          <Trash2 className="size-5" aria-hidden />
          {t('workout.delete')}
        </button>
      </BottomSheet>

      <BottomSheet
        compact
        open={menu === 'delete'}
        onOpenChange={(open) => {
          setMenu(open ? 'delete' : null);
        }}
        title={t('workout.deleteTitle')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 flex-1 px-3 text-sm"
              onClick={() => {
                setMenu(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-w-0 flex-1 px-3 text-sm"
              loading={remove.isPending}
              onClick={removeWorkout}
            >
              {t('workout.delete')}
            </Button>
          </>
        }
      >
        <Text tone="muted">{t('workout.deleteHint')}</Text>
      </BottomSheet>
    </main>
  );
}

export { WorkoutDetailsPage };
