import { createApiClient } from '@/shared/api/client';
import {
  getAccessToken,
  refreshAccessToken,
  signOut,
} from '@/features/auth/api/auth.service';

async function leaveSession(): Promise<void> {
  try {
    await signOut();
  } catch {
    // The session is already gone.
  }
  const { router } = await import('@/app/router');
  await router.navigate({ to: '/sign-in' });
}

export const api = createApiClient({
  getAccessToken,
  refreshAccessToken,
  onUnauthorized: () => {
    void leaveSession();
  },
});
