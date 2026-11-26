import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry: () => void;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col items-start gap-3', className)}>
      <Text tone="danger">{message ?? t('errors.generic.description')}</Text>
      <Button type="button" variant="secondary" onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </div>
  );
}

function NotFoundState({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-3', className)}>
      <Text tone="muted">{message}</Text>
      <Button asChild variant="secondary">
        {children}
      </Button>
    </div>
  );
}

export { ErrorState, NotFoundState };
