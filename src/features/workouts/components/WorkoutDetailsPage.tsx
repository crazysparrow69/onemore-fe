import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Ellipsis, FilePlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import { ExerciseThumb } from '@/entities/exercise/components/ExerciseRow';
import { useEditorLaunch } from '@/features/templates/model/use-launch';
import {
  useDeleteWorkout,
  useWorkout,
} from '@/entities/training/api/use-workouts';
import {
  dateLabel,
  durationLabel,
  setLabel,
  setMark,
  timeLabel,
  volumeLabel,
  workingNumbers,
} from '@/entities/training/model/display';
import { hasErrorCode } from '@/shared/api/error';
import { toast } from '@/shared/lib/toast';
import { ActionItem, ActionList } from '@/shared/ui/action-list';
import { Badge } from '@/shared/ui/badge';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { ConfirmSheet } from '@/shared/ui/confirm-sheet';
import { ErrorState, NotFoundState } from '@/shared/ui/error-state';
import { IconButton } from '@/shared/ui/icon-button';
import { Stat } from '@/shared/ui/stat';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';
import { useSheet } from '@/shared/lib/use-sheet';

const route = getRouteApi('/workouts/$workoutId');

function WorkoutDetailsPage() {
  const { t, i18n } = useTranslation();
  const { workoutId } = route.useParams();
  const router = useRouter();
  const user = useCurrentUser();
  const workout = useWorkout(workoutId);
  const menu = useSheet<'actions' | 'delete'>();
  const remove = useDeleteWorkout(workoutId);
  const launch = useEditorLaunch();
  const units = user.data?.units ?? 'kg';
  const data = workout.data;
  const notFound = hasErrorCode(workout.error, 'WORKOUT_NOT_FOUND');

  function removeWorkout() {
    remove.mutate(undefined, {
      onSuccess: () => {
        menu.close();
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
              menu.show('actions');
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
        notFound ? (
          <NotFoundState className="px-4 py-4" message={t('workout.notFound')}>
            <Link to="/profile">{t('workout.toHistory')}</Link>
          </NotFoundState>
        ) : (
          <ErrorState
            className="px-4 py-4"
            onRetry={() => {
              void workout.refetch();
            }}
          />
        )
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

          <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-border px-4 py-3">
            <Stat label={t('workout.totalDuration')} valueSize="md">
              {durationLabel(data.summary.durationS, t)}
            </Stat>
            <Stat label={t('workout.totalVolume')} valueSize="md">
              {volumeLabel(data.summary.volumeKg, units, i18n.language, t)}
            </Stat>
            <Stat label={t('workout.totalSets')} valueSize="md">
              {data.summary.setCount}
            </Stat>
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
                        <Badge shape="square">
                          {setMark(set.kind, numbers[index] ?? 0, t)}
                        </Badge>
                        <Text as="span" numeric>
                          {setLabel(set, { units, language: i18n.language, t })}
                        </Text>
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
        {...menu.bind('actions')}
        title={t('workout.detailsMenu')}
      >
        <ActionList>
          <ActionItem
            icon={FilePlus}
            disabled={!launch.ready || !data}
            onClick={() => {
              if (data) {
                menu.close();
                launch.programFromWorkout(data);
              }
            }}
          >
            {t('templates.saveFromWorkout')}
          </ActionItem>
          <ActionItem
            icon={Trash2}
            destructive
            onClick={() => {
              menu.show('delete');
            }}
          >
            {t('workout.delete')}
          </ActionItem>
        </ActionList>
      </BottomSheet>

      <ConfirmSheet
        {...menu.bind('delete')}
        title={t('workout.deleteTitle')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('workout.delete')}
        onConfirm={removeWorkout}
        pending={remove.isPending}
      >
        <Text tone="muted">{t('workout.deleteHint')}</Text>
      </ConfirmSheet>
    </main>
  );
}

export { WorkoutDetailsPage };
