import { Search, X } from 'lucide-react';
import { type ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

function SearchField({
  value,
  onValueChange,
  clearLabel,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onValueChange: (value: string) => void;
  clearLabel: string;
}) {
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 rounded-[10px] bg-secondary px-3 focus-within:ring-[3px] focus-within:ring-ring/50',
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value.length > 0 ? (
        <button
          type="button"
          aria-label={clearLabel}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-foreground/40 text-foreground"
          onClick={() => {
            onValueChange('');
          }}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export { SearchField };
