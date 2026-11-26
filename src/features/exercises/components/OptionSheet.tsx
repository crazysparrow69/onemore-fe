import { useState } from 'react';
import { FilterCard } from '@/features/exercises/components/FilterCard';
import { FilterThumb } from '@/features/exercises/components/FilterThumb';
import { cn } from '@/shared/lib/utils';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { SheetActions } from '@/shared/ui/sheet-actions';

export interface OptionSection {
  id: string;
  label: string | null;
  options: { id: string; label: string; description?: string }[];
}

function OptionSheet({
  open,
  onOpenChange,
  title,
  sections,
  selected,
  multiple = false,
  columns = 2,
  thumbs = true,
  clearLabel,
  doneLabel,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sections: OptionSection[];
  selected: readonly string[];
  multiple?: boolean;
  columns?: 1 | 2;
  thumbs?: boolean;
  clearLabel: string;
  doneLabel: string;
  onApply: (ids: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>([...selected]);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft([...selected]);
    }
  }

  function pick(id: string) {
    if (!multiple) {
      onApply([id]);
      return;
    }
    setDraft((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        multiple ? (
          <SheetActions
            auxiliary
            secondary={{
              label: clearLabel,
              onClick: () => {
                setDraft([]);
              },
            }}
            primary={{
              label: doneLabel,
              onClick: () => {
                onApply(draft);
              },
            }}
          />
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <section key={section.id} className="flex flex-col gap-2.5">
            {section.label ? (
              <h3 className="text-sm font-medium text-muted-foreground">
                {section.label}
              </h3>
            ) : null}
            <div
              className={cn(
                'grid gap-2.5',
                columns === 2 ? 'grid-cols-2' : 'grid-cols-1',
              )}
            >
              {section.options.map((option) => (
                <FilterCard
                  key={option.id}
                  selected={(multiple ? draft : selected).includes(option.id)}
                  label={option.label}
                  description={option.description}
                  thumb={thumbs ? <FilterThumb id={option.id} /> : undefined}
                  onClick={() => {
                    pick(option.id);
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </BottomSheet>
  );
}

export { OptionSheet };
