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
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Text } from '@/shared/ui/text';
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
            <Text as="span" size="xs" tone="muted">
              {t('templates.archivedExercise')}
            </Text>
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
        <Button
          type="button"
          variant="secondary"
          size="control"
          leftIcon={<Timer aria-hidden />}
          onClick={onRest}
        >
          {t('workout.rest.button', {
            value:
              exercise.restSeconds && exercise.restSeconds > 0
                ? formatClock(exercise.restSeconds)
                : t('workout.rest.offShort'),
          })}
        </Button>
        {notesOpen ? null : (
          <Button
            type="button"
            variant="secondary"
            size="control"
            leftIcon={<FilePlus aria-hidden />}
            onClick={() => {
              setNotesOpen(true);
            }}
          >
            {t('workout.note')}
          </Button>
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

      <Button
        type="button"
        variant="secondary"
        fullWidth
        leftIcon={<Plus aria-hidden />}
        onClick={onAddSet}
      >
        {t('workout.addSet')}
      </Button>
    </section>
  );
}

export { TemplateExerciseCard };
