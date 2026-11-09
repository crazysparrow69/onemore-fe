import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { textVariants, type TextVariantProps } from '@/shared/ui/text-variants';

type TextTag = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'label';

type TextProps = TextVariantProps & {
  as?: TextTag;
  className?: string;
  children?: ReactNode;
  id?: string;
  htmlFor?: string;
};

function Text({
  as = 'p',
  size,
  tone,
  weight,
  className,
  children,
  id,
  htmlFor,
}: TextProps) {
  const Comp = as;

  return (
    <Comp
      id={id}
      htmlFor={as === 'label' ? htmlFor : undefined}
      className={cn(textVariants({ size, tone, weight }), className)}
    >
      {children}
    </Comp>
  );
}

export { Text };
