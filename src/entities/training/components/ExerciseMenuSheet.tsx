import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActionItem, ActionList } from '@/shared/ui/action-list';
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

  return (
    <BottomSheet compact open={open} onOpenChange={onOpenChange} title={title}>
      <ActionList>
        <ActionItem
          icon={ArrowUp}
          disabled={!canMoveUp}
          onClick={() => {
            onMove(-1);
          }}
        >
          {t('workout.moveUp')}
        </ActionItem>
        <ActionItem
          icon={ArrowDown}
          disabled={!canMoveDown}
          onClick={() => {
            onMove(1);
          }}
        >
          {t('workout.moveDown')}
        </ActionItem>
        <ActionItem icon={Trash2} destructive onClick={onRemove}>
          {t('workout.removeExercise')}
        </ActionItem>
      </ActionList>
    </BottomSheet>
  );
}

export { ExerciseMenuSheet };
