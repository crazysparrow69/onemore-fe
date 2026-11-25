import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExerciseCount } from '@/features/exercises/api/use-exercises';
import { FilterCard } from '@/features/exercises/components/FilterCard';
import { FilterThumb } from '@/features/exercises/components/FilterThumb';
import type { CatalogFilters } from '@/features/exercises/model/catalog-search';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';

export type FilterField = 'muscle' | 'equipment';

export interface FilterSection {
  id: string;
  label: string | null;
  options: { id: string; label: string }[];
}

function FilterSheet({
  open,
  onOpenChange,
  field,
  title,
  allLabel,
  sections,
  filters,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FilterField;
  title: string;
  allLabel: string;
  sections: FilterSection[];
  filters: CatalogFilters;
  onApply: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string[]>(filters[field]);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(filters[field]);
    }
  }
  const count = useExerciseCount({ ...filters, [field]: draft }, open);
  const total = count.data;

  function toggle(id: string) {
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
        <>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 px-3 text-sm"
            onClick={() => {
              setDraft([]);
            }}
          >
            {t('catalog.clearFilters')}
          </Button>
          <Button
            type="button"
            className="min-w-0 flex-1 px-3 text-sm"
            disabled={total === 0}
            onClick={() => {
              onApply(draft);
            }}
          >
            {total === undefined
              ? t('catalog.show')
              : t('catalog.showResults', { count: total })}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5">
          <FilterCard
            selected={draft.length === 0}
            label={allLabel}
            thumb={<FilterThumb id="all" />}
            onClick={() => {
              setDraft([]);
            }}
          />
        </div>
        {sections.map((section) => (
          <section key={section.id} className="flex flex-col gap-2.5">
            {section.label ? (
              <h3 className="text-sm font-medium text-muted-foreground">
                {section.label}
              </h3>
            ) : null}
            <div className="grid grid-cols-2 gap-2.5">
              {section.options.map((option) => (
                <FilterCard
                  key={option.id}
                  selected={draft.includes(option.id)}
                  label={option.label}
                  thumb={<FilterThumb id={option.id} />}
                  onClick={() => {
                    toggle(option.id);
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

export { FilterSheet };
