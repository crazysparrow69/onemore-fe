import { cva, type VariantProps } from 'class-variance-authority';
import { type ElementType, type HTMLAttributes } from 'react';
import { Slot } from 'radix-ui';
import { cn } from '@/shared/lib/utils';

const cardVariants = cva('flex flex-col rounded-xl bg-card', {
  variants: {
    gap: { none: '', sm: 'gap-1', md: 'gap-3' },
    padding: { none: '', md: 'p-4' },
    interactive: {
      true: 'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
      false: '',
    },
  },
  defaultVariants: { gap: 'md', padding: 'md', interactive: false },
});

function Card({
  asChild = false,
  as: Tag = 'div',
  gap,
  padding,
  interactive,
  className,
  ...props
}: HTMLAttributes<HTMLElement> &
  VariantProps<typeof cardVariants> & {
    asChild?: boolean;
    as?: 'div' | 'section' | 'li';
  }) {
  const Comp: ElementType = asChild ? Slot.Root : Tag;

  return (
    <Comp
      data-slot="card"
      className={cn(cardVariants({ gap, padding, interactive }), className)}
      {...props}
    />
  );
}

export { Card };
