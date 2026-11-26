import { useTranslation } from 'react-i18next';
import type { Units } from '@/entities/user/api/current-user.service';
import type {
  EditorExercise,
  EditorSet,
} from '@/features/templates/model/editor';
import { setGridTemplate } from '@/features/templates/model/grid';
import { columnLabelKey } from '@/entities/training/model/columns';
import { setMark } from '@/entities/training/model/display';
import {
  acceptsInput,
  FIELD_KEYS,
  type SetValueKey,
} from '@/entities/training/model/draft';
import { SetKindButton } from '@/entities/training/components/SetKindButton';
import { Input } from '@/shared/ui/input';

const INPUT_MODES: Readonly<
  Record<SetValueKey, 'decimal' | 'numeric' | 'text'>
> = {
  weight: 'decimal',
  reps: 'numeric',
  duration: 'numeric',
  distance: 'decimal',
};

function TemplateSetRow({
  exercise,
  units,
  set,
  number,
  index,
  onKind,
  onChange,
}: {
  exercise: EditorExercise;
  units: Units;
  set: EditorSet;
  number: number;
  index: number;
  onKind: () => void;
  onChange: (key: SetValueKey, value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <li
      className="grid items-center gap-2 py-1"
      style={{ gridTemplateColumns: setGridTemplate(exercise.fields.length) }}
    >
      <SetKindButton
        kind={set.kind}
        mark={setMark(set.kind, number, t)}
        label={t('workout.setMenu', { number: index + 1 })}
        onClick={onKind}
      />
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
            aria-label={`${t('workout.setMenu', { number: index + 1 })}: ${t(columnLabelKey(rule, units))}`}
            onChange={(event) => {
              const next = event.target.value;
              if (acceptsInput(key, next)) {
                onChange(key, next);
              }
            }}
          />
        );
      })}
    </li>
  );
}

export { TemplateSetRow };
