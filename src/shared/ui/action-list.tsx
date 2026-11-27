import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

function ActionList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col">{children}</ul>;
}

function ActionItem({
  icon: Icon,
  trailing,
  destructive = false,
  separated = destructive,
  disabled,
  role,
  checked,
  onClick,
  children,
}: {
  icon?: LucideIcon;
  trailing?: ReactNode;
  destructive?: boolean;
  separated?: boolean;
  disabled?: boolean;
  role?: 'switch';
  checked?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <li className={cn(separated && 'border-t border-border')}>
      <button
        type="button"
        role={role}
        aria-checked={checked}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          '-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-xl px-3 py-3 text-left text-base outline-none hover:bg-accent active:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-40',
          trailing !== undefined && 'justify-between',
          destructive && 'text-destructive',
        )}
      >
        {Icon ? <Icon className="size-5" aria-hidden /> : null}
        {children}
        {trailing}
      </button>
    </li>
  );
}

export { ActionItem, ActionList };
