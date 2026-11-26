import { Link, Navigate, useRouter } from '@tanstack/react-router';
import { ChevronDown, Dumbbell, Plus, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import { usePreviousSets } from '@/entities/training/api/use-workouts';
import { RestPickerSheet } from '@/entities/training/components/RestPickerSheet';
import { RestTimerPanel } from '@/features/workouts/components/RestTimerPanel';
import { ExerciseCard } from '@/features/workouts/components/ExerciseCard';
import { ExerciseMenuSheet } from '@/entities/training/components/ExerciseMenuSheet';
import { SetKindSheet } from '@/entities/training/components/SetKindSheet';
import { completedSetCount } from '@/entities/training/model/draft';
import {
  useDraftStore,
  useWorkoutDraft,
} from '@/entities/training/model/draft-store';
import { formatClock } from '@/entities/training/model/format';
import { restLeftSeconds } from '@/entities/training/model/rest';
import { useNow } from '@/entities/training/model/use-now';
import { unlockRestAudio } from '@/shared/lib/rest-signal';
import { ConfirmSheet } from '@/shared/ui/confirm-sheet';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Stat } from '@/shared/ui/stat';
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
              <Text as="span" size="sm" weight="medium" numeric>
                {formatClock(restLeftSeconds(rest, now))}
              </Text>
            ) : null}
          </IconButton>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/workout/finish">{t('workout.finish')}</Link>
          </Button>
        </div>
        <dl className="grid grid-cols-2 border-b border-border px-4 pb-3">
          <Stat
            label={t('workout.time')}
            valueSize="lg"
            valueTone="accent"
            numeric
          >
            {formatClock(elapsed)}
          </Stat>
          <Stat label={t('workout.sets')} valueSize="lg" numeric>
            {completedSetCount(draft)}
          </Stat>
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

      <ConfirmSheet
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={t('workout.cancelTitle')}
        cancelLabel={t('workout.keepGoing')}
        confirmLabel={t('workout.cancelConfirm')}
        onConfirm={() => {
          setConfirmingCancel(false);
          collapse();
          store.discard();
        }}
      >
        <Text tone="muted">{t('workout.cancelHint')}</Text>
      </ConfirmSheet>
    </main>
  );
}

export { ActiveWorkoutPage };
