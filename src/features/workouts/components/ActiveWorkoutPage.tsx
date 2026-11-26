import { Link, Navigate, useRouter } from '@tanstack/react-router';
import { ChevronDown, Dumbbell, Plus, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import { usePreviousSets } from '@/features/workouts/api/use-workouts';
import { RestPickerSheet } from '@/features/workouts/components/RestPickerSheet';
import { RestTimerPanel } from '@/features/workouts/components/RestTimerPanel';
import { ExerciseCard } from '@/features/workouts/components/ExerciseCard';
import { ExerciseMenuSheet } from '@/features/workouts/components/ExerciseMenuSheet';
import { SetKindSheet } from '@/features/workouts/components/SetKindSheet';
import { completedSetCount } from '@/features/workouts/model/draft';
import {
  useDraftStore,
  useWorkoutDraft,
} from '@/features/workouts/model/draft-store';
import { formatClock } from '@/features/workouts/model/format';
import { restLeftSeconds } from '@/features/workouts/model/rest';
import { useNow } from '@/features/workouts/model/use-now';
import { unlockRestAudio } from '@/shared/lib/rest-signal';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

function ActiveWorkoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useCurrentUser();
  const draft = useWorkoutDraft(user.data?.id);
  const store = useDraftStore();
  const now = useNow();
  const [kindSheet, setKindSheet] = useState<{
    exerciseId: string;
    setId: string;
    number: number;
    kind: string;
  } | null>(null);
  const [menuExercise, setMenuExercise] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [restExercise, setRestExercise] = useState<string | null>(null);
  const [manualRestOpen, setManualRestOpen] = useState(false);
  const missingPrevious = [
    ...new Set(
      (draft?.exercises ?? [])
        .filter((exercise) => exercise.previous === undefined)
        .map((exercise) => exercise.exerciseId),
    ),
  ].sort();
  const previousSets = usePreviousSets(missingPrevious);
  const loadedPrevious = previousSets.data;
  const applyPrevious = store.applyPrevious;

  useEffect(() => {
    if (loadedPrevious && missingPrevious.length > 0) {
      applyPrevious(missingPrevious, loadedPrevious.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedPrevious, applyPrevious]);

  if (user.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 pt-6" aria-hidden>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }
  if (!draft || !user.data) {
    return <Navigate to="/" replace />;
  }

  const units = user.data.units;
  const elapsed = (now - new Date(draft.startedAt).getTime()) / 1000;
  const menuTarget = draft.exercises.find((item) => item.id === menuExercise);
  const restTarget = draft.exercises.find((item) => item.id === restExercise);
  const rest = draft.rest ?? null;
  const menuIndex = draft.exercises.findIndex(
    (item) => item.id === menuExercise,
  );

  function collapse() {
    void router.navigate({ to: '/' });
  }

  return (
    <main className="flex flex-1 flex-col pb-10">
      <header className="sticky top-0 z-10 flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <IconButton aria-label={t('workout.collapse')} onClick={collapse}>
            <ChevronDown aria-hidden />
          </IconButton>
          <Text
            as="h1"
            size="lg"
            weight="semibold"
            className="min-w-0 flex-1 truncate"
          >
            {t('workout.title')}
          </Text>
          <IconButton
            aria-label={t('workout.rest.timer')}
            className={rest ? 'w-auto gap-1.5 px-3 text-primary' : ''}
            onClick={() => {
              setManualRestOpen(true);
            }}
          >
            <Timer aria-hidden />
            {rest ? (
              <span className="text-sm font-medium tabular-nums">
                {formatClock(restLeftSeconds(rest, now))}
              </span>
            ) : null}
          </IconButton>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/workout/finish">{t('workout.finish')}</Link>
          </Button>
        </div>
        <dl className="grid grid-cols-2 border-b border-border px-4 pb-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('workout.time')}</dt>
            <dd className="text-lg font-medium text-primary tabular-nums">
              {formatClock(elapsed)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('workout.sets')}</dt>
            <dd className="text-lg font-medium tabular-nums">
              {completedSetCount(draft)}
            </dd>
          </div>
        </dl>
      </header>

      {draft.exercises.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 pt-16 pb-8 text-center">
          <Dumbbell className="size-14 text-muted-foreground" aria-hidden />
          <Text as="h2" size="lg" weight="semibold" className="mt-3">
            {t('workout.emptyTitle')}
          </Text>
          <Text tone="muted">{t('workout.emptyHint')}</Text>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {draft.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              units={units}
              onMenu={() => {
                setMenuExercise(exercise.id);
              }}
              onNotes={(notes) => {
                store.setExerciseNotes(exercise.id, notes);
              }}
              onRest={() => {
                setRestExercise(exercise.id);
              }}
              onAddSet={() => {
                store.addSet(exercise.id);
              }}
              onSetKind={(setId, kind) => {
                const index = exercise.sets.findIndex((s) => s.id === setId);
                setKindSheet({
                  exerciseId: exercise.id,
                  setId,
                  number: index + 1,
                  kind,
                });
              }}
              onChangeSet={(setId, key, value) => {
                store.changeSet(exercise.id, setId, { [key]: value });
              }}
              onToggleSet={(setId) => {
                unlockRestAudio();
                return store.toggleSet(exercise.id, setId, units);
              }}
              onUsePrevious={(setId) => {
                store.copyPreviousToSet(exercise.id, setId, units);
              }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 px-4 pt-4">
        <Button asChild size="lg" fullWidth leftIcon={<Plus aria-hidden />}>
          <Link to="/workout/add">{t('workout.addExercise')}</Link>
        </Button>
        <Button
          type="button"
          variant="destructive"
          fullWidth
          onClick={() => {
            setConfirmingCancel(true);
          }}
        >
          {t('workout.cancel')}
        </Button>
      </div>

      {rest ? (
        <RestTimerPanel
          rest={rest}
          onAdjust={store.adjustRest}
          onSkip={store.skipRest}
        />
      ) : null}

      <RestPickerSheet
        open={restTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setRestExercise(null);
          }
        }}
        title={t('workout.rest.exerciseTitle', {
          name: restTarget?.name ?? '',
        })}
        current={restTarget?.restSeconds ?? null}
        allowOff
        onPick={(seconds) => {
          if (restExercise) {
            store.setRestSeconds(restExercise, seconds);
          }
          setRestExercise(null);
        }}
      />

      <RestPickerSheet
        open={manualRestOpen}
        onOpenChange={setManualRestOpen}
        title={t('workout.rest.timer')}
        current={null}
        allowOff={false}
        onPick={(seconds) => {
          if (seconds !== null) {
            unlockRestAudio();
            store.startRest(seconds);
          }
          setManualRestOpen(false);
        }}
      />

      <SetKindSheet
        open={kindSheet !== null}
        onOpenChange={(open) => {
          if (!open) {
            setKindSheet(null);
          }
        }}
        number={kindSheet?.number ?? 1}
        current={
          kindSheet?.kind === 'warmup' ||
          kindSheet?.kind === 'drop' ||
          kindSheet?.kind === 'failure'
            ? kindSheet.kind
            : 'working'
        }
        onKind={(kind) => {
          if (kindSheet) {
            store.changeSet(kindSheet.exerciseId, kindSheet.setId, { kind });
          }
          setKindSheet(null);
        }}
        onRemove={() => {
          if (kindSheet) {
            store.removeSet(kindSheet.exerciseId, kindSheet.setId);
          }
          setKindSheet(null);
        }}
      />

      <ExerciseMenuSheet
        open={menuTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setMenuExercise(null);
          }
        }}
        title={menuTarget?.name ?? ''}
        canMoveUp={menuIndex > 0}
        canMoveDown={menuIndex >= 0 && menuIndex < draft.exercises.length - 1}
        onMove={(direction) => {
          if (menuExercise) {
            store.moveExercise(menuExercise, direction);
          }
          setMenuExercise(null);
        }}
        onRemove={() => {
          if (menuExercise) {
            store.removeExercise(menuExercise);
          }
          setMenuExercise(null);
        }}
      />

      <BottomSheet
        compact
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={t('workout.cancelTitle')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 flex-1 px-3 text-sm"
              onClick={() => {
                setConfirmingCancel(false);
              }}
            >
              {t('workout.keepGoing')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-w-0 flex-1 px-3 text-sm"
              onClick={() => {
                setConfirmingCancel(false);
                collapse();
                store.discard();
              }}
            >
              {t('workout.cancelConfirm')}
            </Button>
          </>
        }
      >
        <Text tone="muted">{t('workout.cancelHint')}</Text>
      </BottomSheet>
    </main>
  );
}

export { ActiveWorkoutPage };
