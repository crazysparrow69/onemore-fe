import { cn } from '@/shared/lib/utils';

function Avatar({
  initials,
  size = 'md',
  className,
}: {
  initials: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-slot="avatar"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground select-none',
        size === 'lg' ? 'size-20 text-2xl' : 'size-10 text-base',
        className,
      )}
    >
      {initials}
    </span>
  );
}

export { Avatar };
