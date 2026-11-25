import { Check } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

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
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl bg-secondary p-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50',
        selected ? 'ring-2 ring-primary' : '',
      )}
    >
      {thumb}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm leading-tight font-medium">{label}</span>
        {description ? (
          <span className="text-xs leading-tight text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {selected ? (
        <Check className="size-4 shrink-0 text-primary" aria-hidden />
      ) : null}
    </button>
  );
}

export { FilterCard };
