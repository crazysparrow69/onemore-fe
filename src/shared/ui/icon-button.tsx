import { type ComponentProps } from 'react';
import { Slot } from 'radix-ui';
import { cn } from '@/shared/lib/utils';

function IconButton({
  className,
  type = 'button',
  asChild = false,
  ...props
}: ComponentProps<'button'> & { 'aria-label': string; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors outline-none hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5',
        className,
      )}
      {...props}
    />
  );
}

export { IconButton };
