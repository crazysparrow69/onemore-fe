import { Link } from '@tanstack/react-router';
import { Ellipsis, FilePlus, Plus, Timer } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Units } from '@/entities/user/api/current-user.service';
import { ExerciseThumb } from '@/entities/exercise/components/ExerciseRow';
import { TemplateSetRow } from '@/features/templates/components/TemplateSetRow';
import type { EditorExercise } from '@/features/templates/model/editor';
import { setGridTemplate } from '@/features/templates/model/grid';
import { columnLabelKey } from '@/entities/training/model/columns';
import { workingNumbers } from '@/entities/training/model/display';
import type { SetKind, SetValueKey } from '@/entities/training/model/draft';
import { formatClock } from '@/entities/training/model/format';
import { IconButton } from '@/shared/ui/icon-button';
import { Textarea } from '@/shared/ui/textarea';

function TemplateExerciseCard({
  exercise,
  units,
  onMenu,
  onNotes,
  onRest,
  onAddSet,
  onSetKind,
  onChangeSet,
}: {
  exercise: EditorExercise;
  units: Units;
  onMenu: () => void;
  onNotes: (notes: string) => void;
  onRest: () => void;
  onAddSet: () => void;
  onSetKind: (setId: string, current: SetKind) => void;
  onChangeSet: (setId: string, key: SetValueKey, value: string) => void;
}) {
  const { t } = useTranslation();
  const [notesOpen, setNotesOpen] = useState(exercise.notes.length > 0);
  const numbers = workingNumbers(exercise.sets);
  const buttonClass =
    'flex h-10 items-center gap-2 rounded-lg bg-secondary px-3 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

  return (
    <section className="flex flex-col gap-3 px-4 py-4">
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
            <span className="text-xs text-muted-foreground">
              {t('templates.archivedExercise')}
            </span>
          ) : null}
        </div>
        <IconButton
          aria-label={t('workout.exerciseMenu')}
          className="bg-transparent"
          onClick={onMenu}
        >
          <Ellipsis aria-hidden />
        </IconButton>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onRest} className={buttonClass}>
          <Timer className="size-4" aria-hidden />
          {t('workout.rest.button', {
            value:
              exercise.restSeconds && exercise.restSeconds > 0
                ? formatClock(exercise.restSeconds)
                : t('workout.rest.offShort'),
          })}
        </button>
        {notesOpen ? null : (
          <button
            type="button"
            onClick={() => {
              setNotesOpen(true);
            }}
            className={buttonClass}
          >
            <FilePlus className="size-4" aria-hidden />
            {t('workout.note')}
          </button>
        )}
      </div>

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
      ) : null}

      <div
        className="grid gap-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: setGridTemplate(exercise.fields.length) }}
        aria-hidden
      >
        <span className="text-center">{t('workout.col.set')}</span>
        {exercise.fields.map((rule) => (
          <span key={rule.id} className="text-center">
            {t(columnLabelKey(rule, units))}
          </span>
        ))}
      </div>

      <ul className="flex flex-col gap-1">
        {exercise.sets.map((set, index) => (
          <TemplateSetRow
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

export { TemplateExerciseCard };
