import { useTranslation } from 'react-i18next';
import type { WeightEntry } from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import { dateLabel } from '@/entities/training/model/display';
import { formatWeight } from '@/entities/training/model/format';
import { unitLabel } from '@/features/body/model/labels';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

function WeightRow({
  entry,
  units,
  onSelect,
}: {
  entry: WeightEntry;
  units: Units;
  onSelect: (entry: WeightEntry) => void;
}) {
  const { t, i18n } = useTranslation();
  const date = dateLabel(entry.localDate, i18n.language);
  const value = formatWeight(entry.weightKg, units, i18n.language);
  const unit = unitLabel(t, units);

  return (
    <Button
      type="button"
      variant="card"
      size="auto"
      className="justify-between gap-3"
      aria-label={t('weight.row', { date, value, unit })}
      onClick={() => {
        onSelect(entry);
      }}
    >
      <span className="flex min-w-0 flex-col items-start">
        <Text as="span">{date}</Text>
        {entry.note ? (
          <Text
            as="span"
            size="sm"
            tone="muted"
            className="max-w-full truncate"
          >
            {entry.note}
          </Text>
        ) : null}
      </span>
      <Text as="span" weight="semibold" numeric>
        {value} {unit}
      </Text>
    </Button>
  );
}

export { WeightRow };
