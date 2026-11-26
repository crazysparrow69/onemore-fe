import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Ellipsis } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import { ExerciseThumb } from '@/entities/exercise/components/ExerciseRow';
import { useTemplate } from '@/features/templates/api/use-templates';
import { StartDraftSheet } from '@/features/templates/components/StartDraftSheet';
import { useStartProgram } from '@/features/templates/model/use-start-program';
import { TemplateMenu } from '@/features/templates/components/TemplateMenu';
import { lastPerformedLabel } from '@/features/templates/model/summary';
import {
  setLabel,
  setMark,
  workingNumbers,
} from '@/entities/training/model/display';
import { formatClock } from '@/entities/training/model/format';
import { hasErrorCode } from '@/shared/api/error';
import { Button } from '@/shared/ui/button';
import { ErrorState, NotFoundState } from '@/shared/ui/error-state';
import { IconButton } from '@/shared/ui/icon-button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

const route = getRouteApi('/programs/$programId');

function TemplatePage() {
  const { t, i18n } = useTranslation();
  const { programId } = route.useParams();
  const router = useRouter();
  const user = useCurrentUser();
  const template = useTemplate(programId);
  const start = useStartProgram();
  const [menuOpen, setMenuOpen] = useState(false);
  const units = user.data?.units ?? 'kg';
  const data = template.data;
  const notFound = hasErrorCode(template.error, 'TEMPLATE_NOT_FOUND');

  function goBack() {
    void router.navigate({ to: '/training', replace: true });
  }

  const last = data
    ? lastPerformedLabel(data, new Date(), i18n.language, t)
    : null;

  return (
    <main className="flex flex-1 flex-col pb-8">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <IconButton aria-label={t('common.back')} onClick={goBack}>
          <ArrowLeft aria-hidden />
        </IconButton>
        {data ? (
          <IconButton
            aria-label={t('templates.menu', { name: data.name })}
            onClick={() => {
              setMenuOpen(true);
            }}
          >
            <Ellipsis aria-hidden />
          </IconButton>
        ) : null}
      </header>

      {template.isPending ? (
        <div className="flex flex-col gap-4 px-4" aria-hidden>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {template.isError ? (
        notFound ? (
          <NotFoundState
            className="px-4 py-4"
            message={t('templates.notFound')}
          >
            <Link to="/training">{t('templates.toTraining')}</Link>
          </NotFoundState>
        ) : (
          <ErrorState
            className="px-4 py-4"
            onRetry={() => {
              void template.refetch();
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
              {last ?? t('templates.neverPerformed')}
            </Text>
            {data.notes ? (
              <Text className="mt-2 whitespace-pre-wrap">{data.notes}</Text>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col divide-y divide-border border-t border-border">
            {data.exercises.map((exercise, position) => {
              const numbers = workingNumbers(exercise.sets);
              return (
                <section
                  key={`${exercise.exerciseId}-${String(position)}`}
                  className="flex flex-col gap-3 p-4"
                >
                  <header className="flex items-center gap-3">
                    <ExerciseThumb
                      image={exercise.image}
                      seed={exercise.exerciseId}
                      size="sm"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        to="/exercises/$exerciseId"
                        params={{ exerciseId: exercise.exerciseId }}
                        className="truncate text-lg font-semibold text-primary outline-none focus-visible:underline"
                      >
                        {exercise.name}
                      </Link>
                      {exercise.archived ? (
                        <Text size="sm" tone="muted">
                          {t('templates.archivedExercise')}
                        </Text>
                      ) : null}
                    </div>
                  </header>
                  {exercise.restSeconds !== null ? (
                    <Text size="sm" tone="muted">
                      {t('workout.rest.button', {
                        value: formatClock(exercise.restSeconds),
                      })}
                    </Text>
                  ) : null}
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
                          {setLabel(set, {
                            units,
                            language: i18n.language,
                            t,
                          }) || t('templates.noValues')}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>

          <div className="sticky bottom-0 mt-4 bg-background px-4 pt-3 pb-4">
            <Button
              type="button"
              size="lg"
              fullWidth
              disabled={!start.ready}
              onClick={() => {
                start.begin(data);
              }}
            >
              {t('templates.start')}
            </Button>
          </div>
        </>
      ) : null}

      <TemplateMenu
        template={menuOpen ? (data ?? null) : null}
        onClose={() => {
          setMenuOpen(false);
        }}
        onDeleted={goBack}
      />
      <StartDraftSheet {...start.sheet} />
    </main>
  );
}

export { TemplatePage };
