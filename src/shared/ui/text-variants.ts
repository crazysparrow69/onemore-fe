import { cva, type VariantProps } from 'class-variance-authority';

export const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      accent: 'text-primary',
      danger: 'text-destructive',
    },
    numeric: {
      true: 'tabular-nums',
      false: '',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'default',
    weight: 'regular',
    numeric: false,
  },
});

export type TextVariantProps = VariantProps<typeof textVariants>;
