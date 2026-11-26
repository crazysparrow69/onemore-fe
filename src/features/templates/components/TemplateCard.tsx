import { Link } from '@tanstack/react-router';
import { Ellipsis } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Template } from '@/features/templates/api/templates.service';
import {
  exercisesLine,
  lastPerformedLabel,
} from '@/features/templates/model/summary';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Text } from '@/shared/ui/text';

function TemplateCard({
  template,
  startDisabled,
  onStart,
  onMenu,
}: {
  template: Template;
  startDisabled: boolean;
  onStart: () => void;
  onMenu: () => void;
}) {
  const { t, i18n } = useTranslation();
  const last = lastPerformedLabel(template, new Date(), i18n.language, t);

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4">
      <div className="flex items-start gap-2">
        <Link
          to="/programs/$programId"
          params={{ programId: template.id }}
          className="flex min-w-0 flex-1 flex-col gap-1 outline-none focus-visible:underline"
        >
          <Text as="h3" size="lg" weight="semibold" className="truncate">
            {template.name}
          </Text>
          <Text size="sm" tone="muted" className="line-clamp-2">
            {exercisesLine(template)}
          </Text>
          {last ? (
            <Text size="sm" tone="muted">
              {last}
            </Text>
          ) : null}
        </Link>
        <IconButton
          aria-label={t('templates.menu', { name: template.name })}
          className="-mt-1 -mr-2 bg-transparent"
          onClick={onMenu}
        >
          <Ellipsis aria-hidden />
        </IconButton>
      </div>
      <Button
        type="button"
        fullWidth
        disabled={startDisabled}
        onClick={onStart}
      >
        {t('templates.start')}
      </Button>
    </li>
  );
}

export { TemplateCard };
