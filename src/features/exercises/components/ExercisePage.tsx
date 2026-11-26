import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hasErrorCode } from '@/shared/api/error';
import {
  useExercise,
  useExerciseLabels,
} from '@/entities/exercise/api/use-exercises';
import { useDeleteExercise } from '@/entities/exercise/api/use-exercise-mutations';
import { ExercisePhotos } from '@/entities/exercise/components/ExercisePhotos';
import { ExercisePlaceholder } from '@/entities/exercise/components/ExercisePlaceholder';
import { toast } from '@/shared/lib/toast';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { ErrorState, NotFoundState } from '@/shared/ui/error-state';
import { ConfirmSheet } from '@/shared/ui/confirm-sheet';
import { IconButton } from '@/shared/ui/icon-button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';
import { useSheet } from '@/shared/lib/use-sheet';

const route = getRouteApi('/exercises/$exerciseId');

function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-secondary px-3 py-1 text-sm">
      {children}
    </span>
  );
}

function ExercisePage() {
  const { t } = useTranslation();
  const { exerciseId } = route.useParams();
  const router = useRouter();
  const exercise = useExercise(exerciseId);
  const labels = useExerciseLabels();
  const menu = useSheet<'actions' | 'delete'>();
  const remove = useDeleteExercise(exerciseId, async () => {
    menu.close();
    toast.success(t('catalog.deleted'));
    await router.navigate({ to: '/exercises', replace: true });
  });

  function removeExercise() {
    remove.mutate(undefined, {
      onError: () => {
        toast.error(t('errors.generic.description'));
      },
    });
  }

  function goBack() {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      void router.navigate({ to: '/exercises' });
    }
  }

  const data = exercise.data;
  const notFound = hasErrorCode(exercise.error, 'EXERCISE_NOT_FOUND');

  const secondary = data
    ? data.secondaryMuscles.map((id) => labels.muscle(id)).join(', ')
    : '';
  const chips = data
    ? [
        labels.equipment(data.equipment),
        data.level ? labels.level(data.level) : null,
        data.category ? labels.category(data.category) : null,
        data.mechanic ? labels.mechanic(data.mechanic) : null,
        data.force ? labels.force(data.force) : null,
      ].filter((chip): chip is string => chip !== null)
    : [];

  return (
    <main className="flex flex-1 flex-col pb-8">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <IconButton aria-label={t('common.back')} onClick={goBack}>
          <ArrowLeft aria-hidden />
        </IconButton>
        {data?.custom && !exercise.isPlaceholderData ? (
          <IconButton
            aria-label={t('catalog.menu')}
            onClick={() => {
              menu.show('actions');
            }}
          >
            <Ellipsis aria-hidden />
          </IconButton>
        ) : null}
      </header>

      {exercise.isPending ? (
        <div className="flex flex-col gap-4 px-4">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      ) : null}

      {exercise.isError && !data ? (
        notFound ? (
          <NotFoundState className="px-4 py-4" message={t('catalog.notFound')}>
            <Link to="/exercises">{t('catalog.toList')}</Link>
          </NotFoundState>
        ) : (
          <ErrorState
            className="px-4 py-4"
            onRetry={() => {
              void exercise.refetch();
            }}
          />
        )
      ) : null}

      {data ? (
        <>
          {data.imageKeys.length > 0 ? (
            <ExercisePhotos
              key={data.id}
              keys={data.imageKeys}
              label={t('catalog.togglePhotos')}
            />
          ) : (
            <ExercisePlaceholder
              seed={data.id}
              className="aspect-[4/3] w-full"
              iconClassName="size-16"
            />
          )}
          <div className="flex flex-col gap-4 px-4 pt-4">
            <div className="flex flex-col gap-1">
              <Text as="h1" size="2xl" weight="semibold">
                {data.name}
              </Text>
              <Text tone="muted" size="sm">
                {t('catalog.primary', {
                  muscles: data.primaryMuscles
                    .map((id) => labels.muscle(id))
                    .join(', '),
                })}
              </Text>
              {secondary.length > 0 ? (
                <Text tone="muted" size="sm">
                  {t('catalog.secondary', { muscles: secondary })}
                </Text>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Chip key={chip}>{chip}</Chip>
              ))}
            </div>
            {exercise.isPlaceholderData ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : null}
            {data.instructions.length > 0 ? (
              <section className="flex flex-col gap-3">
                <Text as="h3" size="lg" weight="semibold">
                  {t('catalog.instructions')}
                </Text>
                <ol className="flex flex-col gap-3">
                  {data.instructions.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-base leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
        </>
      ) : null}

      <BottomSheet compact {...menu.bind('actions')} title={data?.name ?? ''}>
        <div className="flex flex-col gap-2">
          <Button asChild variant="secondary" size="lg" fullWidth>
            <Link to="/exercises/$exerciseId/edit" params={{ exerciseId }}>
              {t('catalog.edit')}
            </Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            fullWidth
            onClick={() => {
              menu.show('delete');
            }}
          >
            {t('catalog.delete')}
          </Button>
        </div>
      </BottomSheet>
      <ConfirmSheet
        {...menu.bind('delete')}
        title={t('catalog.deleteTitle')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('catalog.delete')}
        onConfirm={removeExercise}
        pending={remove.isPending}
      >
        <Text tone="muted">{t('catalog.deleteHint')}</Text>
      </ConfirmSheet>
    </main>
  );
}

export { ExercisePage };
