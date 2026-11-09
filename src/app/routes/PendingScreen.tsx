import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui/skeleton';

export function PendingScreen() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t('common.loading')}
      className="flex flex-col gap-3 px-4 py-6"
    >
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
