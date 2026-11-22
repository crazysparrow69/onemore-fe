import { useId } from 'react';
import { cn } from '@/shared/lib/utils';
import { Text } from '@/shared/ui/text';

interface Option<T extends string> {
  value: T;
  label: string;
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2">
      <Text as="span" id={labelId} size="sm" tone="muted">
        {label}
      </Text>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid auto-cols-fr grid-flow-col gap-1 rounded-md border border-input p-1"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn(
                'h-9 rounded-sm text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                selected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent',
              )}
              onClick={() => {
                onChange(option.value);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SegmentedControl };
