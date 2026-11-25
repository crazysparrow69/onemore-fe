import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { initials } from '@/features/account/model/initials';
import { useCurrentUser, useSignOut } from '@/features/auth/api/use-auth';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

export function HomePage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const signOut = useSignOut();

  return (
    <main className="flex flex-1 flex-col justify-center gap-4 px-4">
      <Text as="h1" size="2xl" weight="semibold">
        {t('home.title')}
      </Text>
      <Text tone="muted">{t('home.subtitle')}</Text>
      {user.isPending ? <Text tone="muted">{t('common.loading')}</Text> : null}
      {user.isError ? (
        <Text tone="danger">{t('errors.generic.description')}</Text>
      ) : null}
      {user.data ? (
        <Link to="/profile" className="flex items-center gap-3 self-start">
          <Avatar initials={initials(user.data)} />
          <span className="flex flex-col">
            <Text weight="medium">{user.data.name ?? user.data.email}</Text>
            {user.data.nickname ? (
              <Text size="sm" tone="muted">
                @{user.data.nickname}
              </Text>
            ) : null}
          </span>
        </Link>
      ) : null}
      <Button asChild className="self-start">
        <Link to="/exercises">{t('home.exercises')}</Link>
      </Button>
      <Link to="/settings" className="self-start text-primary">
        {t('home.settings')}
      </Link>
      <Button
        type="button"
        className="self-start"
        loading={signOut.isPending}
        onClick={() => {
          signOut.mutate();
        }}
      >
        {t('home.signOut')}
      </Button>
    </main>
  );
}
