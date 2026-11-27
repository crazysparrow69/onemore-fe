import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import type { CurrentUser } from '@/entities/user/api/current-user.service';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

function BodyScreen({
  title,
  backTo,
  children,
}: {
  title: string;
  backTo: '/profile' | '/body';
  children: (user: CurrentUser) => ReactNode;
}) {
  const { t } = useTranslation();
  const user = useCurrentUser();

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3">
        <Link
          to={backTo}
          aria-label={t('common.back')}
          className="-ml-2 inline-flex size-10 items-center justify-center rounded-md hover:bg-accent"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <Text as="h1" size="xl" weight="semibold">
          {title}
        </Text>
      </div>
      {user.isPending ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : null}
      {user.isError ? (
        <Text tone="danger">{t('errors.generic.description')}</Text>
      ) : null}
      {user.data ? children(user.data) : null}
    </main>
  );
}

export { BodyScreen };
