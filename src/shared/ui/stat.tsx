import { type ReactNode } from 'react';
import { Text } from '@/shared/ui/text';
import { type TextVariantProps } from '@/shared/ui/text-variants';

function Stat({
  label,
  children,
  valueSize = 'sm',
  valueTone,
  numeric,
}: {
  label: string;
  children: ReactNode;
  valueSize?: TextVariantProps['size'];
  valueTone?: TextVariantProps['tone'];
  numeric?: boolean;
}) {
  return (
    <div>
      <Text as="dt" size="sm" tone="muted">
        {label}
      </Text>
      <Text
        as="dd"
        size={valueSize}
        tone={valueTone}
        weight="medium"
        numeric={numeric}
      >
        {children}
      </Text>
    </div>
  );
}

export { Stat };
