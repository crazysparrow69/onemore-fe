import { Dialog } from 'radix-ui';
import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const CLOSE_DISTANCE_PX = 80;

function BottomSheet({
  open,
  onOpenChange,
  title,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  function finishDrag() {
    if (startY.current === null) {
      return;
    }
    startY.current = null;
    setDragging(false);
    if (offset > CLOSE_DISTANCE_PX) {
      onOpenChange(false);
    }
    setOffset(0);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          style={
            offset > 0
              ? { transform: `translateY(${String(offset)}px)` }
              : undefined
          }
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85dvh] w-full max-w-md flex-col rounded-t-2xl bg-card outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
            dragging ? '' : 'transition-transform',
          )}
        >
          <div
            className="flex shrink-0 touch-none flex-col items-center gap-3 px-4 pt-3 pb-3"
            onPointerDown={(event) => {
              startY.current = event.clientY;
              setDragging(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (startY.current !== null) {
                setOffset(Math.max(0, event.clientY - startY.current));
              }
            }}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            <div className="h-1 w-10 rounded-full bg-muted-foreground/50" />
            <Dialog.Title className="text-base font-semibold">
              {title}
            </Dialog.Title>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
            {children}
          </div>
          {footer ? (
            <div className="flex shrink-0 gap-3 border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { BottomSheet };
