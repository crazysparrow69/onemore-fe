import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  'w-full min-w-0 text-base outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        outline:
          'h-11 min-h-11 rounded-md border border-input bg-transparent px-3 py-1 shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        underline:
          'h-11 min-h-11 rounded-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0 aria-invalid:border-destructive',
      },
    },
    defaultVariants: {
      variant: 'underline',
    },
  },
);

export type InputVariantProps = VariantProps<typeof inputVariants>;
