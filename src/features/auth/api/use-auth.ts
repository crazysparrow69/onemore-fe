import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from '@/shared/lib/toast';
import {
  isAuthFailure,
  type AuthErrorCode,
} from '@/features/auth/api/auth-error';
import { authKeys } from '@/features/auth/api/auth.keys';
import {
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from '@/features/auth/api/auth.service';
import { fetchCurrentUser } from '@/features/auth/api/me.service';

type AuthMessageKey =
  | 'auth.errors.invalidCredentials'
  | 'auth.errors.emailTaken'
  | 'auth.errors.passwordTooShort'
  | 'auth.errors.network'
  | 'auth.errors.googleFailed'
  | 'auth.errors.generic';

const MESSAGE_KEYS: Record<AuthErrorCode, AuthMessageKey> = {
  invalidCredentials: 'auth.errors.invalidCredentials',
  emailTaken: 'auth.errors.emailTaken',
  passwordTooShort: 'auth.errors.passwordTooShort',
  network: 'auth.errors.network',
  googleFailed: 'auth.errors.googleFailed',
  generic: 'auth.errors.generic',
};

function messageKey(error: unknown): AuthMessageKey {
  if (!isAuthFailure(error)) {
    return 'auth.errors.generic';
  }
  return MESSAGE_KEYS[error.code];
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => fetchCurrentUser(),
  });
}

export function useSignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signUpWithEmail,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success(t('auth.toast.signedUp'));
      await navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(t(messageKey(error)));
    },
  });
}

export function useSignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signInWithEmail,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success(t('auth.toast.signedIn'));
      await navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(t(messageKey(error)));
    },
  });
}

export function useGoogleSignIn() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: signInWithGoogle,
    onError: (error) => {
      toast.error(t(messageKey(error)));
    },
  });
}

export function useSignOut() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: authKeys.all });
      toast.success(t('auth.toast.signedOut'));
      await navigate({ to: '/sign-in' });
    },
    onError: (error) => {
      toast.error(t(messageKey(error)));
    },
  });
}
