import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Units } from '@/entities/user/api/current-user.service';
import {
  acceptsInput,
  FIELD_KEYS,
  placeholderValue,
  type DraftExercise,
  type DraftSet,
  type SetValueKey,
} from '@/entities/training/model/draft';
import {
  columnLabelKey,
  columnTemplate,
} from '@/entities/training/model/columns';
import { setLabel, setMark } from '@/entities/training/model/display';
import { matchPrevious } from '@/entities/training/model/previous';
import { SetKindButton } from '@/entities/training/components/SetKindButton';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const INPUT_MODES: Readonly<
  Record<SetValueKey, 'decimal' | 'numeric' | 'text'>
> = {
  weight: 'decimal',
  reps: 'numeric',
  duration: 'numeric',
  distance: 'decimal',
};

function SetRow({
  exercise,
  units,
  set,
  number,
  index,
  onKind,
  onChange,
  onToggle,
  onUsePrevious,
}: {
  exercise: DraftExercise;
  units: Units;
  set: DraftSet;
  number: number;
  index: number;
  onKind: () => void;
  onChange: (key: SetValueKey, value: string) => void;
  onToggle: () => void;
  onUsePrevious: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lastTime =
    matchPrevious(exercise.sets, exercise.previous)[index] ?? null;
  const done = set.completedAt !== null;
  const mark = setMark(set.kind, number, t);

  return (
    <li
      className={cn(
        'grid items-center gap-2 rounded-lg py-1',
        done ? 'bg-emerald-500/15' : '',
      )}
      style={{ gridTemplateColumns: columnTemplate(exercise.fields) }}
    >
      <SetKindButton
        kind={set.kind}
        mark={mark}
        label={t('workout.setMenu', { number: index + 1 })}
        onClick={onKind}
      />
      <Button
        type="button"
        variant="bare"
        size="cell"
        disabled={lastTime === null || done}
        aria-label={t('workout.col.previousSet', { number: index + 1 })}
        onClick={onUsePrevious}
        className="min-w-0 truncate px-1 text-center text-xs text-muted-foreground enabled:active:bg-secondary"
      >
        {lastTime === null
          ? '—'
          : setLabel(lastTime, { units, language: i18n.language, t })}
      </Button>
      {exercise.fields.map((rule) => {
        const key = FIELD_KEYS[rule.id];
        return (
          <Input
            key={rule.id}
            variant="cell"
            value={set[key]}
            inputMode={INPUT_MODES[key]}
            autoComplete="off"
            enterKeyHint="next"
            aria-label={t(columnLabelKey(rule, units))}
            placeholder={placeholderValue(exercise, index, key, units)}
            onChange={(event) => {
              const next = event.target.value;
              if (acceptsInput(key, next)) {
                onChange(key, next);
              }
            }}
            className={cn(
              'placeholder:text-muted-foreground/60',
              done ? 'bg-transparent' : '',
            )}
          />
        );
      })}
      <Button
        type="button"
        variant={done ? 'success' : 'secondary'}
        size="cell"
        aria-pressed={done}
        aria-label={t(done ? 'workout.uncompleteSet' : 'workout.completeSet', {
          number: index + 1,
        })}
        className={done ? '' : 'text-muted-foreground'}
        onClick={onToggle}
      >
        <Check className="size-5" aria-hidden />
      </Button>
    </li>
  );
}

export { SetRow };
