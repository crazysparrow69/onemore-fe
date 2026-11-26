import type { ReactNode } from 'react';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { SheetActions } from '@/shared/ui/sheet-actions';

function ConfirmSheet({
  open,
  onOpenChange,
  title,
  cancelLabel,
  onCancel,
  confirmLabel,
  onConfirm,
  pending = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  cancelLabel: string;
  onCancel?: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  children?: ReactNode;
}) {
  return (
    <BottomSheet
      compact
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <SheetActions
          primaryVariant="destructive"
          secondary={{
            label: cancelLabel,
            onClick:
              onCancel ??
              (() => {
                onOpenChange(false);
              }),
          }}
          primary={{
            label: confirmLabel,
            onClick: onConfirm,
            loading: pending,
          }}
        />
      }
    >
      {children}
    </BottomSheet>
  );
}

export { ConfirmSheet };
