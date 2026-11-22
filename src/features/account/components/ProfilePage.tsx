import { useTranslation } from 'react-i18next';
import { AccountScreen } from '@/features/account/components/AccountScreen';
import { ProfileForm } from '@/features/account/components/ProfileForm';

function ProfilePage() {
  const { t } = useTranslation();

  return (
    <AccountScreen title={t('profile.title')}>
      {(user) => <ProfileForm user={user} />}
    </AccountScreen>
  );
}

export { ProfilePage };
