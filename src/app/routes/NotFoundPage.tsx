import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-1 flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <p className="text-muted-foreground">{t('notFound.description')}</p>
      <Button asChild className="self-start">
        <Link to="/">{t('notFound.home')}</Link>
      </Button>
    </main>
  );
}
