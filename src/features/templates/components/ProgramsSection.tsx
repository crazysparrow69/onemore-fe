import { FilePlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Template } from '@/features/templates/api/templates.service';
import { useTemplates } from '@/features/templates/api/use-templates';
import { StartDraftSheet } from '@/features/templates/components/StartDraftSheet';
import { useStartProgram } from '@/features/templates/model/use-start-program';
import { TemplateCard } from '@/features/templates/components/TemplateCard';
import { TemplateMenu } from '@/features/templates/components/TemplateMenu';
import { useEditorLaunch } from '@/features/templates/model/use-launch';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

function ProgramsSection() {
  const { t } = useTranslation();
  const templates = useTemplates();
  const launch = useEditorLaunch();
  const start = useStartProgram();
  const [menu, setMenu] = useState<Template | null>(null);
  const items = templates.data?.items;

  return (
    <section className="flex flex-col gap-3">
      <Text as="h2" size="lg" weight="semibold">
        {t('templates.title')}
      </Text>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        disabled={!launch.ready}
        leftIcon={<FilePlus aria-hidden />}
        onClick={launch.newProgram}
      >
        {t('templates.new')}
      </Button>

      {templates.isPending ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : null}

      {templates.isError ? (
        <Card>
          <ErrorState
            message={t('templates.loadError')}
            onRetry={() => {
              void templates.refetch();
            }}
          />
        </Card>
      ) : null}

      {items?.length === 0 ? (
        <Card gap="sm">
          <Text weight="medium">{t('templates.empty')}</Text>
          <Text size="sm" tone="muted">
            {t('templates.emptyHint')}
          </Text>
        </Card>
      ) : null}

      {items && items.length > 0 ? (
        <>
          <Text size="sm" tone="muted">
            {t('templates.mine', { total: items.length })}
          </Text>
          <ul className="flex flex-col gap-3">
            {items.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                startDisabled={!start.ready}
                onStart={() => {
                  start.begin(template);
                }}
                onMenu={() => {
                  setMenu(template);
                }}
              />
            ))}
          </ul>
        </>
      ) : null}

      <TemplateMenu
        template={menu}
        onClose={() => {
          setMenu(null);
        }}
      />
      <StartDraftSheet {...start.sheet} />
    </section>
  );
}

export { ProgramsSection };
