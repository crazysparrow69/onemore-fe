import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

function Switch({
  checked,
  onCheckedChange,
  className,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        'flex w-full items-center justify-between gap-3 text-left outline-none focus-visible:underline',
        className,
      )}
      onClick={() => {
        onCheckedChange(!checked);
      }}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-secondary',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : '',
          )}
        />
      </span>
    </button>
  );
}

export { Switch };
