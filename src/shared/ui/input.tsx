import { type ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  inputVariants,
  type InputVariantProps,
} from '@/shared/ui/input-variants';

function Input({
  className,
  type,
  variant,
  ...props
}: ComponentProps<'input'> & InputVariantProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Input };
