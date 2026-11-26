import { useTranslation } from 'react-i18next';
import { changeLabel } from '@/features/templates/model/summary';
import type { TemplateChange } from '@/features/templates/model/update-from-workout';
import { cn } from '@/shared/lib/utils';
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
    <section className="flex flex-col gap-3 rounded-xl bg-card p-4">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="flex w-full items-center justify-between gap-3 text-left outline-none focus-visible:underline"
        onClick={() => {
          onChange(!checked);
        }}
      >
        <span className="min-w-0 font-medium">
          {t('templates.update.toggle', { name })}
        </span>
        <span
          aria-hidden
          className={cn(
            'relative h-6 w-10 shrink-0 rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-secondary',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform',
              checked ? 'translate-x-4' : '',
            )}
          />
        </span>
      </button>
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
    </section>
  );
}

export { UpdateProgramToggle };
