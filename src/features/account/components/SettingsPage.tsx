import { useTranslation } from 'react-i18next';
import { AccountScreen } from '@/features/account/components/AccountScreen';
import { SettingsForm } from '@/features/account/components/SettingsForm';
import { useSignOut } from '@/features/auth/api/use-auth';
import { Button } from '@/shared/ui/button';

function SettingsPage() {
  const { t } = useTranslation();
  const signOut = useSignOut();

  return (
    <AccountScreen title={t('settings.title')}>
      {(user) => (
        <>
          <SettingsForm user={user} />
          <Button
            type="button"
            variant="secondary"
            fullWidth
            loading={signOut.isPending}
            onClick={() => {
              signOut.mutate();
            }}
          >
            {t('settings.signOut')}
          </Button>
        </>
      )}
    </AccountScreen>
  );
}

export { SettingsPage };
