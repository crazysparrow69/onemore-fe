import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { useSignIn } from '@/features/auth/api/use-auth';
import { AuthScreen, OrDivider } from '@/features/auth/components/AuthScreen';
import { fieldError } from '@/features/auth/components/field-error';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { signInSchema, type SignInValues } from '@/features/auth/model/schema';

function SignInForm() {
  const { t } = useTranslation();
  const signIn = useSignIn();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  return (
    <AuthScreen title={t('auth.signIn.title')}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            signIn.mutate(values);
          })(event);
        }}
      >
        <TextField
          label={t('auth.signIn.email')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.signIn.emailPlaceholder')}
          error={fieldError(t, form.formState.errors.email?.message)}
          {...form.register('email')}
        />
        <TextField
          label={t('auth.signIn.password')}
          type="password"
          autoComplete="current-password"
          placeholder={t('auth.signIn.passwordPlaceholder')}
          error={fieldError(t, form.formState.errors.password?.message)}
          {...form.register('password')}
        />
        <Button
          type="submit"
          fullWidth
          disabled={!form.formState.isValid}
          loading={signIn.isPending}
        >
          {t('auth.signIn.submit')}
        </Button>
      </form>
      <OrDivider />
      <GoogleSignInButton />
      <Text size="sm" tone="muted" className="mt-6 text-center">
        <Link to="/sign-up" className="text-primary">
          {t('auth.signIn.switch')}
        </Link>
      </Text>
    </AuthScreen>
  );
}

export { SignInForm };
