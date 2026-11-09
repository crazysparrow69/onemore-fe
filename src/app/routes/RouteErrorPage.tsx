import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';

export function RouteErrorPage({ reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <main className="flex flex-1 flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">{t('errors.generic.title')}</h1>
      <p className="text-muted-foreground">{t('errors.generic.description')}</p>
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
