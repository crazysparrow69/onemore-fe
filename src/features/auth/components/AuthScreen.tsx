import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/text';

function AuthScreen({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col px-6 pt-10 pb-8">
      <Text as="h1" size="xl" weight="semibold" className="mb-8 text-center">
        {title}
      </Text>
      {children}
    </main>
  );
}

function OrDivider() {
  const { t } = useTranslation();

  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-border" />
      <Text size="sm" tone="muted">
        {t('auth.or')}
      </Text>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export { AuthScreen, OrDivider };
