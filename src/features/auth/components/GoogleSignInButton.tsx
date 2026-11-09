import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { useGoogleSignIn } from '@/features/auth/api/use-auth';
import { GoogleIcon } from '@/features/auth/components/GoogleIcon';

function GoogleSignInButton() {
  const { t } = useTranslation();
  const google = useGoogleSignIn();

  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth
      leftIcon={<GoogleIcon />}
      loading={google.isPending}
      onClick={() => {
        google.mutate();
      }}
    >
      {t('auth.google')}
    </Button>
  );
}

export { GoogleSignInButton };
