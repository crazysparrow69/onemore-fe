import { Check } from 'lucide-react';
import { type ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

function FilterCard({
  selected,
  disabled = false,
  label,
  description,
  thumb,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  label: string;
  description?: string;
  thumb?: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="option"
      size="auto"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className="justify-start gap-3 p-2.5 disabled:opacity-50"
    >
      {thumb}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text as="span" size="sm" weight="medium" className="leading-tight">
          {label}
        </Text>
        {description ? (
          <Text as="span" size="xs" tone="muted" className="leading-tight">
            {description}
          </Text>
        ) : null}
      </span>
      {selected ? (
        <Check className="size-4 shrink-0 text-primary" aria-hidden />
      ) : null}
    </Button>
  );
}

export { FilterCard };
