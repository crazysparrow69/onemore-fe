import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 disabled:bg-muted disabled:text-muted-foreground',
        ghost:
          'hover:bg-accent hover:text-accent-foreground disabled:text-muted-foreground',
        link: 'text-primary underline-offset-4 hover:underline disabled:text-muted-foreground',
      },
      size: {
        sm: 'h-9 min-h-9 px-3 text-sm',
        md: 'h-11 min-h-11 px-4 text-base',
        lg: 'h-12 min-h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
