import { type ComponentProps, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/shared/lib/utils';
import {
  buttonVariants,
  type ButtonVariantProps,
} from '@/shared/ui/button-variants';

function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  leftIcon,
  disabled,
  children,
  ...props
}: ComponentProps<'button'> &
  ButtonVariantProps & {
    asChild?: boolean;
    loading?: boolean;
    leftIcon?: ReactNode;
  }) {
  const Comp = asChild ? Slot.Root : 'button';
  const isDisabled = Boolean(disabled) || loading;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            leftIcon
          )}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button };
