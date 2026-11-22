import { useTranslation } from 'react-i18next';
import { AccountScreen } from '@/features/account/components/AccountScreen';
import { SettingsForm } from '@/features/account/components/SettingsForm';

function SettingsPage() {
  const { t } = useTranslation();

  return (
    <AccountScreen title={t('settings.title')}>
      {(user) => <SettingsForm user={user} />}
    </AccountScreen>
  );
}

export { SettingsPage };
