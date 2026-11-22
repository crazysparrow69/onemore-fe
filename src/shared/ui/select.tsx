import { type ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  inputVariants,
  type InputVariantProps,
} from '@/shared/ui/input-variants';

function Select({
  className,
  variant = 'outline',
  ...props
}: ComponentProps<'select'> & InputVariantProps) {
  return (
    <select
      data-slot="select"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Select };
