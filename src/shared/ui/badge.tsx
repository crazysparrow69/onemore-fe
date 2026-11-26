import { cva, type VariantProps } from 'class-variance-authority';
import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex shrink-0 items-center justify-center bg-secondary',
  {
    variants: {
      shape: {
        pill: 'rounded-full px-3 py-1 text-sm',
        round: 'size-6 rounded-full text-sm font-medium',
        square: 'size-8 rounded-lg text-sm font-semibold',
      },
    },
    defaultVariants: { shape: 'pill' },
  },
);

function Badge({
  shape,
  className,
  children,
}: VariantProps<typeof badgeVariants> & {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn(badgeVariants({ shape }), className)}>{children}</span>
  );
}

export { Badge };
