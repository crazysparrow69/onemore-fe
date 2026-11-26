import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExerciseCount } from '@/entities/exercise/api/use-exercises';
import { FilterCard } from '@/features/exercises/components/FilterCard';
import { FilterThumb } from '@/features/exercises/components/FilterThumb';
import type { CatalogFilters } from '@/entities/exercise/model/catalog-search';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { SheetActions } from '@/shared/ui/sheet-actions';
import { Text } from '@/shared/ui/text';

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
        <SheetActions
          auxiliary
          secondary={{
            label: t('catalog.clearFilters'),
            onClick: () => {
              setDraft([]);
            },
          }}
          primary={{
            label:
              total === undefined
                ? t('catalog.show')
                : t('catalog.showResults', { count: total }),
            disabled: total === 0,
            onClick: () => {
              onApply(draft);
            },
          }}
        />
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
              <Text as="h3" size="sm" weight="medium" tone="muted">
                {section.label}
              </Text>
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
