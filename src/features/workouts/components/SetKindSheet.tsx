import { Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SET_KINDS, type SetKind } from '@/features/workouts/model/draft';
import { cn } from '@/shared/lib/utils';
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
      <ul className="flex flex-col">
        {SET_KINDS.map((kind) => (
          <li key={kind}>
            <button
              type="button"
              onClick={() => {
                onKind(kind);
              }}
              className="flex w-full items-center justify-between gap-3 py-3 text-left text-base outline-none focus-visible:bg-accent"
            >
              <span>{t(`workout.kind.${kind}`)}</span>
              <Check
                className={cn(
                  'size-5 text-primary',
                  kind === current ? '' : 'invisible',
                )}
                aria-hidden
              />
            </button>
          </li>
        ))}
        <li className="border-t border-border">
          <button
            type="button"
            onClick={onRemove}
            className="flex w-full items-center gap-3 py-3 text-left text-base text-destructive outline-none focus-visible:bg-accent"
          >
            <Trash2 className="size-5" aria-hidden />
            {t('workout.removeSet')}
          </button>
        </li>
      </ul>
    </BottomSheet>
  );
}

export { SetKindSheet };
