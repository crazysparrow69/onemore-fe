import { type ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

function IconButton({
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & { 'aria-label': string }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors outline-none hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5',
        className,
      )}
      {...props}
    />
  );
}

export { IconButton };
