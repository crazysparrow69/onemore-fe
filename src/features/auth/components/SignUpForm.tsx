import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { useSignUp } from '@/features/auth/api/use-auth';
import { AuthScreen, OrDivider } from '@/features/auth/components/AuthScreen';
import { fieldError } from '@/features/auth/components/field-error';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { signUpSchema, type SignUpValues } from '@/features/auth/model/schema';

function SignUpForm() {
  const { t } = useTranslation();
  const signUp = useSignUp();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '', username: '' },
  });

  return (
    <AuthScreen title={t('auth.signUp.title')}>
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            signUp.mutate(values);
          })(event);
        }}
      >
        <TextField
          label={t('auth.signUp.email')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.signUp.emailPlaceholder')}
          error={fieldError(t, form.formState.errors.email?.message)}
          {...form.register('email')}
        />
        <TextField
          label={t('auth.signUp.password')}
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.signUp.passwordPlaceholder')}
          error={fieldError(t, form.formState.errors.password?.message)}
          {...form.register('password')}
        />
        <TextField
          label={t('auth.signUp.username')}
          type="text"
          autoComplete="username"
          placeholder={t('auth.signUp.usernamePlaceholder')}
          error={fieldError(t, form.formState.errors.username?.message)}
          {...form.register('username')}
        />
        <Button type="submit" fullWidth loading={signUp.isPending}>
          {t('auth.signUp.submit')}
        </Button>
      </form>
      <OrDivider />
      <GoogleSignInButton />
      <Text size="sm" tone="muted" className="mt-6 text-center">
        <Link to="/sign-in" className="text-primary">
          {t('auth.signUp.switch')}
        </Link>
      </Text>
    </AuthScreen>
  );
}

export { SignUpForm };
