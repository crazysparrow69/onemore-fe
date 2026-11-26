import { Link } from '@tanstack/react-router';
import { Ellipsis, FilePlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Units } from '@/features/auth/api/current-user.service';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseRow';
import { SetRow } from '@/features/workouts/components/SetRow';
import {
  columnLabelKey,
  columnTemplate,
} from '@/features/workouts/model/columns';
import { workingNumbers } from '@/features/workouts/model/display';
import type {
  DraftExercise,
  SetKind,
  SetValueKey,
} from '@/features/workouts/model/draft';
import { toast } from '@/shared/lib/toast';
import { IconButton } from '@/shared/ui/icon-button';
import { Textarea } from '@/shared/ui/textarea';

function ExerciseCard({
  exercise,
  units,
  onMenu,
  onNotes,
  onAddSet,
  onSetKind,
  onChangeSet,
  onToggleSet,
}: {
  exercise: DraftExercise;
  units: Units;
  onMenu: () => void;
  onNotes: (notes: string) => void;
  onAddSet: () => void;
  onSetKind: (setId: string, current: SetKind) => void;
  onChangeSet: (setId: string, key: SetValueKey, value: string) => void;
  onToggleSet: (setId: string) => boolean;
}) {
  const { t } = useTranslation();
  const [notesOpen, setNotesOpen] = useState(exercise.notes.length > 0);
  const numbers = workingNumbers(exercise.sets);

  return (
    <section className="flex flex-col gap-3 px-4 py-4">
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
        <IconButton
          aria-label={t('workout.exerciseMenu')}
          className="bg-transparent"
          onClick={onMenu}
        >
          <Ellipsis aria-hidden />
        </IconButton>
      </header>

      {notesOpen ? (
        <Textarea
          value={exercise.notes}
          placeholder={t('workout.notePlaceholder')}
          aria-label={t('workout.note')}
          maxLength={1000}
          className="min-h-16"
          onChange={(event) => {
            onNotes(event.target.value);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setNotesOpen(true);
          }}
          className="flex h-10 items-center gap-2 self-start rounded-lg bg-secondary px-3 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <FilePlus className="size-4" aria-hidden />
          {t('workout.note')}
        </button>
      )}

      <div
        className="grid gap-2 px-0 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: columnTemplate(exercise.fields) }}
        aria-hidden
      >
        <span className="text-center">{t('workout.col.set')}</span>
        {exercise.fields.map((rule) => (
          <span key={rule.id} className="text-center">
            {t(columnLabelKey(rule, units))}
          </span>
        ))}
        <span />
      </div>

      <ul className="flex flex-col gap-1">
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            exercise={exercise}
            units={units}
            set={set}
            number={numbers[index] ?? 0}
            index={index}
            onKind={() => {
              onSetKind(set.id, set.kind);
            }}
            onChange={(key, value) => {
              onChangeSet(set.id, key, value);
            }}
            onToggle={() => {
              if (!onToggleSet(set.id)) {
                toast.info(t('workout.fillSet'));
              }
            }}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={onAddSet}
        className="flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary text-base font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Plus className="size-4" aria-hidden />
        {t('workout.addSet')}
      </button>
    </section>
  );
}

export { ExerciseCard };
