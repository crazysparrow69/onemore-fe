import { Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SET_KINDS, type SetKind } from '@/entities/training/model/draft';
import { cn } from '@/shared/lib/utils';
import { ActionItem, ActionList } from '@/shared/ui/action-list';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

function SetKindSheet({
  open,
  onOpenChange,
  number,
  current,
  onKind,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  number: number;
  current: SetKind;
  onKind: (kind: SetKind) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      compact
      open={open}
      onOpenChange={onOpenChange}
      title={t('workout.setMenu', { number })}
    >
      <ActionList>
        {SET_KINDS.map((kind) => (
          <ActionItem
            key={kind}
            trailing={
              <Check
                className={cn(
                  'size-5 text-primary',
                  kind === current ? '' : 'invisible',
                )}
                aria-hidden
              />
            }
            onClick={() => {
              onKind(kind);
            }}
          >
            <span>{t(`workout.kind.${kind}`)}</span>
          </ActionItem>
        ))}
        <ActionItem icon={Trash2} destructive onClick={onRemove}>
          {t('workout.removeSet')}
        </ActionItem>
      </ActionList>
    </BottomSheet>
  );
}

export { SetKindSheet };
