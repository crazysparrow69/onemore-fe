import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

function ExerciseMenuSheet({
  open,
  onOpenChange,
  title,
  canMoveUp,
  canMoveDown,
  onMove,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const itemClass =
    'flex w-full items-center gap-3 py-3 text-left text-base outline-none focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-40';

  return (
    <BottomSheet compact open={open} onOpenChange={onOpenChange} title={title}>
      <ul className="flex flex-col">
        <li>
          <button
            type="button"
            disabled={!canMoveUp}
            className={itemClass}
            onClick={() => {
              onMove(-1);
            }}
          >
            <ArrowUp className="size-5" aria-hidden />
            {t('workout.moveUp')}
          </button>
        </li>
        <li>
          <button
            type="button"
            disabled={!canMoveDown}
            className={itemClass}
            onClick={() => {
              onMove(1);
            }}
          >
            <ArrowDown className="size-5" aria-hidden />
            {t('workout.moveDown')}
          </button>
        </li>
        <li className="border-t border-border">
          <button
            type="button"
            className={`${itemClass} text-destructive`}
            onClick={onRemove}
          >
            <Trash2 className="size-5" aria-hidden />
            {t('workout.removeExercise')}
          </button>
        </li>
      </ul>
    </BottomSheet>
  );
}

export { ExerciseMenuSheet };
