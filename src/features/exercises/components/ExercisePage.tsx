import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/error';
import {
  useExercise,
  useExerciseLabels,
} from '@/features/exercises/api/use-exercises';
import { useDeleteExercise } from '@/features/exercises/api/use-exercise-mutations';
import { ExercisePhotos } from '@/features/exercises/components/ExercisePhotos';
import { ExercisePlaceholder } from '@/features/exercises/components/ExercisePlaceholder';
import { toast } from '@/shared/lib/toast';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

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
  const [menu, setMenu] = useState<'actions' | 'delete' | null>(null);
  const remove = useDeleteExercise(exerciseId, async () => {
    setMenu(null);
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
  const notFound =
    exercise.error instanceof ApiError &&
    exercise.error.code === 'EXERCISE_NOT_FOUND';

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
              setMenu('actions');
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
        <div className="flex flex-col items-start gap-3 px-4 py-4">
          <Text tone={notFound ? 'muted' : 'danger'}>
            {notFound ? t('catalog.notFound') : t('errors.generic.description')}
          </Text>
          {notFound ? (
            <Button asChild variant="secondary">
              <Link to="/exercises">{t('catalog.toList')}</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void exercise.refetch();
              }}
            >
              {t('common.retry')}
            </Button>
          )}
        </div>
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

      <BottomSheet
        compact
        open={menu === 'actions'}
        onOpenChange={(open) => {
          setMenu(open ? 'actions' : null);
        }}
        title={data?.name ?? ''}
      >
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
              setMenu('delete');
            }}
          >
            {t('catalog.delete')}
          </Button>
        </div>
      </BottomSheet>
      <BottomSheet
        compact
        open={menu === 'delete'}
        onOpenChange={(open) => {
          setMenu(open ? 'delete' : null);
        }}
        title={t('catalog.deleteTitle')}
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
              onClick={removeExercise}
            >
              {t('catalog.delete')}
            </Button>
          </>
        }
      >
        <Text tone="muted">{t('catalog.deleteHint')}</Text>
      </BottomSheet>
    </main>
  );
}

export { ExercisePage };
