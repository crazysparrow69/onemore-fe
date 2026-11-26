import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import type { CurrentUser } from '@/features/auth/api/current-user.service';
import { Text } from '@/shared/ui/text';

function AccountScreen({
  title,
  children,
}: {
  title: string;
  children: (user: CurrentUser) => ReactNode;
}) {
  const { t } = useTranslation();
  const user = useCurrentUser();

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-8">
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          aria-label={t('common.back')}
          className="-ml-2 inline-flex size-10 items-center justify-center rounded-md hover:bg-accent"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <Text as="h1" size="xl" weight="semibold">
          {title}
        </Text>
      </div>
      {user.isPending ? <Text tone="muted">{t('common.loading')}</Text> : null}
      {user.isError ? (
        <Text tone="danger">{t('errors.generic.description')}</Text>
      ) : null}
      {user.data ? children(user.data) : null}
    </main>
  );
}

export { AccountScreen };
