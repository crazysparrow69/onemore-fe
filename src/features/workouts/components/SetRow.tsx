import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Units } from '@/features/auth/api/current-user.service';
import {
  acceptsInput,
  FIELD_KEYS,
  suggestedValue,
  type DraftExercise,
  type DraftSet,
  type SetValueKey,
} from '@/features/workouts/model/draft';
import {
  columnLabelKey,
  columnTemplate,
} from '@/features/workouts/model/columns';
import { setMark } from '@/features/workouts/model/display';
import { cn } from '@/shared/lib/utils';

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
}: {
  exercise: DraftExercise;
  units: Units;
  set: DraftSet;
  number: number;
  index: number;
  onKind: () => void;
  onChange: (key: SetValueKey, value: string) => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const previous = exercise.sets[index - 1] ?? null;
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
      <button
        type="button"
        aria-label={t('workout.setMenu', { number: index + 1 })}
        onClick={onKind}
        className={cn(
          'flex h-10 items-center justify-center rounded-lg bg-secondary text-base font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          set.kind === 'warmup' ? 'text-amber-400' : '',
          set.kind === 'drop' ? 'text-violet-400' : '',
          set.kind === 'failure' ? 'text-destructive' : '',
        )}
      >
        {mark}
      </button>
      {exercise.fields.map((rule) => {
        const key = FIELD_KEYS[rule.id];
        return (
          <input
            key={rule.id}
            value={set[key]}
            inputMode={INPUT_MODES[key]}
            autoComplete="off"
            enterKeyHint="next"
            aria-label={t(columnLabelKey(rule, units))}
            placeholder={suggestedValue(previous, key)}
            onChange={(event) => {
              const next = event.target.value;
              if (acceptsInput(key, next)) {
                onChange(key, next);
              }
            }}
            className={cn(
              'h-10 min-w-0 rounded-lg px-1 text-center text-base outline-none placeholder:text-muted-foreground/60 focus-visible:ring-[3px] focus-visible:ring-ring/50',
              done ? 'bg-transparent' : 'bg-secondary',
            )}
          />
        );
      })}
      <button
        type="button"
        aria-pressed={done}
        aria-label={t(done ? 'workout.uncompleteSet' : 'workout.completeSet', {
          number: index + 1,
        })}
        onClick={onToggle}
        className={cn(
          'flex h-10 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          done
            ? 'bg-emerald-500 text-white'
            : 'bg-secondary text-muted-foreground',
        )}
      >
        <Check className="size-5" aria-hidden />
      </button>
    </li>
  );
}

export { SetRow };
