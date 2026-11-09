import { useTranslation } from 'react-i18next';
import { useCurrentUser, useSignOut } from '@/features/auth/api/use-auth';
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
      {user.data ? <Text>{user.data.email}</Text> : null}
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
