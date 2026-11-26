import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-1 flex-col justify-center gap-4 px-4">
      <Text as="h1" size="2xl" weight="semibold">
        {t('notFound.title')}
      </Text>
      <Text tone="muted">{t('notFound.description')}</Text>
      <Button asChild className="self-start">
        <Link to="/">{t('notFound.home')}</Link>
      </Button>
    </main>
  );
}
