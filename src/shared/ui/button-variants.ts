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
        destructive:
          'bg-secondary text-destructive hover:bg-secondary/80 active:bg-secondary/70 disabled:bg-muted disabled:text-muted-foreground',
        ghost:
          'hover:bg-accent hover:text-accent-foreground disabled:text-muted-foreground',
        link: 'text-primary underline-offset-4 hover:underline disabled:text-muted-foreground',
        success:
          'bg-emerald-500 text-white hover:bg-emerald-500/90 disabled:bg-muted disabled:text-muted-foreground',
        card: 'justify-start bg-card text-foreground font-medium hover:bg-card/80 disabled:opacity-60',
        option:
          'justify-between bg-secondary text-left font-normal whitespace-normal text-foreground hover:bg-secondary/80 aria-pressed:ring-2 aria-pressed:ring-primary aria-invalid:ring-2 aria-invalid:ring-destructive disabled:opacity-60',
        row: 'justify-start text-left font-normal whitespace-normal text-foreground hover:bg-accent active:bg-accent aria-pressed:bg-primary/15',
        bare: '',
      },
      size: {
        sm: 'h-9 min-h-9 px-3 text-sm',
        md: 'h-11 min-h-11 px-4 text-base',
        lg: 'h-12 min-h-12 px-6 text-base',
        control: 'h-10 min-h-10 rounded-lg px-3 text-sm',
        cell: 'h-10 min-h-10 rounded-lg px-0 text-base',
        chip: 'h-auto rounded-full px-4 py-1.5 text-sm',
        auto: 'h-auto min-h-0 rounded-xl px-4 py-3 text-base',
        row: 'h-auto min-h-0 -mx-3 w-[calc(100%+1.5rem)] rounded-xl px-3 py-2.5 text-base',
        none: 'rounded-none',
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
