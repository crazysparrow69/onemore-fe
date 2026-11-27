import { useTranslation } from 'react-i18next';
import type { WeightEntry } from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import { WeightForm } from '@/features/body/components/WeightForm';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

function WeightEntrySheet({
  open,
  onOpenChange,
  entry,
  units,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: WeightEntry | null;
  units: Units;
  onDelete?: (entry: WeightEntry) => void;
}) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      compact
      open={open}
      onOpenChange={onOpenChange}
      title={entry ? t('weight.edit') : t('weight.add')}
    >
      <WeightForm
        entry={entry}
        units={units}
        onSaved={() => {
          onOpenChange(false);
        }}
        secondary={
          entry && onDelete
            ? {
                label: t('weight.delete'),
                onClick: () => {
                  onDelete(entry);
                },
              }
            : undefined
        }
      />
    </BottomSheet>
  );
}

export { WeightEntrySheet };
