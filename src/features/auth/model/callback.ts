import { type QueryClient } from '@tanstack/react-query';
import { isRedirect, redirect } from '@tanstack/react-router';
import { i18n } from '@/shared/i18n';
import { toast } from '@/shared/lib/toast';
import { authKeys } from '@/features/auth/api/auth.keys';
import { getSession } from '@/features/auth/api/auth.service';
import { fetchCurrentUser } from '@/features/auth/api/me.service';

export async function completeSocialSignIn(
  queryClient: QueryClient,
): Promise<never> {
  try {
    const session = (await getSession()) ?? (await getSession());
    if (!session) {
      toast.error(i18n.t('auth.errors.googleFailed'));
      throw redirect({ to: '/sign-in' });
    }
    await fetchCurrentUser();
    await queryClient.invalidateQueries({ queryKey: authKeys.me() });
    toast.success(i18n.t('auth.toast.signedIn'));
    throw redirect({ to: '/' });
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }
    toast.error(i18n.t('auth.errors.googleFailed'));
    throw redirect({ to: '/sign-in' });
  }
}
