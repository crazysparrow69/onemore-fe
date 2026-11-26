import { useTranslation } from 'react-i18next';
import { changeLabel } from '@/features/templates/model/summary';
import type { TemplateChange } from '@/features/templates/model/update-from-workout';
import { Card } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Text } from '@/shared/ui/text';

const MAX_SHOWN = 5;

function UpdateProgramToggle({
  name,
  changes,
  checked,
  onChange,
}: {
  name: string;
  changes: readonly TemplateChange[];
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  const shown = changes.slice(0, MAX_SHOWN);
  const hidden = changes.length - shown.length;

  return (
    <Card as="section">
      <Switch checked={checked} onCheckedChange={onChange}>
        <Text as="span" weight="medium" className="min-w-0">
          {t('templates.update.toggle', { name })}
        </Text>
      </Switch>
      <Text size="sm" tone="muted">
        {t('templates.update.hint')}
      </Text>
      {checked ? (
        <ul className="flex flex-col gap-1 text-sm">
          {shown.map((change, index) => (
            <li key={index}>{changeLabel(change, t)}</li>
          ))}
          {hidden > 0 ? (
            <li className="text-muted-foreground">
              {t('templates.update.more', { count: hidden })}
            </li>
          ) : null}
        </ul>
      ) : null}
    </Card>
  );
}

export { UpdateProgramToggle };
