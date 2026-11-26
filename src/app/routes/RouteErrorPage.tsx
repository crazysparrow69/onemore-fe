import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

export function RouteErrorPage({ reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <main className="flex flex-1 flex-col justify-center gap-4 px-4">
      <Text as="h1" size="2xl" weight="semibold">
        {t('errors.generic.title')}
      </Text>
      <Text tone="muted">{t('errors.generic.description')}</Text>
      <Button
        type="button"
        className="self-start"
        onClick={() => {
          reset();
          void router.invalidate();
        }}
      >
        {t('common.retry')}
      </Button>
    </main>
  );
}
