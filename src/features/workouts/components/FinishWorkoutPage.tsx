import { Navigate, useRouter } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CurrentUser } from '@/entities/user/api/current-user.service';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import {
  useSaveTemplate,
  useTemplates,
} from '@/features/templates/api/use-templates';
import { UpdateProgramToggle } from '@/features/templates/components/UpdateProgramToggle';
import { computeTemplateUpdate } from '@/features/templates/model/update-from-workout';
import { useSaveWorkout } from '@/entities/training/api/use-workouts';
import {
  completedSetCount,
  toWorkoutPayload,
  unfinishedSetCount,
  type Draft,
} from '@/entities/training/model/draft';
import {
  useDraftStore,
  useWorkoutDraft,
} from '@/entities/training/model/draft-store';
import {
  fromLocalInput,
  parseInteger,
  toLocalInput,
} from '@/entities/training/model/format';
import { apiErrorKey } from '@/shared/api/error';
import { toast } from '@/shared/lib/toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { Textarea } from '@/shared/ui/textarea';

const ERROR_KEYS = {
  WORKOUT_EMPTY: 'workout.errors.empty',
  WORKOUT_TIME_INVALID: 'workout.errors.time',
  SET_VALUES_INVALID: 'workout.errors.values',
  VALIDATION_FAILED: 'workout.errors.values',
  EXERCISE_CHANGED: 'workout.errors.exerciseChanged',
  NETWORK_ERROR: 'workout.errors.network',
} as const;

const errorKey = (error: unknown) =>
  apiErrorKey(error, ERROR_KEYS, 'workout.errors.generic');

function FinishForm({ draft, user }: { draft: Draft; user: CurrentUser }) {
  const { t } = useTranslation();
  const router = useRouter();
  const setMeta = useDraftStore((state) => state.setMeta);
  const discard = useDraftStore((state) => state.discard);
  const save = useSaveWorkout();
  const saveTemplate = useSaveTemplate();
  const templates = useTemplates();
  const [updateProgram, setUpdateProgram] = useState(false);
  const [openedAt] = useState(() => new Date());
  const [startedAt, setStartedAt] = useState(() =>
    toLocalInput(draft.startedAt),
  );
  const [minutes, setMinutes] = useState(() =>
    String(
      Math.max(
        1,
        Math.round(
          (openedAt.getTime() - new Date(draft.startedAt).getTime()) / 60_000,
        ),
      ),
    ),
  );

  const units = user.units;
  const completed = completedSetCount(draft);
  const unfinished = unfinishedSetCount(draft);
  const start = fromLocalInput(startedAt);
  const length = parseInteger(minutes);
  const valid = start !== null && length !== null && length > 0;
  const proposal = useMemo(
    () => computeTemplateUpdate(draft, units),
    [draft, units],
  );
  const programId = draft.template?.id;
  const programExists =
    programId !== undefined &&
    templates.data?.items.some((item) => item.id === programId) === true;
  const offeredUpdate = programExists ? proposal : null;

  function submit() {
    if (start === null || length === null) {
      return;
    }
    const prepared = { ...draft, startedAt: start };
    const endedAt = new Date(new Date(start).getTime() + length * 60_000);
    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || user.timeZone;
    save.mutate(
      {
        id: prepared.id,
        payload: toWorkoutPayload(prepared, {
          units,
          timeZone,
          endedAt,
        }),
      },
      {
        onSuccess: (workout) => {
          const finish = (updated: boolean | null): void => {
            void router
              .navigate({
                to: '/workouts/$workoutId',
                params: { workoutId: workout.id },
                replace: true,
              })
              .then(() => {
                discard();
                toast.success(t('workout.saved'));
                if (updated === true) {
                  toast.success(t('templates.update.done'));
                } else if (updated === false) {
                  toast.error(t('templates.update.failed'));
                }
              });
          };
          if (updateProgram && offeredUpdate && programId) {
            saveTemplate.mutate(
              { id: programId, payload: offeredUpdate.payload },
              {
                onSuccess: () => {
                  finish(true);
                },
                onError: () => {
                  finish(false);
                },
              },
            );
          } else {
            finish(null);
          }
        },
        onError: (error) => {
          toast.error(t(errorKey(error)));
        },
      },
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center bg-background px-4 pt-4 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-start px-2"
          onClick={() => {
            void router.navigate({ to: '/workout', replace: true });
          }}
        >
          {t('common.back')}
        </Button>
        <Text as="h1" size="lg" weight="semibold" className="text-center">
          {t('workout.finishTitle')}
        </Text>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-end px-2 text-primary"
          disabled={completed === 0 || !valid}
          loading={save.isPending || saveTemplate.isPending}
          onClick={submit}
        >
          {t('workout.save')}
        </Button>
      </header>

      <form
        className="flex flex-1 flex-col gap-4 px-4 pb-10"
        onSubmit={(event) => {
          event.preventDefault();
          if (completed > 0 && valid) {
            submit();
          }
        }}
      >
        <TextField
          label={t('workout.name')}
          variant="outline"
          value={draft.name}
          maxLength={80}
          autoComplete="off"
          placeholder={t('workout.namePlaceholder')}
          onChange={(event) => {
            setMeta({ name: event.target.value });
          }}
        />
        <div className="flex flex-col gap-2">
          <Text as="label" htmlFor="workout-notes" size="sm" tone="muted">
            {t('workout.notesLabel')}
          </Text>
          <Textarea
            id="workout-notes"
            value={draft.notes}
            maxLength={1000}
            placeholder={t('workout.notesPlaceholder')}
            onChange={(event) => {
              setMeta({ notes: event.target.value });
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <Text as="label" htmlFor="workout-start" size="sm" tone="muted">
              {t('workout.startedAt')}
            </Text>
            <Input
              id="workout-start"
              type="datetime-local"
              variant="outline"
              value={startedAt}
              aria-invalid={start === null ? true : undefined}
              onChange={(event) => {
                setStartedAt(event.target.value);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text as="label" htmlFor="workout-minutes" size="sm" tone="muted">
              {t('workout.duration')}
            </Text>
            <Input
              id="workout-minutes"
              inputMode="numeric"
              variant="outline"
              value={minutes}
              aria-invalid={length === null || length === 0 ? true : undefined}
              onChange={(event) => {
                if (/^\d{0,4}$/.test(event.target.value)) {
                  setMinutes(event.target.value);
                }
              }}
            />
          </div>
        </div>
        {offeredUpdate && draft.template ? (
          <UpdateProgramToggle
            name={draft.template.name}
            changes={offeredUpdate.changes}
            checked={updateProgram}
            onChange={setUpdateProgram}
          />
        ) : null}
        {unfinished > 0 ? (
          <Text size="sm" tone="muted">
            {t('workout.unfinished', { count: unfinished })}
          </Text>
        ) : null}
        {completed === 0 ? (
          <Text size="sm" tone="danger">
            {t('workout.errors.empty')}
          </Text>
        ) : null}
      </form>
    </main>
  );
}

function FinishWorkoutPage() {
  const user = useCurrentUser();
  const draft = useWorkoutDraft(user.data?.id);

  if (user.isPending) {
    return <main className="flex flex-1" aria-hidden />;
  }
  if (!draft || !user.data) {
    return <Navigate to="/" replace />;
  }
  return <FinishForm draft={draft} user={user.data} />;
}

export { FinishWorkoutPage };
